import type { ZodError } from "zod";

/**
 * Converts a ZodError into a flat `{ fieldName: firstErrorMessage }` map.
 * Use in actions to return per-field validation errors to the UI.
 */
export function zodErrors<T>(err: ZodError<T>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}

/**
 * Parses a FormData object into a plain record for Zod validation.
 * Empty strings are preserved so Zod's own transforms can normalise them.
 */
export function formDataToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    out[key] = value;
  }
  return out;
}
