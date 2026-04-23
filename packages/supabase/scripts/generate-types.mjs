#!/usr/bin/env node
/**
 * generate-types.mjs
 *
 * Pulls TypeScript types directly from the Supabase Management API
 * (same endpoint used by `supabase gen types typescript --project-id`).
 *
 * Prerequisites:
 *   1. Create a personal access token at:
 *      https://supabase.com/dashboard/account/tokens
 *   2. Add it to the root .env.local:
 *      SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * Usage:
 *   npm run gen:types               (from packages/supabase)
 *   npm run gen:types -w @ddb/supabase  (from monorepo root)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// ── load env from monorepo root ───────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(__dirname, "../../../.env.local");
config({ path: rootEnv });

// ── resolve args ──────────────────────────────────────────────────────────────
const ACCESS_TOKEN = process.env["SUPABASE_ACCESS_TOKEN"];
const PROJECT_URL = process.env["SUPABASE_URL"];

if (!ACCESS_TOKEN) {
  console.error(
    "\n❌  SUPABASE_ACCESS_TOKEN is not set.\n\n" +
      "   1. Go to https://supabase.com/dashboard/account/tokens\n" +
      "   2. Create a new personal access token\n" +
      "   3. Add it to your root .env.local:\n" +
      "      SUPABASE_ACCESS_TOKEN=sbp_...\n",
  );
  process.exit(1);
}

if (!PROJECT_URL) {
  console.error("❌  SUPABASE_URL is not set in .env.local");
  process.exit(1);
}

// Extract project ref from URL: https://<ref>.supabase.co
const projectRef = new URL(PROJECT_URL).hostname.split(".")[0];

// ── fetch types from Management API ──────────────────────────────────────────
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/types/typescript`;

console.log(`⏳  Fetching types for project ${projectRef} …`);

let types;
try {
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌  Management API error ${res.status}: ${body}`);
    process.exit(1);
  }

  const json = await res.json();
  types = json.types ?? json;
} catch (err) {
  console.error("❌  Failed to fetch types:", err.message);
  process.exit(1);
}

// ── write output ──────────────────────────────────────────────────────────────
const outPath = resolve(__dirname, "../src/types/database.types.ts");
mkdirSync(dirname(outPath), { recursive: true });

const header = `/**
 * AUTO-GENERATED — do not edit manually.
 *
 * Regenerate with:
 *   npm run gen:types -w @ddb/supabase
 *
 * Generated: ${new Date().toISOString()}
 * Project:   ${projectRef}
 */

`;

writeFileSync(outPath, header + types, "utf8");
console.log(`✅  Types written to packages/supabase/src/types/database.types.ts`);
