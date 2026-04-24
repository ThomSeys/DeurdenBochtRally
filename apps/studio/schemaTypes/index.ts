// Objects
export { ctaButton } from "./objects/cta-button";
export { featureItem, statItem, faqEntry } from "./objects/shared-items";

// Blocks
export { hero } from "./blocks/hero";
export {
  featureStrip,
  imageText,
  richText,
  ctaBanner,
  faq,
  statsStrip,
  alertBanner,
} from "./blocks/content-blocks";

// Documents
export { page } from "./documents/page";
export {
  edition,
  sponsor,
  siteConfig,
  scheduleItem,
  faqItem,
  pricingTier,
  benefitItem,
  featureCard,
} from "./documents/cms-documents";

import { ctaButton } from "./objects/cta-button";
import { featureItem, statItem, faqEntry } from "./objects/shared-items";
import { hero } from "./blocks/hero";
import {
  featureStrip,
  imageText,
  richText,
  ctaBanner,
  faq,
  statsStrip,
  alertBanner,
} from "./blocks/content-blocks";
import { page } from "./documents/page";
import {
  edition,
  sponsor,
  siteConfig,
  scheduleItem,
  faqItem,
  pricingTier,
  benefitItem,
  featureCard,
} from "./documents/cms-documents";

export const schemaTypes = [
  // Objects (must come before blocks that reference them)
  ctaButton,
  featureItem,
  statItem,
  faqEntry,
  // Blocks
  hero,
  featureStrip,
  imageText,
  richText,
  ctaBanner,
  faq,
  statsStrip,
  alertBanner,
  // Documents
  page,
  edition,
  sponsor,
  siteConfig,
  scheduleItem,
  faqItem,
  pricingTier,
  benefitItem,
  featureCard,
];
