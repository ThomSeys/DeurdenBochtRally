# Offline Data Handling

This guide explains how to handle data fetches gracefully in offline mode.

## Overview

The offline system provides:
- **Automatic caching** of successful API responses
- **Fallback to cached data** when offline
- **Queuing of submissions** that sync when back online
- **Visual status indicator** showing online/offline state and pending items
- **Browser detection** of online/offline changes

## Key Components

### 1. `offline.utils.ts` - Core Utilities

#### `fetchWithOfflineFallback<T>(url, options?)`
Enhanced fetch that automatically caches and falls back to cached data when offline.

**Usage in Loaders (Server-Side):**
```typescript
import { fetchWithOfflineFallback } from '~/lib/offline.utils';

export async function loader() {
  // This runs server-side, so only use regular fetch
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return { data };
}
```

**Usage in Client Components:**
```typescript
import { fetchWithOfflineFallback } from '~/lib/offline.utils';

const result = await fetchWithOfflineFallback<RallyZone[]>(
  '/api/rally-zones',
  { cacheKey: 'rally-zones' }
);

if (result.data) {
  console.log('Data:', result.data);
  if (result.isCached) {
    console.log('Showing cached data');
  }
}
```

#### `useFetchOffline<T>(url, options?)`
React hook for fetching data with offline support.

**Usage:**
```typescript
import { useFetchOffline } from '~/lib/offline.hooks';

function MyComponent() {
  const { data, isLoading, error, isCached, isOffline } = useFetchOffline<RallyZone[]>(
    '/api/rally-zones',
    { cacheKey: 'rally-zones' }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error && !isCached) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {isCached && <p className="text-amber-600">📦 Showing cached data</p>}
      {isOffline && <p className="text-red-600">🔴 You're offline</p>}
      {/* render data */}
    </div>
  );
}
```

#### `queueOfflineSubmission(endpoint, data, method?)`
Queue a submission to sync when back online.

**Usage:**
```typescript
import { queueOfflineSubmission } from '~/lib/offline.utils';

async function handleSubmit(data: SubmissionData) {
  try {
    // Try to send immediately
    const response = await fetch('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to submit');
  } catch (error) {
    // If offline or fetch fails, queue for later
    console.log('Queueing for offline sync...');
    await queueOfflineSubmission('/api/submissions', data, 'POST');
  }
}
```

### 2. `offline.hooks.ts` - React Hooks

#### `useOfflineStatus()`
Track online/offline state and count of queued submissions.

**Usage:**
```typescript
import { useOfflineStatus } from '~/lib/offline.hooks';

function MyComponent() {
  const { isOnline, queuedCount, isLoading } = useOfflineStatus();

  return (
    <div>
      Status: {isOnline ? '✅ Online' : '🔴 Offline'}
      {queuedCount > 0 && <p>{queuedCount} items waiting to sync</p>}
    </div>
  );
}
```

### 3. `OfflineStatusBadge` Component

Shows online/offline status and pending submission count in the bottom-right corner.

**Already integrated in root.tsx** - no additional setup needed!

## Common Patterns

### Pattern 1: API Route with Offline Fallback

```typescript
// routes/api.rally-zones.ts (Server loader)
export async function loader() {
  const response = await fetch(
    `${process.env.SANITY_API_URL}/data/rally-zones`
  );
  if (!response.ok) throw new Error('Failed to fetch zones');
  return response.json();
}
```

```typescript
// Component using the data
import { useFetchOffline } from '~/lib/offline.hooks';

export function RallyZonesList() {
  const { data: zones, isCached, isLoading, error } = useFetchOffline<RallyZone[]>(
    '/api/rally-zones',
    { cacheKey: 'rally-zones' }
  );

  if (isLoading) return <Skeleton />;
  if (error && !isCached) return <ErrorMessage />;
  
  return (
    <>
      {isCached && <CachedIndicator />}
      <ZonesList zones={zones} />
    </>
  );
}
```

