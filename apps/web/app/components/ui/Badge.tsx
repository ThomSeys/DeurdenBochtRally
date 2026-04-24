import { tv } from "tailwind-variants";
import type { ReactNode } from "react";

const badgeStyles = tv({
  base: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  variants: {
    intent: {
      active: "bg-orange-500/10 text-orange-400",
      inactive: "bg-white/10 text-gray-400",
      info: "bg-blue-500/10 text-blue-400",
      warning: "bg-amber-500/10 text-amber-400",
    },
  },
  defaultVariants: { intent: "inactive" },
});

type BadgeProps = {
  intent?: "active" | "inactive" | "info" | "warning";
  children: ReactNode;
  className?: string;
};

export const Badge = ({ intent, children, className }: BadgeProps) => {
  return <span className={badgeStyles({ intent, class: className })}>{children}</span>;
};
