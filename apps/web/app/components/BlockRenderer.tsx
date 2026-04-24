import type { ContentBlock } from "@ddb/sanity/types";
import { HeroBlock } from "./blocks/HeroBlock";
import { FeatureStripBlock } from "./blocks/FeatureStripBlock";
import { ImageTextBlock } from "./blocks/ImageTextBlock";
import { RichTextBlock } from "./blocks/RichTextBlock";
import { CtaBannerBlock } from "./blocks/CtaBannerBlock";
import { FaqBlock } from "./blocks/FaqBlock";
import { StatsStripBlock } from "./blocks/StatsStripBlock";
import { AlertBannerBlock } from "./blocks/AlertBannerBlock";

type Props = { blocks: ContentBlock[] };

export const BlockRenderer = ({ blocks }: Props) => {
  return (
    <>
      {blocks.map((block) => {
        switch (block._type) {
          case "hero":
            return <HeroBlock key={block._key} block={block} />;
          case "featureStrip":
            return <FeatureStripBlock key={block._key} block={block} />;
          case "imageText":
            return <ImageTextBlock key={block._key} block={block} />;
          case "richText":
            return <RichTextBlock key={block._key} block={block} />;
          case "ctaBanner":
            return <CtaBannerBlock key={block._key} block={block} />;
          case "faq":
            return <FaqBlock key={block._key} block={block} />;
          case "statsStrip":
            return <StatsStripBlock key={block._key} block={block} />;
          case "alertBanner":
            return <AlertBannerBlock key={block._key} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
};
