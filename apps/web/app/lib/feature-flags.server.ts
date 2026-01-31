// Feature flags helper functions
import { sanityClient } from './sanity.server';

export interface FeatureFlag {
  _id: string;
  name: string;
  key: {
    current: string;
  };
  enabled: boolean;
  description?: string;
  category?: string;
  enabledFrom?: string;
  enabledUntil?: string;
}

// Cache for feature flags (5 minutes in production, no cache in development)
let featureFlagsCache: { flags: Record<string, boolean>; timestamp: number } | null = null;
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 0; // 5 minutes in prod, no cache in dev

/**
 * Get all feature flags from Sanity
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  // Check cache first (only in production)
  if (CACHE_DURATION > 0 && featureFlagsCache && Date.now() - featureFlagsCache.timestamp < CACHE_DURATION) {
    return featureFlagsCache.flags;
  }

  try {
    const flags = await sanityClient.fetch<FeatureFlag[]>(`
      *[_type == "featureFlags"] {
        _id,
        name,
        key,
        enabled,
        description,
        category,
        enabledFrom,
        enabledUntil
      }
    `);

    const flagsMap: Record<string, boolean> = {};
    const now = new Date();

    for (const flag of flags) {
      const key = flag.key.current;
      let isEnabled = flag.enabled;

      // Check time-based enabling/disabling
      if (flag.enabledFrom && new Date(flag.enabledFrom) > now) {
        isEnabled = false;
      }
      if (flag.enabledUntil && new Date(flag.enabledUntil) < now) {
        isEnabled = false;
      }

      flagsMap[key] = isEnabled;
    }

    // Update cache
    featureFlagsCache = {
      flags: flagsMap,
      timestamp: Date.now(),
    };

    return flagsMap;
  } catch (error) {
    console.error('[feature-flags] Error fetching feature flags:', error);
    return {};
  }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] === true;
}

/**
 * Clear the feature flags cache (useful for testing or after updates)
 */
export function clearFeatureFlagsCache() {
  featureFlagsCache = null;
}

// Predefined feature flag keys for type safety
export const FeatureFlagKeys = {
  REGISTRATION_OPEN: 'registration-open',
  RALLY_ZONES_ENABLED: 'rally-zones-enabled',
  PHOTO_GALLERY_ENABLED: 'photo-gallery-enabled',
  RIDE_STORIES_ENABLED: 'ride-stories-enabled',
  LEADERBOARD_ENABLED: 'leaderboard-enabled',
  LIVE_MAP_ENABLED: 'live-map-enabled',
  PUSH_NOTIFICATIONS: 'push-notifications',
  PAPER_ROADBOOK_OPTION: 'paper-roadbook-option',
  PROFILE_EDITING: 'profile-editing',
} as const;
