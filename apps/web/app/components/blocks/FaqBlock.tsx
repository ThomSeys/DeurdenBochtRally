import { tv } from "tailwind-variants";
import { PortableText } from "@portabletext/react";
import type { FaqBlock as FaqBlockType } from "@ddb/sanity/types";

const faqStyles = tv({
  slots: {
    root: "py-16",
    inner: "mx-auto max-w-3xl px-4",
    heading: "mb-8 text-2xl font-extrabold text-white",
    item: "border-b border-white/10 py-5",
    question: "font-semibold text-white",
    answer: "mt-3 text-sm text-gray-400 [&_p]:mb-2 [&_p:last-child]:mb-0",
  },
});

type Props = { block: FaqBlockType };

export const FaqBlock = ({ block }: Props) => {
  const s = faqStyles();
  return (
    <section className={s.root()}>
      <div className={s.inner()}>
        {block.title && <h2 className={s.heading()}>{block.title}</h2>}
        <dl>
          {block.items.map((item) => (
            <div key={item._key} className={s.item()}>
              <dt className={s.question()}>{item.question}</dt>
              <dd className={s.answer()}>
                <PortableText value={item.answer} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
