import type { User } from "@supabase/supabase-js";
import type { ServerClientResult } from "../client/server.js";
import type {
  SignInCredentials,
  SignInResult,
  GetUserResult,
} from "../types/auth.types.js";

/**
 * Returns true if the authenticated user has the admin role.
 * The role is stored in `app_metadata` which can only be set via the service-role key.
 */
export const isAdmin = (user: User): boolean =>
  user.app_metadata?.["role"] === "admin";

/**
 * Signs in a user with email and password.
 * Session cookies are written into `ctx.headers` automatically by @supabase/ssr.
 */
export async function signIn(
  ctx: ServerClientResult,
  credentials: SignInCredentials,
): Promise<SignInResult> {
  const { data, error } = await ctx.supabase.auth.signInWithPassword(credentials);
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    data: null,
    error: error?.message ?? null,
  };
}

/**
 * Signs out the current user.
 * Session cookies are cleared in `ctx.headers` automatically by @supabase/ssr.
 */
export async function signOut(
  ctx: ServerClientResult,
): Promise<{ error: string | null }> {
  const { error } = await ctx.supabase.auth.signOut();
  return { error: error?.message ?? null };
}

/**
 * Returns the currently authenticated user from the session cookie.
 * Uses `getUser()` which validates the JWT against Supabase Auth (not just decoding locally).
 */
export async function getUser(ctx: ServerClientResult): Promise<GetUserResult> {
  const {
    data: { user },
    error,
  } = await ctx.supabase.auth.getUser();
  return { user: user ?? null, error: error?.message ?? null };
}
