import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/frontend/lib/utils";

export const buttonStyles = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-cobalt bg-cobalt text-white hover:border-cobalt-deep hover:bg-cobalt-deep",
        secondary:
          "border-line bg-surface text-cobalt hover:border-cobalt/60 hover:bg-tint",
        outline:
          "border-cobalt/35 bg-transparent text-cobalt hover:bg-tint",
        ghost:
          "border-transparent bg-transparent text-cobalt hover:bg-tint",
        quiet:
          "border-transparent bg-transparent text-ink hover:bg-sand",
        danger:
          "border-danger bg-danger text-white hover:bg-[#8a2323] hover:border-[#8a2323]",
        soft: "border-transparent bg-tint text-cobalt hover:bg-[#dbe5ff]",
      },
      size: {
        md: "h-11 px-5 text-[0.9rem]",
        sm: "h-9 px-3.5 text-[0.8125rem]",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
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
