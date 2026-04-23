/**
 * Admin (service-role) Supabase client.
 *
 * Bypasses Row Level Security. Use only in trusted server-side contexts
 * (e.g. webhooks, admin-only routes, background jobs).
 *
 * SERVER-ONLY — never import this file in browser code or expose to clients.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types.js";

/**
 * Creates an admin Supabase client using the service-role key.
 *
 * @param url            - Supabase project URL (`SUPABASE_URL`).
 * @param serviceRoleKey - Service-role secret key (`SUPABASE_SERVICE_ROLE_KEY`).
 */
export function createAdminClient(
  url: string,
  serviceRoleKey: string,
): SupabaseClient<Database> {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
