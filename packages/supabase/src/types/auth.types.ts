import type { User, Session, AuthError } from "@supabase/supabase-js";

export type { User, Session, AuthError };

// ── Credentials ───────────────────────────────────────────────────────────────

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}

export interface ResetPasswordCredentials {
  email: string;
  /** Absolute URL Supabase redirects to after the reset email is clicked. */
  redirectTo: string;
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface AuthResult<T = void> {
  data: T | null;
  error: string | null;
}

export interface SignInResult extends AuthResult {
  user: User | null;
  session: Session | null;
}

export interface RegisterResult extends AuthResult {
  user: User | null;
}

export interface GetUserResult {
  user: User | null;
  error: string | null;
}
