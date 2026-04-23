/**
 * Server-side (SSR) Supabase client.
 *
 * Creates a per-request client that reads the session from cookies and writes
 * any updated session tokens back via `Set-Cookie` headers.
 *
 * SERVER-ONLY — never import this file in browser code.
 */

import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types.js";
import { buildCookieMethods } from "../utils/cookies.js";

export interface ServerClientResult {
  /** Typed Supabase client for this request. */
  supabase: SupabaseClient<Database>;
  /**
   * Headers object containing any `Set-Cookie` values that Supabase wrote
   * (e.g. session refresh). Spread these onto your Response/redirect headers.
   */
  headers: Headers;
}

/**
 * Creates a Supabase client suitable for use in React Router loaders and
 * actions (server-side).
 *
 * @param request - The Web standard `Request` object from the loader/action.
 * @param url     - Supabase project URL (`SUPABASE_URL`).
 * @param anonKey - Supabase anonymous key (`SUPABASE_ANON_KEY`).
 */
export function createSupabaseServerClient(
  request: Request,
  url: string,
  anonKey: string,
): ServerClientResult {
  const headers = new Headers();

  const supabase = createSSRServerClient<Database>(url, anonKey, {
    cookies: buildCookieMethods(request, headers),
  });

  return { supabase, headers };
}
