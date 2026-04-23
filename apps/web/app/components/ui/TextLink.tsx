import { Link } from "react-router";
import { tv } from "tailwind-variants";
import type { LinkProps } from "react-router";

const textLinkStyles = tv({
  base: "transition-colors hover:underline",
  variants: {
    intent: {
      primary: "font-medium text-orange-500",
      muted: "text-sm text-gray-400",
    },
  },
  defaultVariants: { intent: "primary" },
});

type TextLinkProps = LinkProps & {
  intent?: "primary" | "muted";
}

export const TextLink = ({ intent, className, children, ...props }: TextLinkProps) => {
  return (
    <Link className={textLinkStyles({ intent, class: className })} {...props}>
      {children}
    </Link>
  );
}
