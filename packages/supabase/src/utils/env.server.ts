/**
 * Server-side environment variable accessor.
 *
 * Called at runtime (not import time) so it throws only when a route actually
 * needs Supabase, not on every cold start.
 *
 * SERVER-ONLY — never import this file in browser code.
 */

interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env["SUPABASE_URL"];
  const anonKey = process.env["SUPABASE_ANON_KEY"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url) throw new Error("Missing env var: SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env var: SUPABASE_ANON_KEY");
  if (!serviceRoleKey) throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");

  return { url, anonKey, serviceRoleKey };
}
