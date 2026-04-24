/**
 * GROQ queries for page documents.
 *
 * Import the query string and run it with the Sanity client:
 *
 *   import { sanityClient } from "@ddb/sanity/client";
 *   import { pageBySlugQuery } from "@ddb/sanity/queries/page";
 *   import type { PageDocument } from "@ddb/sanity/types";
 *
 *   const page = await sanityClient().fetch<PageDocument>(
 *     pageBySlugQuery,
 *     { slug: "home" }
 *   );
 */

/**
 * Fetch a single page by its slug.
 * Includes all blocks with their full content.
 */
export const pageBySlugQuery = /* groq */ `
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    _type,
    title,
    slug,
    seo,
    blocks[] {
      _type,
      _key,

      // hero
      _type == "hero" => {
        eyebrow,
        title,
        subtitle,
        buttons,
        backgroundType,
        backgroundImage { ..., asset-> },
        backgroundVideoFile { ..., asset-> },
        backgroundVideoUrl,
        overlayOpacity,
        alignment,
        minHeight
      },

      // featureStrip
      _type == "featureStrip" => {
        items,
        columns,
        background
      },

      // imageText
      _type == "imageText" => {
        image { ..., asset-> },
        imagePosition,
        eyebrow,
        title,
        body,
        button
      },

      // richText
      _type == "richText" => {
        content,
        maxWidth
      },

      // ctaBanner
      _type == "ctaBanner" => {
        title,
        subtitle,
        button,
        background
      },

      // faq
      _type == "faq" => {
        title,
        items[] { _key, question, answer }
      },

      // statsStrip
      _type == "statsStrip" => {
        items
      },

      // alertBanner
      _type == "alertBanner" => {
        message,
        intent,
        link,
        dismissable
      }
    }
  }
`;

/**
 * List all page slugs — useful for pre-rendering or sitemap generation.
 */
export const allPageSlugsQuery = /* groq */ `
  *[_type == "page"] { "slug": slug.current }
`;
