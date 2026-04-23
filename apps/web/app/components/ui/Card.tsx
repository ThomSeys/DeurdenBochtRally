import { tv } from "tailwind-variants";
import type { ReactNode } from "react";

const cardStyles = tv({
  slots: {
    root: "rounded-2xl bg-surface-card p-6",
    title: "mb-2 font-bold text-white",
    body: "text-sm text-gray-400",
  },
});

type CardProps = {
  title: ReactNode;
  body: ReactNode;
  className?: string;
}

export const Card = ({ title, body, className }: CardProps) => {
  const s = cardStyles();
  return (
    <div className={s.root({ class: className })}>
      <h3 className={s.title()}>{title}</h3>
      <p className={s.body()}>{body}</p>
    </div>
  );
}
