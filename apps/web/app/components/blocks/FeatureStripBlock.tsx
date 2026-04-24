import { tv } from "tailwind-variants";
import type { FeatureStripBlock as FeatureStripBlockType } from "@ddb/sanity/types";

const featureStripStyles = tv({
  slots: {
    root: "border-t border-white/5 py-16",
    grid: "mx-auto max-w-5xl gap-8 px-4",
    card: "rounded-2xl bg-surface-card p-6",
    cardTitle: "mb-2 font-bold text-white",
    cardBody: "text-sm text-gray-400",
  },
  variants: {
    background: {
      surface: { root: "bg-surface" },
      "surface-card": { root: "bg-surface-card/40" },
      transparent: { root: "bg-transparent" },
    },
    columns: {
      2: { grid: "grid sm:grid-cols-2" },
      3: { grid: "grid sm:grid-cols-3" },
      4: { grid: "grid sm:grid-cols-2 lg:grid-cols-4" },
    },
  },
  defaultVariants: { background: "surface-card", columns: 3 },
});

type Props = { block: FeatureStripBlockType };

export const FeatureStripBlock = ({ block }: Props) => {
  const s = featureStripStyles({
    background: block.background ?? "surface-card",
    columns: block.columns ?? 3,
  });
  return (
    <section className={s.root()}>
      <div className={s.grid()}>
        {block.items.map((item) => (
          <div key={item._key} className={s.card()}>
            <h3 className={s.cardTitle()}>{item.title}</h3>
            {item.body && <p className={s.cardBody()}>{item.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};
