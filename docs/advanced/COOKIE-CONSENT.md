# Cookie Consent Implementation Guide

## Overview

We have a complete cookie consent system that respects user preferences and only loads non-essential cookies when the user has consented.

## How It Works

1. **Banner**: Shows on first visit to new users
2. **Storage**: User choice is stored in `localStorage` with key `cookie-consent`
3. **Consent Object**: Contains `analytics` and `functional` boolean flags
4. **Enforcement**: Components and scripts check consent before loading

## Using Cookie Consent

### In React Components

```typescript
import { useCookieConsent } from '~/lib/useCookieConsent';

export function MyComponent() {
  const { consent, hasAnalytics, hasFunctional } = useCookieConsent();

  return (
    <div>
      {hasAnalytics && <p>Analytics is enabled</p>}
      {!hasAnalytics && <p>Analytics is disabled</p>}
    </div>
  );
}
```

### Tracking Events (Analytics)

```typescript
import { trackEvent, hasAnalyticsConsent } from '~/lib/cookie-consent';

// Manually track an event
trackEvent('button_click', 'engagement', 'subscribe');

// Or check consent first
if (hasAnalyticsConsent()) {
  // Send analytics
}
```

### Loading External Scripts

```typescript
import { loadConditionalScript } from '~/lib/cookie-consent';

// Load Google Analytics only if user consented
loadConditionalScript(
  'https://www.googletagmanager.com/gtag/js?id=GA_ID',
  { consent: 'analytics', async: true }
);
```

### Checking Consent Status

```typescript
import { hasConsented, hasAnalyticsConsent, getCookieConsent } from '~/lib/cookie-consent';

// Check if user made any choice
if (hasConsented()) {
  console.log('User has made a choice');
}

// Check specific consent type
if (hasAnalyticsConsent()) {
  console.log('User allowed analytics');
}

// Get full consent object
const fullConsent = getCookieConsent();
console.log(fullConsent);
// { analytics: true, functional: false, timestamp: '2026-01-14T...' }
```

## Cookie Types

### Essential Cookies (Always Active)
- Session management (`__Host-session`)
- Site password (`site-password`)
- CSRF tokens
- **No consent needed**

### Analytics Cookies (Requires `analytics: true`)
- Google Analytics (`_ga`, `_gid`, `_gat`)
- Page tracking
- User behavior analysis

### Functional Cookies (Requires `functional: true`)
- User preferences
- Cookie consent status (`cookie-consent`)
- UI state (theme, language)
- Remember-me functionality

## Listening for Consent Changes

If you need to react when consent changes (e.g., user opens preferences in another tab):

```typescript
import { onConsentChange } from '~/lib/cookie-consent';

useEffect(() => {
  const unsubscribe = onConsentChange((newConsent) => {
    console.log('Consent changed:', newConsent);
    // Reload analytics or other services
  });

  return unsubscribe;
}, []);
```

## Implementation Checklist

- [x] Cookie banner component
- [x] Cookie policy page
- [x] Consent storage (localStorage)
- [x] Consent utilities (`cookie-consent.ts`)
- [x] React hook (`useCookieConsent.ts`)
- [ ] Google Analytics integration (use `trackEvent` or `loadConditionalScript`)
- [ ] Other third-party script loading (use `loadConditionalScript`)
- [ ] Admin panel to see consent stats
- [ ] GDPR compliance verification

## Best Practices

1. **Always check consent before loading third-party scripts**
   ```typescript
   if (hasAnalyticsConsent()) {
     // Load Google Analytics
   }
   ```

2. **Use the hook for reactive components**
   ```typescript
   const { hasAnalytics } = useCookieConsent();
   // Component updates when consent changes
   ```

3. **Don't store unnecessary data**
   - Only store data user explicitly consented to
   - Regular cookies are fine for essential features

4. **Sync across tabs**
   - The banner dispatches `StorageEvent` when consent changes
   - Use `onConsentChange` to listen in other components

5. **Privacy by default**
   - Analytics is opt-in, not opt-out
   - Don't track anything until user consents

## Testing

To test the consent system:

1. **Clear consent**: Open DevTools Console and run:
   ```javascript
   localStorage.removeItem('cookie-consent');
   location.reload();
   ```

2. **Accept all**: Open Console and run:
   ```javascript
   localStorage.setItem('cookie-consent', JSON.stringify({
     analytics: true,
     functional: true,
     timestamp: new Date().toISOString()
   }));
   location.reload();
   ```

3. **Check current consent**: Open Console and run:
   ```javascript
   JSON.parse(localStorage.getItem('cookie-consent'));
   ```
