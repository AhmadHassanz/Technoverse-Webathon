import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/frontend/lib/utils";

export const buttonStyles = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-[10px] border font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-cobalt bg-cobalt text-on-cobalt shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-8px_var(--cobalt)] hover:border-cobalt-deep hover:bg-cobalt-deep",
        secondary:
          "border-line bg-surface text-ink shadow-[0_1px_2px_rgb(13_19_36/0.05)] hover:border-line-strong hover:bg-paper",
        outline:
          "border-cobalt/40 bg-transparent text-cobalt hover:bg-tint",
        ghost:
          "border-transparent bg-transparent text-cobalt hover:bg-tint",
        quiet:
          "border-transparent bg-transparent text-ink hover:bg-sand",
        danger:
          "border-danger bg-danger text-on-danger hover:bg-danger-deep hover:border-danger-deep",
        soft: "border-transparent bg-tint text-cobalt hover:bg-tint-strong",
      },
      size: {
        md: "h-10 px-4 text-[0.875rem]",
        sm: "h-8 rounded-[8px] px-3 text-[0.8125rem]",
        lg: "h-12 rounded-[12px] px-6 text-[0.9375rem]",
        icon: "size-10 p-0",
        "icon-sm": "size-8 rounded-[8px] p-0",
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
