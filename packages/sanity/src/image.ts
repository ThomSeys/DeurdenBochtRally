/**
 * Sanity image URL builder.
 *
 * Uses VITE_SANITY_PROJECT_ID and VITE_SANITY_DATASET so the builder works
 * on both the server (SSR) and in the browser (hydration) without needing
 * process.env, which is server-only.
 *
 * projectId and dataset are public values — safe to embed in client bundles.
 *
 * Usage:
 *   import { urlFor } from "@ddb/sanity/image";
 *   <img src={urlFor(image).width(800).auto("format").url()} />
 */

import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Resolved at build time by Vite for client bundles; also available server-side
// via Vite's SSR env injection. Fall back to the non-VITE_ names for scripts
// that run outside Vite (e.g. Node scripts).
const projectId =
  import.meta.env?.VITE_SANITY_PROJECT_ID ??
  (typeof process !== "undefined" ? process.env["SANITY_PROJECT_ID"] : undefined) ??
  "1ttlodbl";

const dataset =
  import.meta.env?.VITE_SANITY_DATASET ??
  (typeof process !== "undefined" ? process.env["SANITY_DATASET"] : undefined) ??
  "production";

const builder = imageUrlBuilder({ projectId, dataset });

export const urlFor = (source: SanityImageSource) => builder.image(source);

