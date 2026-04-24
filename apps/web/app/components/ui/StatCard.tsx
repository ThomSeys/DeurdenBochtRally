import { tv } from "tailwind-variants";

const statCard = tv({
  slots: {
    root: "rounded-xl border border-white/10 bg-surface-card p-5",
    label: "text-xs font-semibold uppercase tracking-widest text-gray-400",
    value: "mt-1 text-2xl font-bold",
  },
  variants: {
    highlight: {
      true: { value: "text-orange-400" },
      false: { value: "text-white" },
    },
  },
  defaultVariants: { highlight: false },
});

type StatCardProps = {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
};

export const StatCard = ({ label, value, highlight = false, className }: StatCardProps) => {
  const s = statCard({ highlight });
  return (
    <div className={s.root({ class: className })}>
      <p className={s.label()}>{label}</p>
      <p className={s.value()}>{value}</p>
    </div>
  );
};
