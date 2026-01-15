# PWA & Offline Integration Complete

This document summarizes all the offline and PWA functionality that has been integrated into the application.

## ✅ What's Been Implemented

### 1. **PWA Setup** (Ready to Install)
- ✅ `manifest.json` - PWA manifest with app metadata
- ✅ Service worker registration in `root.tsx`
- ✅ PWA meta tags (iOS, Android, theme color)
- ✅ Offline fallback page (`offline.html`)

**To Install:**
- iOS: Safari → Share → Add to Home Screen
- Android: Chrome → Menu → Install app

### 2. **Offline Data Handling**

#### Core Utilities (`lib/offline.utils.ts`)
- `fetchWithOfflineFallback<T>()` - Fetch with auto-caching & fallback
- `queueOfflineSubmission()` - Queue forms for later sync
- `getCachedData()` / `cacheData()` - IndexedDB access
- `getQueuedSubmissions()` - View pending items

#### React Hooks (`lib/offline.hooks.ts`)
- `useOfflineStatus()` - Track online/offline + pending count
- `useFetchOffline<T>()` - Client-side fetch with offline support

#### Components
- `OfflineStatusBadge` - Visual indicator in bottom-right
- `OfflineForm` - Form wrapper with offline queueing
- `useOfflineForm()` - Hook for custom forms

### 3. **API Routes for Data Caching**
All return JSON with proper cache headers:

| Route | Purpose | Cache TTL | Used By |
|-------|---------|-----------|---------|
| `/api/rally-zones` | Zone metadata | 1 hour | Live Map |
| `/api/check-ins` | Participant check-ins | 5 min | Live Map |
| `/api/event-markers` | Active events | 5 min | Live Map |
| `/api/gpx-route` | Main route file | 24 hours | Dashboard |
| `/api/leaderboard` | Scores & rankings | 5 min | Dashboard |
| `/api/documents` | PDFs & guides | 24 hours | Dashboard |
| `/api/participant` | User profile | 1 hour | Check-in |

### 4. **Service Worker (`public/sw.js`)**

**Cache Strategies:**
- **API calls**: Network-first → cache → offline response
- **Navigation**: Network-first → cache → offline.html
- **Static assets**: Cache-first → network
- **Background sync**: Queue submissions, sync when back online

**Features:**
- ✅ Automatic API response caching
- ✅ Offline detection & fallback
- ✅ Background sync with IndexedDB queue
- ✅ Smart error responses for API failures

### 5. **Live Map Updated** 
- Now fetches data client-side via new API routes
- Shows "📦 Cached" indicator when using cached data
- Auto-refreshes every 30 seconds
- Displays cached status in legend

## 🚀 How to Use

### For Data Fetching in Components

```typescript
import { useFetchOffline } from '~/lib/offline.hooks';

function MyComponent() {
  const { data, isCached, isLoading, error } = useFetchOffline<MyType>(
    '/api/my-endpoint',
    { cacheKey: 'my-key' }
  );

  if (isLoading) return <Loading />;
  if (error && !isCached) return <Error />;
  
  return (
    <>
      {isCached && <div className="text-amber-600">📦 Cached</div>}
      {/* render data */}
    </>
  );
}
```

### For Form Submissions

```typescript
import { OfflineForm } from '~/components/OfflineForm';

function MyForm() {
  return (
    <OfflineForm
      endpoint="/api/submit"
      method="POST"
      onSubmit={async (formData) => {
        return fetch('/api/submit', {
          method: 'POST',
          body: formData,
        });
      }}
    >
      {/* form fields */}
      <button type="submit">Submit</button>
    </OfflineForm>
  );
}
```

### Checking Online Status

```typescript
import { useOfflineStatus } from '~/lib/offline.hooks';

function MyComponent() {
  const { isOnline, queuedCount } = useOfflineStatus();

  return (
    <>
      {!isOnline && <Warning>You're offline</Warning>}
      {queuedCount > 0 && <Info>{queuedCount} items pending</Info>}
    </>
  );
}
```

## 📊 Data Flow

### When Online
```
User Action
    ↓
fetch() / useFetchOffline()
    ↓
Network Request → Server
    ↓
Response ✓
    ↓
Cache in IndexedDB + Service Worker
    ↓
Display Data
```

