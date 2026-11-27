import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/frontend/lib/utils";

export const buttonStyles = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full border font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-cobalt bg-cobalt text-on-cobalt hover:border-cobalt-deep hover:bg-cobalt-deep",
        secondary:
          "border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-paper",
        outline:
          "border-line-strong bg-transparent text-ink hover:border-ink/40 hover:bg-sand",
        ghost:
          "border-transparent bg-transparent text-ink hover:bg-sand",
        quiet:
          "border-transparent bg-transparent text-ink hover:bg-sand",
        danger:
          "border-danger bg-danger text-on-danger hover:bg-danger-deep hover:border-danger-deep",
        soft: "border-transparent bg-sand text-ink hover:bg-line",
      },
      size: {
        md: "h-10 px-5 text-[0.9375rem]",
        sm: "h-8 px-3.5 text-[0.8125rem]",
        lg: "h-12 px-7 text-base",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    />
  );
}
