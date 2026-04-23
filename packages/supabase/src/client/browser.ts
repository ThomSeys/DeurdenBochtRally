/**
 * Browser-side Supabase client.
 *
 * Create once and reuse (singleton pattern). The URL and anon key come from
 * environment variables that Vite exposes to the browser bundle.
 *
 * BROWSER-ONLY — never import this file in server code.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types.js";

export type { SupabaseClient };

let _client: SupabaseClient<Database> | null = null;

/**
 * Returns a singleton browser Supabase client.
 *
 * @param url     - `VITE_SUPABASE_URL` (injected by the web app)
 * @param anonKey - `VITE_SUPABASE_ANON_KEY` (injected by the web app)
 */
export function createBrowserClient(
  url: string,
  anonKey: string,
): SupabaseClient<Database> {
  if (!_client) {
    _client = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}
