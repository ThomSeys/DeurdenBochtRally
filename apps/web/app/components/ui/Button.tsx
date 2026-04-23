import { Link } from "react-router";
import { tv } from "tailwind-variants";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LinkProps } from "react-router";

const buttonStyles = tv({
  base: "inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-60",
  variants: {
    intent: {
      primary: "bg-orange-500 text-white hover:bg-orange-600",
      secondary: "border border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5",
      ghost: "text-gray-300 hover:bg-white/5 hover:text-white",
    },
    size: {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    },
    full: {
      true: "w-full",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  full?: boolean;
}

export const Button = ({ intent, size, full, className, children, ...props }: ButtonProps) => {
  return (
    <button className={buttonStyles({ intent, size, full, class: className })} {...props}>
      {children}
    </button>
  );
}

type LinkButtonProps = Omit<LinkProps, "className"> & {
  intent?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  className?: string;
  children: ReactNode;
}

export const LinkButton = ({ intent, size, full, className, children, ...props }: LinkButtonProps) => {
  return (
    <Link className={buttonStyles({ intent, size, full, class: className })} {...props}>
      {children}
    </Link>
  );
}
