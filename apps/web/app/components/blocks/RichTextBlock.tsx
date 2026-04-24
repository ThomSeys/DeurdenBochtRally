import { tv } from "tailwind-variants";
import { PortableText } from "@portabletext/react";
import type { RichTextBlock as RichTextBlockType } from "@ddb/sanity/types";

const richTextStyles = tv({
  slots: {
    root: "py-12",
    inner: "mx-auto px-4",
    prose:
      "text-gray-300 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1",
  },
  variants: {
    maxWidth: {
      narrow: { inner: "max-w-2xl" },
      normal: { inner: "max-w-3xl" },
      wide: { inner: "max-w-5xl" },
    },
  },
  defaultVariants: { maxWidth: "normal" },
});

type Props = { block: RichTextBlockType };

export const RichTextBlock = ({ block }: Props) => {
  const s = richTextStyles({ maxWidth: block.maxWidth ?? "normal" });
  return (
    <section className={s.root()}>
      <div className={s.inner()}>
        <div className={s.prose()}>
          <PortableText value={block.content} />
        </div>
      </div>
    </section>
  );
};
