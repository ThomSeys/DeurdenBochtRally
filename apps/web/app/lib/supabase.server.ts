/**
 * Thin helpers that bind the @ddb/supabase client factories to the
 * environment variables available in the React Router SSR process.
 *
 * SERVER-ONLY — never import this file in browser code.
 * Import paths: "~/lib/supabase.server"
 */

import { createSupabaseServerClient } from "@ddb/supabase/server";
import { createAdminClient } from "@ddb/supabase/admin";

function getEnv() {
  const url = process.env["SUPABASE_URL"];
  const anonKey = process.env["SUPABASE_ANON_KEY"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url) throw new Error("Missing env var: SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env var: SUPABASE_ANON_KEY");
  if (!serviceRoleKey)
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");

  return { url, anonKey, serviceRoleKey };
}

/**
 * Creates a per-request Supabase client that reads/writes the session from
 * cookies. Pass the `headers` from the result to any redirect/response so
 * that refreshed session tokens are persisted in the browser.
 */
export function serverClient(request: Request) {
  const { url, anonKey } = getEnv();
  return createSupabaseServerClient(request, url, anonKey);
}

/**
 * Creates a Supabase admin client using the service-role key.
 * Bypasses RLS — use only in trusted server-side routes.
 */
export function adminClient() {
  const { url, serviceRoleKey } = getEnv();
  return createAdminClient(url, serviceRoleKey);
}
