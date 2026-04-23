import { tv } from "tailwind-variants";
import type { ReactNode } from "react";

const sectionHeadingStyles = tv({
  base: "border-b border-white/10 pb-1 text-xs font-semibold uppercase tracking-widest text-orange-500",
});

type SectionHeadingProps = {
  children: ReactNode;
  className?: string;
}

export const SectionHeading = ({ children, className }: SectionHeadingProps) => {
  return <h2 className={sectionHeadingStyles({ class: className })}>{children}</h2>;
}
