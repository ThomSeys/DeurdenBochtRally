import { tv } from "tailwind-variants";
import type { StatsStripBlock as StatsStripBlockType } from "@ddb/sanity/types";

const statsStyles = tv({
  slots: {
    root: "border-y border-white/5 bg-surface-card/60 py-10",
    grid: "mx-auto grid max-w-5xl gap-6 px-4 text-center sm:grid-cols-2 md:grid-cols-4",
    value: "text-3xl font-extrabold text-orange-500",
    label: "mt-1 text-sm text-gray-400",
  },
});

type Props = { block: StatsStripBlockType };

export const StatsStripBlock = ({ block }: Props) => {
  const s = statsStyles();
  return (
    <section className={s.root()}>
      <dl className={s.grid()}>
        {block.items.map((item) => (
          <div key={item._key}>
            <dd className={s.value()}>{item.value}</dd>
            <dt className={s.label()}>{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
};
