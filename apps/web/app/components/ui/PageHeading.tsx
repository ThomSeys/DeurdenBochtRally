import { tv } from "tailwind-variants";
import type { ReactNode } from "react";

const pageHeadingStyles = tv({
  slots: {
    root: "",
    title: "font-extrabold tracking-tight text-white",
    subtitle: "mb-8 mt-1 text-sm text-gray-400",
  },
  variants: {
    size: {
      sm: { title: "mb-1 text-2xl" },
      md: { title: "mb-1 text-3xl" },
      lg: { title: "mb-2 text-4xl" },
      xl: { title: "mb-3 text-5xl sm:text-6xl" },
    },
  },
  defaultVariants: { size: "md" },
});

type PageHeadingProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const PageHeading = ({ title, subtitle, size, className }: PageHeadingProps) => {
  const s = pageHeadingStyles({ size });
  return (
    <div className={s.root({ class: className })}>
      <h1 className={s.title()}>{title}</h1>
      {subtitle && <p className={s.subtitle()}>{subtitle}</p>}
    </div>
  );
}
