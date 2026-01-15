# CSRF Protection Quick Reference

## TL;DR - How to Add CSRF Protection to a Form

### 3 Simple Steps:

#### 1️⃣ Update Loader
```tsx
import { getCSRFToken } from '~/lib/csrf.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const csrfToken = await getCSRFToken(request);
  return { csrfToken };
}
```

#### 2️⃣ Add Hidden Input to Form
```tsx
import CSRFInput from '~/components/CSRFInput';
import { useLoaderData, Form } from 'react-router';

export default function MyPage() {
  const { csrfToken } = useLoaderData<typeof loader>();
  
  return (
    <Form method="post">
      <CSRFInput token={csrfToken} />
      <input type="text" name="field" />
      <button>Submit</button>
    </Form>
  );
}
```

#### 3️⃣ Verify in Action
```tsx
import { verifyCSRFToken } from '~/lib/csrf.server';

export async function action({ request }: ActionFunctionArgs) {
  // Always verify first (before other checks)
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    return { error: 'Invalid form submission', status: 403 };
  }
  
  // Then process normally
  const formData = await request.formData();
  // ... rest of action
}
```

---

## Copy-Paste Templates

### ✅ Protected Form Template (Complete)

```tsx
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form } from 'react-router';
import { getCSRFToken } from '~/lib/csrf.server';
import { verifyCSRFToken } from '~/lib/csrf.server';
import { requireUserId } from '~/lib/session.server';
import CSRFInput from '~/components/CSRFInput';

export const meta: MetaFunction = () => {
  return [{ title: 'My Form - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const csrfToken = await getCSRFToken(request);
  return { csrfToken };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  // ⚠️ CSRF verification MUST be first
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    return { error: 'Form submission invalid', status: 403 };
  }
  
  if (request.method !== 'POST') {
    return { error: 'Invalid method', status: 405 };
  }
  
  const formData = await request.formData();
  const field1 = formData.get('field1');
  
  if (!field1 || typeof field1 !== 'string') {
    return { error: 'Missing field1', status: 400 };
  }
  
  // Process the form
  try {
    // ... do something with data
    return { success: true };
  } catch (error) {
    return { error: 'Failed to process form', status: 500 };
  }
}

export default function MyForm() {
  const { csrfToken } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <Form method="post">
        <CSRFInput token={csrfToken} />
        
        <label>
          Field 1:
          <input type="text" name="field1" required />
        </label>
        
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
```

### ✅ Admin Protected Form Template

```tsx
import { requireAdmin } from '~/lib/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request); // Ensures admin
  const csrfToken = await getCSRFToken(request);
  return { csrfToken, userId };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireAdmin(request); // Ensure admin on action too
  
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    return { error: 'Invalid submission', status: 403 };
  }
  
  // ... rest of action
}
```

---

## Common Mistakes ❌

### ❌ Mistake 1: Forgetting CSRFInput
```tsx
// ❌ WRONG - Form has no CSRF token
<Form method="post">
  <input type="text" name="name" />
  <button>Submit</button>
</Form>

// ✅ CORRECT
<Form method="post">
  <CSRFInput token={csrfToken} />
  <input type="text" name="name" />
  <button>Submit</button>
</Form>
```

### ❌ Mistake 2: Not Verifying CSRF Token
```tsx
// ❌ WRONG - No token verification
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // ... process immediately
}

// ✅ CORRECT
export async function action({ request }: ActionFunctionArgs) {
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    return { error: 'Invalid submission', status: 403 };
  }
  
  const formData = await request.formData();
  // ... process
}
```

### ❌ Mistake 3: CSRF Check Not First
```tsx
// ❌ WRONG - Check other things first
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  // Only check CSRF after other processing
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    return { error: 'Invalid', status: 403 };
  }
}

// ✅ CORRECT - CSRF check is first
export async function action({ request }: ActionFunctionArgs) {
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    return { error: 'Invalid', status: 403 };
  }
  
  const userId = await requireUserId(request);
  const formData = await request.formData();
}
```

### ❌ Mistake 4: Applying to GET Requests
```tsx
// ❌ WRONG - GET requests don't need CSRF
export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'GET') {
    // This is checked automatically, safe methods skip verification
  }
}

// ✅ CORRECT - verifyCSRFToken() auto-skips GET/HEAD
const isValid = await verifyCSRFToken(request); // Returns true for GET
```

---

## Safe Methods Auto-Skip CSRF Check

The `verifyCSRFToken()` function automatically returns `true` for safe HTTP methods:
- ✅ GET
- ✅ HEAD

These methods don't modify data, so CSRF protection isn't needed.

---

## Routes Status

### Already Protected ✅
- Root layout (CSRF token available to all pages)

### Need Implementation ⚠️
- `login.tsx` - Login form
- `registration._index.tsx` - Registration form
- `dashboard.rally-submission.tsx` - Rally code submission
- `zone.$zoneId.tsx` - Zone entry
- `admin.push-notifications.tsx` - Push notifications
- `admin.check-in.tsx` - Admin check-in
- `admin.leaderboard.tsx` - Leaderboard
- All other admin forms

---

## Debugging

### Test if CSRF is Working

1. **Browser DevTools - Network Tab:**
   - Submit a form
   - Check the POST request
   - Look for `__csrf` in FormData

2. **Browser DevTools - Cookies:**
   - Look for `__csrf-token` cookie
   - Should have `HttpOnly`, `Secure` (prod), `SameSite=Lax`

3. **Manual Testing:**
   ```bash
   # Should fail (missing CSRF)
   curl -X POST http://localhost:5173/api/submit \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "field1=value"
   
   # Should succeed (with valid CSRF)
   # (Get token from form first)
   ```

---

## File Reference

| File | Purpose |
|------|---------|
| `lib/csrf.server.ts` | Core CSRF logic |
| `components/CSRFInput.tsx` | Form integration |
| `docs/CSRF-PROTECTION.md` | Full documentation |
| `docs/SECURITY-AUDIT.md` | Security report |

---

## Questions?

See:
- **Full Guide:** `docs/CSRF-PROTECTION.md`
- **Security Report:** `docs/SECURITY-AUDIT.md`
- **Code Examples:** Templates above

All implementations follow **OWASP security standards** ✅
