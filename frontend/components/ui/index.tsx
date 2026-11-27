"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/frontend/lib/utils";
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { Button, type ButtonProps } from "./button";

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-baseline justify-between gap-3 text-[0.8125rem] font-medium text-ink"
        >
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-mute">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-mute">{hint}</p>
      ) : null}
    </div>
  );
}

const fieldBase =
  "w-full rounded-md border border-line bg-surface px-3.5 text-[0.9375rem] text-ink transition-colors placeholder:text-mute/70 hover:border-[#b9b0a0] focus:border-cobalt focus:outline-2 focus:outline-offset-2 focus:outline-cobalt/45 disabled:cursor-not-allowed disabled:bg-sand/40 disabled:text-mute aria-[invalid=true]:border-danger aria-[invalid=true]:focus:outline-danger/40";

export function Input({
  className,
  invalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "h-11", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "min-h-28 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(fieldBase, "h-11 cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronRight
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 rotate-90 text-mute"
      />
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-start gap-2.5 text-sm text-ink", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[3px] border border-line accent-cobalt"
        {...props}
      />
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
}

export function Radio({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-start gap-2.5 text-sm text-ink", className)}>
      <input
        type="radio"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-cobalt"
        {...props}
      />
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article" | "form";
}) {
  return (
    <Tag className={cn("surface-card", className)}>{children}</Tag>
  );
}

export function CardHeader({
  title,
  eyebrow,
  description,
  action,
  className,
}: {
  title: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="meta-label mb-2">{eyebrow}</p>}
        <h2 className="display display-sm">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot,
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "tint" | "success" | "warning" | "danger" | "solid" | "lavender" | "sky";
  dot?: boolean;
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-sand text-mute border-transparent",
    blue: "bg-tint text-cobalt border-transparent",
    tint: "bg-tint text-cobalt border-transparent",
    success: "bg-success-soft text-success border-transparent",
    warning: "bg-warning-soft text-warning border-transparent",
    danger: "bg-danger-soft text-danger border-transparent",
    solid: "bg-cobalt text-white border-transparent",
    lavender: "bg-[#E9E3F6] text-[#4B3C7A] border-transparent",
    sky: "bg-[#E1F0F4] text-[#235A66] border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[0.6875rem] font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Parameters<typeof Badge>[0]["tone"]; label?: string }> = {
    draft: { tone: "neutral" },
    published: { tone: "tint" },
    ongoing: { tone: "solid" },
    completed: { tone: "success" },
    in_progress: { tone: "lavender" },
    submitted: { tone: "sky" },
    auto_submitted: { tone: "warning" },
    graded: { tone: "success" },
    not_started: { tone: "neutral", label: "not started" },
    pending: { tone: "warning" },
    approved: { tone: "success" },
    rejected: { tone: "danger" },
  };
  const entry = map[status] ?? { tone: "neutral" as const };
  const label = entry.label ?? status.replace(/_/g, "_");
  return <Badge tone={entry.tone}>{label}</Badge>;
}

export function StatTile({
  label,
  value,
  note,
  size = "md",
  className,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Card className={cn("px-6 py-5", className)}>
      <p className="meta-label">{label}</p>
      <p
        className={cn(
          "num mt-2 leading-none text-cobalt",
          size === "lg" ? "text-[2.6rem]" : "text-[2.15rem]",
        )}
      >
        {value}
      </p>
      {note && <p className="mt-3 text-[0.8125rem] leading-snug text-mute">{note}</p>}
    </Card>
  );
}

export function ProgressBar({
  value,
  total,
  className,
  tone = "cobalt",
  label,
}: {
  value: number;
  total: number;
  className?: string;
  tone?: "cobalt" | "warning" | "success" | "danger";
  label?: string;
}) {
  const pct = total <= 0 ? 0 : Math.min(100, Math.max(0, (value / total) * 100));
  const tones = {
    cobalt: "bg-cobalt",
    warning: "bg-warning",
    success: "bg-success",
    danger: "bg-danger",
  };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-tint", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-all", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-sand">{children}</thead>;
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-5 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-mute",
        className,
      )}
      scope="col"
    >
      {children}
    </th>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("border-t border-line-soft first:border-t-0", className)}>{children}</tr>
  );
}

export function Td({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-5 py-3.5 align-middle text-[0.875rem]", className)} {...props}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 border-b border-line", className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[0.875rem] transition-colors",
              active
                ? "border-cobalt font-medium text-cobalt"
                : "border-transparent text-mute hover:text-ink",
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span className="num text-[0.6875rem] text-mute">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function LinkTabs({
  items,
  active,
}: {
  items: { href: string; label: string }[];
  active: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line">
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative -mb-px border-b-2 px-4 py-3 text-[0.875rem] transition-colors",
              isActive
                ? "border-cobalt font-medium text-cobalt"
                : "border-transparent text-mute hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal / Drawer                                                      */
/* ------------------------------------------------------------------ */

const widths = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  footer,
  width = "md",
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: keyof typeof widths;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/35 px-4 py-[6vh] backdrop-blur-[1px]">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative z-10 w-full rounded-[10px] border border-line bg-surface p-7 shadow-[0_24px_60px_-30px_rgba(19,40,70,0.5)] sm:p-9",
          widths[width],
        )}
      >
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 id={labelledBy} className="display display-md text-balance">
          {title}
        </h2>
        {description && (
          <div className="mt-3 text-[0.9375rem] leading-relaxed text-mute">{description}</div>
        )}
        {children && <div className="mt-6">{children}</div>}
        {footer && <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-5">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  widthClass,
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "bottom";
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const positions =
    side === "bottom"
      ? "inset-x-0 bottom-0 max-h-[86vh] w-full rounded-t-[14px] border-t"
      : side === "left"
        ? "inset-y-0 left-0 h-full w-full max-w-md border-r"
        : "inset-y-0 right-0 h-full w-full max-w-lg border-l";

  return (
    <div className="fixed inset-0 z-[75] flex bg-ink/30">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "relative flex flex-col border-line bg-surface shadow-[0_20px_60px_-30px_rgba(19,40,70,0.5)]",
          positions,
          widthClass,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2 className="display display-sm mt-1">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1.5 text-mute transition hover:bg-sand hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</div>
        {footer && <div className="border-t border-line p-5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  eyebrow = "Confirm action",
  title,
  description,
  warning,
  warningDetail,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  warning?: string;
  warningDetail?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {warning && (
        <div className="rounded-md border border-warning/25 bg-warning-soft px-4 py-3.5">
          <p className="text-sm font-medium text-warning">{warning}</p>
          {warningDetail && <p className="mt-1 text-xs leading-relaxed text-ink/75">{warningDetail}</p>}
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sand", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[10px] border border-dashed border-line px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-line bg-surface text-cobalt">
        {icon ?? <FileText className="size-5" strokeWidth={1.6} />}
      </div>
      <h3 className="display display-sm">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-mute">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "We could not load this page",
  description = "Something went wrong. Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col items-center px-6 py-14 text-center", className)}>
      <CircleAlert className="size-6 text-danger" strokeWidth={1.6} />
      <h3 className="display display-sm mt-4">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-mute">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-10 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-cobalt hover:underline"
    >
      <ArrowLeft className="size-3.5" />
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  children,
  ...props
}: ButtonProps & { label: string }) {
  return (
    <Button variant="quiet" size="icon" aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
}
