/**
 * Sanity client — server-side only.
 *
 * Reads env vars at call time (not import time) so the server only throws
 * when a route actually needs CMS data, not on every cold start.
 *
 * SERVER-ONLY — never import this file in browser code.
 */

import { createClient } from "@sanity/client";
import type { SanityClient } from "@sanity/client";

function getSanityEnv() {
  const projectId = process.env["SANITY_PROJECT_ID"];
  const dataset = process.env["SANITY_DATASET"] ?? "production";
  const token = process.env["SANITY_TOKEN"]; // optional — only needed for draft previews

  if (!projectId) throw new Error("Missing env var: SANITY_PROJECT_ID");

  return { projectId, dataset, token };
}

/**
 * Returns a Sanity client configured for server-side reads.
 * Uses the CDN for published content (fast, globally cached).
 */
export function sanityClient(): SanityClient {
  const { projectId, dataset } = getSanityEnv();
  return createClient({
    projectId,
    dataset,
    apiVersion: "2026-04-23",
    useCdn: true,
  });
}

/**
 * Returns a Sanity client that bypasses the CDN.
 * Use this when you need guaranteed fresh content (e.g. preview mode).
 */
export function sanityPreviewClient(): SanityClient {
  const { projectId, dataset, token } = getSanityEnv();
  return createClient({
    projectId,
    dataset,
    apiVersion: "2026-04-23",
    useCdn: false,
    token,
  });
}
