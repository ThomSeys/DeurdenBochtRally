/**
 * Shared TypeScript types for Sanity content.
 *
 * These mirror the Sanity schema shapes exactly so that route loaders
 * have full type safety when working with CMS data.
 */

import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Portable Text block — minimal type compatible with @portabletext/react
export type PortableTextBlock = {
  _type: string;
  _key: string;
  [key: string]: unknown;
};

// ── Primitive helpers ─────────────────────────────────────────────────────────

export type SanityImage = SanityImageSource & {
  alt?: string;
  caption?: string;
};

export type SanitySlug = { current: string };

export type SanityFile = {
  _type: "file";
  asset: { _ref: string; _type: "reference"; url?: string };
};

// ── CTA button ────────────────────────────────────────────────────────────────

export type CtaButton = {
  _key: string;
  label: string;
  href: string;
  intent: "primary" | "secondary" | "ghost";
};

// ── Content blocks ────────────────────────────────────────────────────────────

export type HeroBlock = {
  _type: "hero";
  _key: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  buttons?: CtaButton[];
  backgroundType: "image" | "video";
  backgroundImage?: SanityImage;
  backgroundVideoFile?: SanityFile;
  backgroundVideoUrl?: string;
  overlayOpacity?: number; // 0–100
  alignment?: "left" | "center" | "right";
  minHeight?: "sm" | "md" | "lg" | "full";
};

export type FeatureItem = {
  _key: string;
  icon: string;
  title: string;
  body: string;
};

export type FeatureStripBlock = {
  _type: "featureStrip";
  _key: string;
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  background?: "surface" | "surface-card" | "transparent";
};

export type ImageTextBlock = {
  _type: "imageText";
  _key: string;
  image: SanityImage;
  imagePosition?: "left" | "right";
  eyebrow?: string;
  title: string;
  body: PortableTextBlock[];
  button?: CtaButton;
};

export type RichTextBlock = {
  _type: "richText";
  _key: string;
  content: PortableTextBlock[];
  maxWidth?: "narrow" | "normal" | "wide";
};

export type CtaBannerBlock = {
  _type: "ctaBanner";
  _key: string;
  title: string;
  subtitle?: string;
  button: CtaButton;
  background?: "brand" | "dark" | "light";
};

export type FaqItem = {
  _key: string;
  question: string;
  answer: PortableTextBlock[];
};

export type FaqBlock = {
  _type: "faq";
  _key: string;
  title?: string;
  items: FaqItem[];
};

export type StatItem = {
  _key: string;
  value: string;
  label: string;
};

export type StatsStripBlock = {
  _type: "statsStrip";
  _key: string;
  items: StatItem[];
};

export type AlertBannerBlock = {
  _type: "alertBanner";
  _key: string;
  message: string;
  intent?: "info" | "warning" | "urgent";
  link?: { label: string; href: string };
  dismissable?: boolean;
};

// ── Union of all block types ──────────────────────────────────────────────────

export type ContentBlock =
  | HeroBlock
  | FeatureStripBlock
  | ImageTextBlock
  | RichTextBlock
  | CtaBannerBlock
  | FaqBlock
  | StatsStripBlock
  | AlertBannerBlock;

// ── Page document ─────────────────────────────────────────────────────────────

export type PageDocument = {
  _id: string;
  _type: "page";
  title: string;
  slug: SanitySlug;
  blocks: ContentBlock[];
  seo?: {
    title?: string;
    description?: string;
    ogImage?: SanityImage;
  };
};
