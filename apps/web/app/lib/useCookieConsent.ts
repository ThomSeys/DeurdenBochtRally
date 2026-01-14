import { useEffect, useState } from 'react';
import { getCookieConsent, onConsentChange, type CookieConsent } from '~/lib/cookie-consent';

/**
 * Hook to get current cookie consent and listen for changes
 * 
 * @example
 * const consent = useCookieConsent();
 * 
 * if (consent?.analytics) {
 *   // Load analytics
 * }
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial consent on mount
    setConsent(getCookieConsent());
    setIsLoading(false);

    // Listen for changes to consent (from other tabs or banner updates)
    const unsubscribe = onConsentChange((newConsent) => {
      setConsent(newConsent);
    });

    return unsubscribe;
  }, []);

  return { consent, isLoading, hasAnalytics: consent?.analytics ?? false, hasFunctional: consent?.functional ?? false };
}