### Pattern 2: Form Submission with Offline Queue

```typescript
import { isOnline, queueOfflineSubmission } from '~/lib/offline.utils';

export function CheckInForm() {
  const handleSubmit = async (formData: CheckInData) => {
    if (!isOnline()) {
      // Queue for later sync
      await queueOfflineSubmission('/api/check-in', formData);
      showMessage('Queued for sync when back online');
      return;
    }

    // Send immediately if online
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Fallback to queue if request fails
        await queueOfflineSubmission('/api/check-in', formData);
        showMessage('Saving for later...');
      }
    } catch {
      await queueOfflineSubmission('/api/check-in', formData);
      showMessage('Offline mode: will sync when connected');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Pattern 3: Conditional Rendering Based on Online Status

```typescript
import { useOfflineStatus } from '~/lib/offline.hooks';

export function HeaderActions() {
  const { isOnline } = useOfflineStatus();

  return (
    <>
      {!isOnline && (
        <Alert variant="warning">
          You're offline. Some features may be limited.
        </Alert>
      )}
      
      <Button disabled={!isOnline}>
        Sync Now
      </Button>
    </>
  );
}
```

## Data Flow

### Online Mode (Normal Operation)
```
User Action
    ↓
fetch() with offline wrapper
    ↓
Network Request → Server
    ↓
Response ✓
    ↓
Cache in IndexedDB
    ↓
Display Data
```

### Offline Mode
```
User Action
    ↓
fetch() with offline wrapper
    ↓
Detect offline (navigator.onLine = false)
    ↓
Return cached data from IndexedDB
    ↓
Display Cached Data (with indicator)
```

### Form Submission Offline
```
User Submits Form
    ↓
Check if online
    ↓
If offline: Queue in IndexedDB
    ↓
Service Worker: sync tag trigger when back online
    ↓
Service Worker: Process queue, send to server
    ↓
Mark as synced in IndexedDB
```

## Testing Offline Mode

### In Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Try navigating and submitting forms

### On Mobile:
1. Open Settings
2. Enable Airplane Mode
3. Test the app
4. Disable Airplane Mode
5. Watch submissions sync automatically

## Best Practices

1. **Always provide cache keys** for data that should persist offline:
   ```typescript
   useFetchOffline('/api/data', { cacheKey: 'my-data' })
   ```

2. **Show feedback to users** about cached/offline status:
   ```typescript
   {isCached && <span className="text-amber-600">📦 Cached</span>}
   ```

3. **Handle queued submissions gracefully** in UI:
   ```typescript
   const { queuedCount } = useOfflineStatus();
   if (queuedCount > 0) showNotification(`${queuedCount} items pending sync`);
   ```

4. **Don't require online status unnecessarily**:
   ```typescript
   // ❌ Bad: Forces user to be online
   if (!isOnline) return <OfflinePage />;
   
   // ✅ Good: Show cached data with indicator
   const { data, isCached } = useFetchOffline(url);
   if (!data) return <ErrorPage />;
   if (isCached) return <WithCacheIndicator data={data} />;
   ```

5. **Queue submissions before showing errors**:
   ```typescript
   // ✅ Good: Try send, queue if it fails
   try {
     await submitData();
   } catch {
     await queueOfflineSubmission(endpoint, data);
   }
   ```

## Troubleshooting

### Data not caching
- Check browser has IndexedDB available
- Verify cache key is consistent
- Check browser console for errors

### Submissions not syncing
- Ensure service worker is registered
- Check background sync is enabled in browser
- Verify endpoint is correct
- Check browser storage limits

### Stale cached data
- Cache doesn't expire automatically
- Add manual refresh button for fresh data
- Or clear cache and reload

## Service Worker Integration

The service worker (`/public/sw.js`) automatically:
1. Intercepts all fetch requests
2. Serves cached assets when offline
3. Listens for background sync events
4. Processes queued submissions when back online

No additional setup needed - it works automatically!
