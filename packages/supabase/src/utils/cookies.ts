import type { CookieMethodsServer } from "@supabase/ssr";

/**
 * Parses a raw `Cookie` header string into the array format expected by
 * `@supabase/ssr`'s `createServerClient`.
 */
export function parseRequestCookies(
  cookieHeader: string | null,
): { name: string; value: string }[] {
  if (!cookieHeader) return [];

  return cookieHeader.split(";").flatMap((pair) => {
    const index = pair.indexOf("=");
    if (index === -1) return [];
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!name) return [];
    return [{ name, value }];
  });
}

/**
 * Serialises a single cookie into a `Set-Cookie` header value.
 * Used in `setAll` callback so callers can append to response headers.
 */
export function serializeSetCookie(
  name: string,
  value: string,
  options?: Record<string, unknown>,
): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options) {
    const { maxAge, domain, path, expires, httpOnly, sameSite, secure } =
      options as {
        maxAge?: number;
        domain?: string;
        path?: string;
        expires?: Date;
        httpOnly?: boolean;
        sameSite?: string;
        secure?: boolean;
      };

    if (maxAge !== undefined) cookie += `; Max-Age=${maxAge}`;
    if (domain) cookie += `; Domain=${domain}`;
    if (path !== undefined) cookie += `; Path=${path}`;
    if (expires) cookie += `; Expires=${expires.toUTCString()}`;
    if (httpOnly) cookie += `; HttpOnly`;
    if (secure) cookie += `; Secure`;
    if (sameSite) cookie += `; SameSite=${sameSite}`;
  }

  return cookie;
}

/**
 * Builds the `cookies` object required by `createServerClient` from a Web
 * standard `Request`, collecting outbound `Set-Cookie` values into a mutable
 * `Headers` instance.
 */
export function buildCookieMethods(
  request: Request,
  responseHeaders: Headers,
): CookieMethodsServer {
  return {
    getAll() {
      return parseRequestCookies(request.headers.get("cookie"));
    },
    setAll(cookies) {
      for (const { name, value, options } of cookies) {
        responseHeaders.append(
          "Set-Cookie",
          serializeSetCookie(name, value, options as Record<string, unknown>),
        );
      }
    },
  };
}
