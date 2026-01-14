export interface CookieConsent {
  analytics?: boolean;
  functional?: boolean;
  timestamp?: string;
}

/**
 * Get the user's cookie consent preferences
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const consent = localStorage.getItem('cookie-consent');
    return consent ? JSON.parse(consent) : null;
  } catch (error) {
    console.error('[cookie-consent] Failed to parse consent', error);
    return null;
  }
}

/**
 * Check if user has consented to analytics
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics ?? false;
}

/**
 * Check if user has consented to functional cookies
 */
export function hasFunctionalConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.functional ?? false;
}

/**
 * Check if user has made any consent choice
 */
export function hasConsented(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Track event with analytics (only if consent given)
 */
export function trackEvent(action: string, category: string, label?: string) {
  if (!hasAnalyticsConsent()) {
    console.debug('[analytics] Skipped - no consent:', { action, category, label });
    return;
  }

  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}

/**
 * Load external scripts conditionally based on consent
 */
export function loadConditionalScript(src: string, options: { consent: 'analytics' | 'functional'; async?: boolean; defer?: boolean } = { consent: 'functional' }) {
  if (typeof window === 'undefined') return;

  const hasConsent = options.consent === 'analytics' ? hasAnalyticsConsent() : hasFunctionalConsent();
  
  if (!hasConsent) {
    console.debug('[cookie-consent] Script not loaded - no consent:', src);
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  if (options.async) script.async = true;
  if (options.defer) script.defer = true;
  document.head.appendChild(script);
}

/**
 * Listen for consent changes (e.g., when user changes preferences)
 */
export function onConsentChange(callback: (consent: CookieConsent) => void) {
  if (typeof window === 'undefined') return;

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'cookie-consent' && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch (error) {
        console.error('[cookie-consent] Failed to parse consent change', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => window.removeEventListener('storage', handleStorageChange);
}
