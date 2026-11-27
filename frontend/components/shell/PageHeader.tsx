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
        "animate-rise mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-10",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="sr-only">{eyebrow}</p>
        <h1 className="display display-lg text-balance">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[1rem] leading-relaxed text-mute">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div>}
    </div>
  );
}