### When Offline (Fetch)
```
User Action
    ↓
useFetchOffline() detects offline
    ↓
Return cached data from IndexedDB
    ↓
Show "📦 Cached" indicator
    ↓
Display Data
```

### When Offline (Form)
```
User Submits Form
    ↓
Detect offline (navigator.onLine = false)
    ↓
Queue in IndexedDB (submission store)
    ↓
Show "Saved offline" message
    ↓
Service Worker: Sync when back online
    ↓
Service Worker: POST to /api/submit
    ↓
Mark as synced, notify user
```

## 🧪 Testing Offline Mode

### Browser (Chrome DevTools)
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Offline** checkbox
4. Navigate and test features
5. Uncheck to go back online

### Device (Mobile)
1. Open Settings
2. Enable **Airplane Mode**
3. Test app functionality
4. Disable Airplane Mode
5. Watch items auto-sync

### Simulate Slow Connection
1. DevTools → Network tab
2. Change **Throttling** dropdown to "Slow 3G"
3. Test network behavior

## 🔧 Backend Integration

### Creating New API Routes

For any new data endpoint, create a route like:

```typescript
// routes/api.my-data.tsx
export async function loader() {
  const data = await fetchMyData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Adjust as needed
    },
  });
}
```

Then use in components:
```typescript
const { data } = useFetchOffline<typeof data>(
  '/api/my-data',
  { cacheKey: 'my-data' }
);
```

### Cache TTL Guidelines

| Type | TTL | Reason |
|------|-----|--------|
| Static (zones, docs) | 1-24 hours | Changes rarely |
| Live data (check-ins) | 5 minutes | Updates frequently |
| User data (profile) | 1 hour | Balance freshness & offline |
| Leaderboard | 5 minutes | Must stay current |

## 🐛 Troubleshooting

### Data not caching
- Check browser has IndexedDB enabled
- Verify cache key is consistent
- Check browser console for errors
- Ensure API response has `200` status

### Submissions not syncing
- Verify service worker is registered: DevTools → Application → Service Workers
- Check background sync enabled: DevTools → Application → Background Sync
- Verify endpoint is correct (`/api/submit`)
- Check browser storage quota

### Stale cached data
- Cache doesn't auto-expire
- Add refresh button for manual refresh
- Or clear cache: DevTools → Application → Storage → Clear site data

### Service worker not updating
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Uninstall app and reinstall
- Clear cache: DevTools → Application → Service Workers → Unregister

## 📱 PWA Installation

### Android (Chrome)
1. Visit site
2. Menu (⋮) → Install app
3. Confirm install
4. App appears on home screen

### iOS (Safari)
1. Visit site
2. Share (↗) → Add to Home Screen
3. Enter app name
4. Tap Add
5. App appears on home screen

### Features When Installed
- ✅ Standalone window (no browser UI)
- ✅ Offline access to cached pages
- ✅ Auto-sync of queued submissions
- ✅ Custom splash screen
- ✅ App icon on home screen

## 🎯 Icon Generation

Need to create app icons. Run in browser:
```
Visit: /public/generate-icons.html
Download: icon-192.png and icon-512.png
Save to: /apps/web/public/
```

Replace placeholders in manifest.json with your custom icons.

## 📚 Related Documentation

- [Offline Data Handling](./OFFLINE-DATA-HANDLING.md) - Detailed patterns and examples
- [PWA Setup](./PWA-SETUP.md) - Original setup notes
- [Service Worker Guide](./SW-GUIDE.md) - Advanced SW patterns

## ✨ What's Next

Optional enhancements:

1. **Install Prompt UI** - Custom "Install App" button
2. **Offline Submission UI** - Show queued items count
3. **Cache Management** - UI to clear cache, manage storage
4. **Periodic Sync** - Auto-sync at intervals
5. **Push Notifications** - Notify user of sync completion
6. **Offline Analytics** - Track offline session metrics

## 📞 Support

Issues with offline mode? Check:
1. Is service worker registered? (DevTools → Application)
2. Is IndexedDB available? (DevTools → Application → Storage)
3. Is browser online? (Use `navigator.onLine` in console)
4. Are there cache headers? (DevTools → Network → Response Headers)
5. Browser storage quota (usually 10% of disk space)

---

**Status**: ✅ All offline infrastructure in place. Ready for testing and deployment.
