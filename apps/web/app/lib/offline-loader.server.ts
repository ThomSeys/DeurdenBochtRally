/**
 * Offline-safe loader utilities
 * These functions make Supabase calls fail gracefully when offline
 * allowing the app to work with cached data
 */

import { supabaseAdmin } from './supabase.server';

/**
 * Wrap a Supabase query to fail gracefully offline
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  emptyDefault: T
): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn('[offline-loader] Supabase error, using empty data:', error);
      return emptyDefault;
    }
    return data;
  } catch (error) {
    console.warn('[offline-loader] Supabase query failed, using empty data:', error);
    return emptyDefault;
  }
}

/**
 * Count query wrapper
 */
export async function safeSupabaseCount(
  queryFn: () => Promise<{ count: number | null; error: any }>
): Promise<number> {
  try {
    const { count, error } = await queryFn();
    if (error) {
      console.warn('[offline-loader] Count query failed:', error);
      return 0;
    }
    return count || 0;
  } catch (error) {
    console.warn('[offline-loader] Count query exception:', error);
    return 0;
  }
}
