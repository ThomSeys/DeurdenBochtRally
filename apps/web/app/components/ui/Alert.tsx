import { tv } from "tailwind-variants";
import type { ReactNode } from "react";

const alertStyles = tv({
  base: "rounded-lg border px-4 py-3 text-sm",
  variants: {
    intent: {
      error: "border-red-500/20 bg-red-950/60 text-red-400",
      success: "border-orange-500/20 bg-orange-950/60 text-orange-400",
      info: "border-orange-500/20 bg-orange-950/60 text-orange-400",
      warning: "border-amber-500/20 bg-amber-950/60 text-amber-400",
    },
  },
  defaultVariants: { intent: "error" },
});

type AlertProps = {
  intent?: "error" | "success" | "info" | "warning";
  children: ReactNode;
  className?: string;
}

export const Alert = ({ intent, children, className }: AlertProps) => {
  return <p className={alertStyles({ intent, class: className })}>{children}</p>;
}
