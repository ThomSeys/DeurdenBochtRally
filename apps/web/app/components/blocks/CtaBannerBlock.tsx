import { tv } from "tailwind-variants";
import { Link } from "react-router";
import type { CtaBannerBlock as CtaBannerBlockType } from "@ddb/sanity/types";

const ctaBannerStyles = tv({
  slots: {
    root: "py-16",
    inner: "mx-auto max-w-3xl px-4 text-center",
    title: "text-3xl font-extrabold tracking-tight",
    subtitle: "mt-3 text-lg",
    cta: "mt-8 inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-semibold transition-colors",
  },
  variants: {
    background: {
      brand: {
        root: "bg-orange-500",
        title: "text-white",
        subtitle: "text-orange-100",
        cta: "bg-white text-orange-600 hover:bg-orange-50",
      },
      dark: {
        root: "bg-surface-card",
        title: "text-white",
        subtitle: "text-gray-400",
        cta: "bg-orange-500 text-white hover:bg-orange-600",
      },
      light: {
        root: "bg-white/5",
        title: "text-white",
        subtitle: "text-gray-400",
        cta: "bg-orange-500 text-white hover:bg-orange-600",
      },
    },
  },
  defaultVariants: { background: "brand" },
});

type Props = { block: CtaBannerBlockType };

export const CtaBannerBlock = ({ block }: Props) => {
  const s = ctaBannerStyles({ background: block.background ?? "brand" });
  return (
    <section className={s.root()}>
      <div className={s.inner()}>
        <h2 className={s.title()}>{block.title}</h2>
        {block.subtitle && <p className={s.subtitle()}>{block.subtitle}</p>}
        <Link to={block.button.href} className={s.cta()}>
          {block.button.label}
        </Link>
      </div>
    </section>
  );
};
