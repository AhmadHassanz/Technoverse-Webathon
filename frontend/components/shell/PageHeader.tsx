import { cn } from "@/frontend/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-rise mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="eyebrow">
          <span aria-hidden className="size-1.5 rounded-full bg-lime ring-2 ring-cobalt/20" />
          {eyebrow}
        </p>
        <h1 className="display display-lg mt-2.5 text-balance">{title}</h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-mute">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div>}
    </div>
  );
}
