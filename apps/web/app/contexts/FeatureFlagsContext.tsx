import { createContext, useContext, type ReactNode } from 'react';

export interface FeatureFlags {
  'registration-open': boolean;
  'rally-zones-enabled': boolean;
  'photo-gallery-enabled': boolean;
  'ride-stories-enabled': boolean;
  'live-map-enabled': boolean;
  'push-notifications-enabled': boolean;
  'leaderboard-enabled': boolean;
  'profile-editing-enabled': boolean;
  'paper-roadbook-option': boolean;
  'admin-dashboard-enabled': boolean;
  'emergency-sos-enabled': boolean;
  'achievements-enabled': boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isEnabled: (key: keyof FeatureFlags) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  flags: Partial<FeatureFlags>;
}

export function FeatureFlagsProvider({ children, flags }: FeatureFlagsProviderProps) {
  // Merge provided flags with defaults (all false by default)
  const defaultFlags: FeatureFlags = {
    'registration-open': false,
    'rally-zones-enabled': false,
    'photo-gallery-enabled': false,
    'ride-stories-enabled': false,
    'live-map-enabled': false,
    'push-notifications-enabled': false,
    'leaderboard-enabled': false,
    'profile-editing-enabled': false,
    'paper-roadbook-option': false,
    'admin-dashboard-enabled': false,
    'emergency-sos-enabled': false,
    'achievements-enabled': false,
  };

  const mergedFlags: FeatureFlags = {
    ...defaultFlags,
    ...flags,
  };

  const isEnabled = (key: keyof FeatureFlags): boolean => {
    return mergedFlags[key] === true;
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags: mergedFlags, isEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}

// Convenience hook for checking a single feature
export function useFeature(key: keyof FeatureFlags): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
}
