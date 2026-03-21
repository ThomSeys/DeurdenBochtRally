import { useWebHaptics } from 'web-haptics/react';

/**
 * Semantic haptic feedback hook powered by web-haptics.
 * Silently no-ops on unsupported browsers.
 *
 * Usage:
 *   const { tap, select, success, error, warning, heavy } = useHaptics();
 */
export function useHaptics() {
  const { trigger } = useWebHaptics();

  return {
    /** Very short tap — navigation, toggles, pills */
    tap: () => trigger('selection'),
    /** Light tap — opening panels, selecting options */
    select: () => trigger('light'),
    /** Positive confirmation — check-in, challenge completed */
    success: () => trigger('success'),
    /** Negative feedback — errors, validation failures */
    error: () => trigger('error'),
    /** Warning — zone closed, proximity warning */
    warning: () => trigger('warning'),
    /** Heavy / urgent — SOS, destructive confirm */
    heavy: () => trigger('heavy'),
  };
}
