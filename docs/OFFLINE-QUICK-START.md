# Offline Features - Quick Start

## 🚀 For Users

### Install on Phone

**iOS (Safari):**
1. Open website
2. Tap Share button (↗)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. App is now on home screen!

**Android (Chrome):**
1. Open website
2. Tap menu (⋮)
3. Tap "Install app"
4. Tap "Install"
5. App is now on home screen!

### Use Offline

Once installed:
- App works when you **lose signal**
- Submitted forms are **saved automatically**
- When back online, forms **sync automatically**
- Look for **status badge** in bottom-right corner:
  - 🟢 Green = Online
  - 🔴 Red = Offline
  - ⏳ "5 wachtend" = 5 items pending sync

### What Works Offline

✅ View cached pages
✅ View maps (last cached version)
✅ View documents
✅ Submit forms (saved for sync)
✅ Browse all previously viewed pages

❌ New data from server
❌ Real-time updates
❌ Live check-ins (until back online)

## 👨‍💻 For Developers

### Using Offline Data in Components

**Simple - Fetch with offline fallback:**
```typescript
import { useFetchOffline } from '~/lib/offline.hooks';

export function MyComponent() {
  const { data, isCached, isLoading, error } = useFetchOffline<RallyZone[]>(
    '/api/rally-zones',
    { cacheKey: 'rally-zones' }
  );

  if (isLoading) return <Loading />;
  if (error && !isCached) return <Error />;
  
  return (
    <div>
      {isCached && <span className="text-amber-600">📦 Cached</span>}
      {data?.map(zone => <ZoneCard key={zone._id} zone={zone} />)}
    </div>
  );
}
```

**For Forms:**
```typescript
import { OfflineForm } from '~/components/OfflineForm';

export function SubmitForm() {
  return (
    <OfflineForm 
      endpoint="/api/submit"
      method="POST"
      onSubmit={async (formData) => {
        return fetch('/api/submit', {
          method: 'POST',
          body: formData
        });
      }}
    >
      <input type="text" name="message" />
      <button type="submit">Send</button>
    </OfflineForm>
  );
}
```

### Adding New API Endpoints

**Step 1: Create API route**
```typescript
// app/routes/api.my-endpoint.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const data = await fetchYourData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // 5 minutes
    },
  });
}
```

**Step 2: Use in component**
```typescript
const { data } = useFetchOffline<MyDataType>(
  '/api/my-endpoint',
  { cacheKey: 'my-data' }
);
```

**Step 3: (Optional) Add to api.client.ts**
```typescript
export async function fetchMyData() {
  return fetchWithOfflineFallback<MyDataType>(
    '/api/my-endpoint',
    { cacheKey: 'my-data' }
  );
}
```

### Testing Offline Mode

**In Browser:**
1. Open DevTools (F12)
2. Network tab
3. Check "Offline" checkbox
4. Test your app
5. Uncheck to go back online

**On Phone:**
1. Settings → Airplane Mode (ON)
2. Test features
3. Airplane Mode (OFF)
4. Watch items auto-sync

### Cache Control Headers

**How long should data be cached?**

- **Static (never changes)**: `max-age=86400` (24 hours)
  - Zone definitions, documents
- **Slowly changing**: `max-age=3600` (1 hour)
  - User profiles, zones
- **Live data**: `max-age=300` (5 minutes)
  - Check-ins, events, scores

```typescript
'Cache-Control': 'public, max-age=3600' // 1 hour
```

### Checking Online Status

```typescript
import { useOfflineStatus } from '~/lib/offline.hooks';

export function Header() {
  const { isOnline, queuedCount } = useOfflineStatus();

  return (
    <header>
      {!isOnline && (
        <div className="bg-amber-100 p-2">
          📳 You're offline. Forms will sync when back online.
        </div>
      )}
      
      {queuedCount > 0 && (
        <div className="bg-blue-100 p-2">
          ⏳ {queuedCount} items pending sync...
        </div>
      )}
    </header>
  );
}
```

### Clearing Cache (For Testing)

```javascript
// In browser console:

// Clear everything
caches.keys().then(names => 
  Promise.all(names.map(n => caches.delete(n)))
);
indexedDB.deleteDatabase('DeuerDenBocht');
navigator.serviceWorker.getRegistrations().then(
  regs => regs.forEach(r => r.unregister())
);

// Then reload page
location.reload();
```

## 🔍 Debugging

### Check Service Worker

```javascript
// In console:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
  regs.forEach(reg => console.log('Scope:', reg.scope));
});
```

### Check Cached Data

```javascript
// In console:
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(requests => {
        console.log(name + ':', requests.map(r => r.url));
      });
    });
  });
});
```

### Check IndexedDB

```javascript
// In console:
const db = await indexedDB.open('DeuerDenBocht');
const tx = db.transaction('cache', 'readonly');
const data = await tx.store.getAll();
console.log('Cached items:', data);
```

### Monitor Live

DevTools → Application → Service Workers (or Caches)
- See registered service workers
- View cached requests/responses
- See IndexedDB storage

## 📊 Common Issues

### "App says offline but I'm online"
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check: `navigator.onLine` in console (should be `true`)

### "Service Worker not working"
- Check registered: DevTools → Application → Service Workers
- Should show green dot and "activated"
- Clear cache and hard refresh if not updating

### "Cached data is stale"
- Cache doesn't auto-expire
- Add "Refresh" button that clears specific cache
- Or use shorter `max-age` in cache headers

### "Forms not syncing"
- Check online status: Status badge should show green
- Check queued items: Status badge shows count
- Check console: Look for sync errors
- Try hard refresh to reconnect

## 🎯 Best Practices

1. **Always show cache indicator**
   - Users should know they're viewing cached data
   - Use `{isCached && <span>📦 Cached</span>}`

2. **Provide refresh button for important data**
   - Leaderboard, live events, check-ins
   - Don't cache super fresh data too long

3. **Make forms resilient**
   - Use `OfflineForm` wrapper
   - Show "Saved offline" message
   - Indicate when syncing

4. **Test offline regularly**
   - Enable offline in DevTools
   - Test on real phone with Airplane Mode
   - Test on slow connection (3G)

5. **Monitor cache size**
   - Usually 10% of available disk space
   - Avoid caching large files
   - Clean up old caches periodically

## 📚 Files to Reference

- **Using offline**: Check `/routes/live-map.tsx` for example
- **API routes**: Check `/routes/api.*.tsx` files
- **Forms**: Check components that use `OfflineForm`
- **Debugging**: DevTools → Application tab

## 🆘 Need Help?

Check logs:
1. Browser console (F12) for errors
2. DevTools → Application → Service Workers
3. Network tab to see cache hits
4. IndexedDB to verify data storage

---

**Last Updated**: January 13, 2026  
**Status**: ✅ Ready to use!
