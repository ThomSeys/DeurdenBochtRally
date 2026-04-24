import { tv } from "tailwind-variants";
import { PortableText } from "@portabletext/react";
import { Link } from "react-router";
import { urlFor } from "@ddb/sanity/image";
import type { ImageTextBlock as ImageTextBlockType } from "@ddb/sanity/types";

const imageTextStyles = tv({
  slots: {
    root: "py-16",
    inner: "mx-auto flex max-w-5xl flex-col gap-10 px-4 md:flex-row md:items-center",
    imageWrap: "w-full overflow-hidden rounded-2xl md:w-1/2",
    image: "h-full w-full object-cover",
    content: "flex flex-col gap-4 md:w-1/2",
    eyebrow: "text-sm font-semibold uppercase tracking-widest text-orange-500",
    title: "text-3xl font-extrabold tracking-tight text-white",
    body: "text-gray-400 [&_p]:mb-4 [&_p:last-child]:mb-0",
    cta: "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors bg-orange-500 text-white hover:bg-orange-600",
  },
  variants: {
    imagePosition: {
      left: { inner: "md:flex-row" },
      right: { inner: "md:flex-row-reverse" },
    },
  },
  defaultVariants: { imagePosition: "left" },
});

type Props = { block: ImageTextBlockType };

export const ImageTextBlock = ({ block }: Props) => {
  const s = imageTextStyles({ imagePosition: block.imagePosition ?? "left" });
  return (
    <section className={s.root()}>
      <div className={s.inner()}>
        <div className={s.imageWrap()}>
          {block.image ? (
            <img
              src={urlFor(block.image).width(900).auto("format").quality(80).url()}
              alt={block.image.alt ?? ""}
              className={s.image()}
            />
          ) : (
            <div className="aspect-video bg-white/5" />
          )}
        </div>
        <div className={s.content()}>
          {block.eyebrow && <p className={s.eyebrow()}>{block.eyebrow}</p>}
          <h2 className={s.title()}>{block.title}</h2>
          {block.body && (
            <div className={s.body()}>
              <PortableText value={block.body} />
            </div>
          )}
          {block.button && (
            <div>
              <Link to={block.button.href} className={s.cta()}>
                {block.button.label}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
