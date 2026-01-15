# CSRF Protection Implementation Guide

## Overview

This document outlines the CSRF (Cross-Site Request Forgery) protection implemented across the Deur Den Bocht website.

## What is CSRF?

CSRF is a security vulnerability where an attacker tricks a user into making unwanted requests to a website where they're authenticated. For example, an attacker could create a malicious website that, when visited, makes a request to submit false rally codes on behalf of an authenticated user.

## Protection Mechanisms

### 1. **SameSite Cookies** (Primary Layer) ✅
The site uses `SameSite=Lax` on all session cookies:
- Cookies are only sent with same-site requests
- Cross-site requests won't include the session cookie
- Modern browsers (99%+ coverage) support this

**Files:**
- `lib/session.server.ts` - Session cookie with `sameSite: 'lax'`
- `lib/csrf.server.ts` - CSRF token cookie with `sameSite: 'lax'`

### 2. **Explicit CSRF Tokens** (Secondary Layer) ✅
Double-submit cookie pattern with token verification:

**How it works:**
1. Server generates unique token and stores in secure cookie
2. Token is also embedded in HTML form as hidden input
3. On form submission, server verifies cookie token matches form token
4. If they don't match, request is rejected

**Files:**
- `lib/csrf.server.ts` - Token generation and verification
- `components/CSRFInput.tsx` - Client component to inject token

## Implementation

### For Page Owners (Adding CSRF Protection to Forms)

#### Step 1: Update the Loader to Provide CSRF Token
```tsx
import { getCSRFToken } from '~/lib/csrf.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const csrfToken = await getCSRFToken(request);
  // ... other loader logic
  return { csrfToken, /* ... other data */ };
}
```

#### Step 2: Add Hidden CSRF Input to All Forms
```tsx
import CSRFInput from '~/components/CSRFInput';
import { useLoaderData, Form } from 'react-router';

export default function MyForm() {
  const { csrfToken } = useLoaderData<typeof loader>();
  
  return (
    <Form method="post">
      <CSRFInput token={csrfToken} />
      {/* rest of form fields */}
    </Form>
  );
}
```

#### Step 3: Verify Token in Action Function
```tsx
import { verifyCSRFToken } from '~/lib/csrf.server';

export async function action({ request }: ActionFunctionArgs) {
  // Verify CSRF token first
  const isValidToken = await verifyCSRFToken(request);
  if (!isValidToken) {
    return { error: 'Invalid form submission', status: 403 };
  }
  
  // Process the action
  const formData = await request.formData();
  // ... handle form data
}
```

## Already Protected Routes ✅

The following critical routes have CSRF protection:

### Implemented:
- `Root layout` - Token available to all pages via `useLoaderData`

### To Implement (Priority Order):

#### High Priority (User Data Modifications):
1. ⚠️ `login.tsx` - User authentication
2. ⚠️ `registration._index.tsx` - New user registration
3. ⚠️ `dashboard.rally-submission.tsx` - Rally code submission
4. ⚠️ `zone.$zoneId.tsx` - Zone entry submission

#### Medium Priority (Admin Functions):
5. `admin.push-notifications.tsx` - Push notification sending
6. `admin.check-in.tsx` - Manual check-in
7. `admin.leaderboard.tsx` - Leaderboard management
8. `admin.participants.tsx` - Participant management
9. `admin.submissions.tsx` - Submission management

#### API Routes:
- `api.push-subscribe.tsx` - Notification subscription
- `api.events.submit.tsx` - Event submission

## Security Architecture Layers

```
Layer 1: SameSite Cookies (Browser Level)
├─ Prevents cross-site cookie sending
├─ No explicit token needed for basic protection
└─ Coverage: 99%+ modern browsers

Layer 2: CSRF Tokens (Application Level)
├─ Double-submit cookie pattern
├─ Token verification before processing
└─ Works even if SameSite is bypassed

Layer 3: Session Validation (Authentication Level)
├─ requireUserId() - Ensures user is logged in
├─ User ID verification - Ensures data ownership
└─ Database checks - Validates user permissions

Layer 4: Data Validation
├─ Form data type checking
├─ Business logic validation
└─ Ownership verification (userId matches)
```

## Testing CSRF Protection

### Manual Testing:

1. **SameSite Testing:**
   - Open browser DevTools → Application → Cookies
   - Check `__session` and `__csrf-token` cookies
   - Verify `SameSite=Lax` is set

2. **Token Testing:**
   - Submit a form normally - should succeed
   - Modify the hidden `__csrf` value - should fail
   - Remove the `__csrf` input - should fail

3. **Cross-Site Testing:**
   - Create a test HTML file on different domain
   - Try to POST to `/dashboard/rally-submission`
   - Should fail because cookie won't be sent

### Automated Testing:
Consider adding tests to verify:
- Token generation creates unique tokens
- Token verification rejects invalid tokens
- Safe methods (GET, HEAD) bypass verification
- POST/PUT/DELETE requests require valid tokens

## Token Security Features

### 1. **Constant-Time Comparison**
Tokens are compared using constant-time string comparison to prevent timing attacks:
```tsx
// Compares all characters regardless of match position
// Prevents attackers from guessing token byte-by-byte
```

### 2. **Cryptographically Secure Generation**
Tokens are generated using `crypto.randomBytes(32)`:
- 32 bytes = 256 bits entropy
- Converted to hex = 64 character tokens
- Unguessable without server-side knowledge

### 3. **HttpOnly Cookies**
Token storage:
- HttpOnly flag prevents JavaScript access
- Prevents XSS attacks from stealing tokens
- Can only be accessed by HTTP requests

## Compliance & Standards

This implementation follows:
- **OWASP Top 10** - A05:2021 Broken Access Control
- **NIST Guidelines** - Session management security
- **CWE-352** - Cross-Site Request Forgery (CSRF)

## Migration Checklist

- [ ] Update login route with CSRF
- [ ] Update registration route with CSRF
- [ ] Update rally submission with CSRF
- [ ] Update all admin routes with CSRF
- [ ] Update all API endpoints with CSRF
- [ ] Test CSRF protection on all forms
- [ ] Document in user security notices
- [ ] Add to security.txt
- [ ] Update cookie policy

## Troubleshooting

### "Invalid form submission" Error (403)

**Causes:**
1. CSRF token expired (> 7 days old)
2. Token not included in form submission
3. Browser cookies are disabled
4. Token modified/corrupted

**Solutions:**
- Clear browser cookies and reload
- Ensure `<CSRFInput>` is in the form
- Check browser cookie settings
- Verify token value in form data

### Forms Not Working After Implementation

**Checklist:**
- [ ] Added `CSRFInput` component to form?
- [ ] Added `csrfToken` to loader return value?
- [ ] Added `verifyCSRFToken()` to action function?
- [ ] Using `POST` or equivalent method?
- [ ] Cookies enabled in browser?

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [React Router Security](https://reactrouter.com/start/framework/routing)
- [MDN CSRF](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [SameSite Cookie Explained](https://web.dev/samesite-cookie-explained/)
