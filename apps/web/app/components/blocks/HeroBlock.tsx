import { tv } from "tailwind-variants";
import { Link } from "react-router";
import { urlFor } from "@ddb/sanity/image";
import type { HeroBlock as HeroBlockType } from "@ddb/sanity/types";

const heroStyles = tv({
  slots: {
    root: "relative flex flex-col items-center justify-center overflow-hidden",
    overlay: "pointer-events-none absolute inset-0 bg-black",
    bg: "absolute inset-0 h-full w-full object-cover",
    inner: "relative z-10 px-4 py-24 text-center",
    eyebrow: "mb-3 text-sm font-semibold uppercase tracking-widest text-orange-500",
    title: "max-w-2xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl",
    subtitle: "mt-4 max-w-xl text-lg text-gray-400",
    buttons: "mt-8 flex flex-wrap justify-center gap-3",
  },
  variants: {
    alignment: {
      left: { inner: "items-start text-left", buttons: "justify-start" },
      center: { inner: "items-center text-center", buttons: "justify-center" },
      right: { inner: "items-end text-right", buttons: "justify-end" },
    },
    minHeight: {
      sm: { root: "min-h-[40svh]" },
      md: { root: "min-h-[60svh]" },
      lg: { root: "min-h-[80svh]" },
      full: { root: "min-h-[calc(100svh-64px)]" },
    },
  },
  defaultVariants: { alignment: "center", minHeight: "full" },
});

const ctaButtonStyles = tv({
  base: "inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition-colors",
  variants: {
    intent: {
      primary: "bg-orange-500 text-white hover:bg-orange-600",
      secondary: "border border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5",
      ghost: "text-gray-300 hover:bg-white/5 hover:text-white",
    },
  },
  defaultVariants: { intent: "primary" },
});

type Props = { block: HeroBlockType };

export const HeroBlock = ({ block }: Props) => {
  const s = heroStyles({
    alignment: block.alignment ?? "center",
    minHeight: block.minHeight ?? "full",
  });

  const opacity = (block.overlayOpacity ?? 50) / 100;

  // Resolve background — video takes priority over image
  const videoSrc =
    block.backgroundType === "video"
      ? (block.backgroundVideoFile?.asset as { url?: string } | undefined)?.url ??
        block.backgroundVideoUrl
      : null;

  const imageSrc =
    !videoSrc && block.backgroundImage
      ? urlFor(block.backgroundImage).width(1920).auto("format").quality(80).url()
      : null;

  return (
    <section className={s.root()}>
      {/* Background media */}
      {videoSrc ? (
        <video
          className={s.bg()}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : imageSrc ? (
        <img
          className={s.bg()}
          src={imageSrc}
          alt={block.backgroundImage?.alt ?? ""}
          aria-hidden="true"
        />
      ) : null}

      {/* Dark overlay */}
      <div className={s.overlay()} style={{ opacity }} />

      {/* Content */}
      <div className={s.inner()}>
        {block.eyebrow && <p className={s.eyebrow()}>{block.eyebrow}</p>}
        <h1 className={s.title()}>{block.title}</h1>
        {block.subtitle && <p className={s.subtitle()}>{block.subtitle}</p>}
        {block.buttons && block.buttons.length > 0 && (
          <div className={s.buttons()}>
            {block.buttons.map((btn) => (
              <Link
                key={btn._key}
                to={btn.href}
                className={ctaButtonStyles({ intent: btn.intent ?? "primary" })}
              >
                {btn.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
