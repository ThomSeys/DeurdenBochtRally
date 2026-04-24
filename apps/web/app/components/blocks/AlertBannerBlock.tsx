import { tv } from "tailwind-variants";
import { Link } from "react-router";
import type { AlertBannerBlock as AlertBannerBlockType } from "@ddb/sanity/types";

const alertStyles = tv({
  slots: {
    root: "px-4 py-3 text-sm",
    inner: "mx-auto flex max-w-5xl items-center justify-between gap-4",
    message: "font-medium",
    link: "ml-2 underline hover:no-underline",
  },
  variants: {
    intent: {
      info: { root: "bg-blue-900/50 text-blue-200" },
      warning: { root: "bg-amber-900/50 text-amber-200" },
      urgent: { root: "bg-red-900/60 text-red-200" },
    },
  },
  defaultVariants: { intent: "info" },
});

type Props = { block: AlertBannerBlockType };

export const AlertBannerBlock = ({ block }: Props) => {
  const s = alertStyles({ intent: block.intent ?? "info" });
  return (
    <div role="alert" className={s.root()}>
      <div className={s.inner()}>
        <p className={s.message()}>
          {block.message}
          {block.link && (
            <Link to={block.link.href} className={s.link()}>
              {block.link.label}
            </Link>
          )}
        </p>
      </div>
    </div>
  );
};
