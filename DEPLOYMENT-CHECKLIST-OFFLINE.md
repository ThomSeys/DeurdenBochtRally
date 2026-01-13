# Offline Integration - Deployment Checklist

**Date**: January 13, 2026  
**Version**: 1.0.0

## ✅ Pre-Deployment Checklist

### Code & Files (All Created ✅)

- [x] `app/lib/offline.utils.ts` - Core offline utilities
- [x] `app/lib/offline.hooks.ts` - React hooks
- [x] `app/lib/api.client.ts` - API type definitions
- [x] `app/components/OfflineStatusBadge.tsx` - Status indicator
- [x] `app/components/OfflineForm.tsx` - Offline form wrapper
- [x] `app/routes/api.rally-zones.tsx` - API route
- [x] `app/routes/api.check-ins.tsx` - API route
- [x] `app/routes/api.event-markers.tsx` - API route
- [x] `app/routes/api.gpx-route.tsx` - API route
- [x] `app/routes/api.leaderboard.tsx` - API route
- [x] `app/routes/api.participant.tsx` - API route
- [x] `app/routes/api.documents.tsx` - API route
- [x] `public/manifest.json` - PWA manifest
- [x] `public/sw.js` - Service worker (enhanced)
- [x] `public/offline.html` - Offline fallback
- [x] `public/generate-icons.html` - Icon generator
- [x] Documentation files (4 guides)

### Root Layout (Modified ✅)

- [x] `app/root.tsx` - Service worker registration
- [x] `app/root.tsx` - PWA meta tags
- [x] `app/root.tsx` - Manifest link
- [x] `app/root.tsx` - OfflineStatusBadge component

### Live Map Route (Updated ✅)

- [x] `app/routes/live-map.tsx` - Client-side data fetching
- [x] `app/routes/live-map.tsx` - Uses `useFetchOffline()`
- [x] `app/routes/live-map.tsx` - Shows cached indicators

### Service Worker (Enhanced ✅)

- [x] `public/sw.js` - API caching
- [x] `public/sw.js` - Network-first for API
- [x] `public/sw.js` - Background sync
- [x] `public/sw.js` - Error handling

---

## 🎨 To Do Before Deployment

### 1. Generate App Icons ⚠️ REQUIRED

**What to do:**
1. Open `apps/web/public/generate-icons.html` in browser
2. Click "Download 192x192 Icon"
3. Click "Download 512x512 Icon"
4. Move files to `apps/web/public/`:
   - `icon-192.png`
   - `icon-512.png`

**Why:** Manifest requires these icons. If missing, PWA won't install.

**Status:** ⏳ Pending (placeholder exists)

### 2. Verify Manifest Configuration

**Check**: `/apps/web/public/manifest.json`

```json
{
  "name": "Deur Den Bocht Rally 2026",
  "short_name": "DDB",
  "description": "Rally app with offline support",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4F46E5",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [x] Manifest created ✅
- [x] Icon sizes correct ✅
- [ ] Icons generated 🔄
- [x] Theme color set ✅

### 3. Test Service Worker Registration

**In browser console (after deployment):**
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => {
    console.log('Service Workers:', regs);
    regs.forEach(r => console.log(r.scope));
  });
```

Should show one registration with scope `/`.

- [x] Code implemented ✅
- [ ] Test after deploy 🔄

### 4. Test Offline Functionality

**Desktop (Chrome DevTools):**
1. F12 → Network tab
2. Check "Offline"
3. Browse app
4. Verify cached pages load
5. Uncheck "Offline"

- [ ] Test online 🔄
- [ ] Test offline 🔄
- [ ] Test re-online 🔄

**Mobile (Real Device):**
1. Install app on iOS (Safari: Share → Add to Home Screen)
2. Install app on Android (Chrome: Menu → Install app)
3. Enable Airplane Mode
4. Test offline features
5. Disable Airplane Mode
6. Verify sync

- [ ] Test iOS 🔄
- [ ] Test Android 🔄

### 5. Verify Cache Headers

**For each API route**, check Response Headers in DevTools:

```
Cache-Control: public, max-age=300
Content-Type: application/json
```

- [x] Routes created with headers ✅
- [ ] Verify in production 🔄

### 6. Test Form Offline Queueing

**Desktop:**
1. Go offline (DevTools → Network → Offline)
2. Submit a form
3. Should see "Saved offline" message
4. Go online
5. Form should auto-sync

- [ ] Test form submission 🔄
- [ ] Check queue updates 🔄
- [ ] Verify sync 🔄

---

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
git add -A
git commit -m "feat: Add complete offline support & PWA

- Add offline utilities & React hooks
- Create API routes for all data
- Enhance service worker with API caching
- Add PWA manifest & offline fallback
- Update root layout with PWA setup
- Refactor live-map to client-side data fetching
- Add offline form wrapper component
- Add comprehensive documentation"
```

### Step 2: Generate Icons (One-Time)
```bash
# Before pushing
1. Open apps/web/public/generate-icons.html
2. Download both PNG files
3. Save to apps/web/public/
4. git add icon-192.png icon-512.png
5. git commit "feat: Add PWA app icons"
```

### Step 3: Push to Vercel
```bash
git push origin main
# Vercel auto-deploys
```

### Step 4: Verify Deployment
1. Visit deployed URL
2. Check service worker: DevTools → Application → Service Workers
3. Check manifest: DevTools → Application → Manifest
4. Test offline mode
5. Test mobile installation

### Step 5: Monitor in Production
- Check DevTools console for errors
- Monitor service worker activity
- Check cache hit rates
- Monitor storage quota usage

---

## 📋 Testing Checklist

### Before Deployment

- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] Service worker syntax valid
- [ ] Manifest JSON valid
- [ ] API routes tested
- [ ] Component imports correct

### After Deployment

- [ ] Site loads normally
- [ ] Service worker registers
- [ ] Manifest loads (DevTools)
- [ ] Can go offline (DevTools)
- [ ] Cached pages load offline
- [ ] Status badge appears
- [ ] Forms work offline
- [ ] Auto-sync works when back online

### Mobile Testing

- [ ] iOS can install (Safari)
- [ ] Android can install (Chrome)
- [ ] App icon shows on home screen
- [ ] App opens in standalone mode
- [ ] Works offline (Airplane Mode)
- [ ] Syncs when back online
- [ ] No console errors

---

## 🔧 Troubleshooting

If service worker not registering:

1. Check `/sw.js` is accessible (visit in browser)
2. Check `root.tsx` has registration code
3. Clear cache: DevTools → Application → Storage → Clear site data
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
5. Check console for errors

If icons not showing:

1. Verify files exist: `/apps/web/public/icon-192.png` & `icon-512.png`
2. Check manifest references: `src: "/icon-192.png"`
3. Check file format: Must be PNG
4. Check file sizes: 192x192 and 512x512 pixels

If forms not queuing:

1. Go offline: DevTools → Network → Offline
2. Check console: Should show queueing message
3. Check IndexedDB: DevTools → Application → IndexedDB → DeuerDenBocht → submissions
4. Verify service worker is registered

---

## 📊 Post-Deployment Monitoring

### First Week
- Daily: Check console logs for errors
- Daily: Test offline functionality
- Check: Service worker update frequency
- Monitor: Cache sizes (should be <1MB)

### Ongoing
- Weekly: Check error logs
- Weekly: Monitor PWA installations
- Monthly: Review cache performance
- Quarterly: Check storage quota usage

### Metrics to Track
- Service worker registration rate
- Offline usage rate
- Form submission queue size
- Cache hit rate (from SW logs)
- Storage usage (per user)

---

## 🚨 Rollback Plan

If critical issues discovered:

1. **Immediate**: Disable service worker in root.tsx
2. **Option 1**: Comment out service worker registration
3. **Option 2**: Delete `/public/sw.js` content (replaces with offline error)
4. **Communication**: Notify users of temporary offline support disabled
5. **Fix**: Debug and fix issues
6. **Re-enable**: Re-enable with proper fix

---

## ✨ Success Criteria

Deployment is successful when:

- ✅ Service worker registers (DevTools shows active)
- ✅ Can go offline and browse cached content
- ✅ Forms save offline and sync when back online
- ✅ Status badge shows correct status
- ✅ App installs on iOS (Safari) & Android (Chrome)
- ✅ Installed app works fully offline
- ✅ No console errors
- ✅ Users can submit while offline
- ✅ Cached data loads instantly
- ✅ Documents available offline

---

## 📞 Support

### For Users
- "How do I install?" → See OFFLINE-QUICK-START.md
- "It says offline but I'm online" → Hard refresh
- "Forms aren't syncing" → Check status badge

### For Developers  
- Service worker issues → Check DevTools → Application
- Cache issues → Check DevTools → Network
- Submission queue → Check IndexedDB in DevTools
- See docs: OFFLINE-DATA-HANDLING.md, PWA-OFFLINE-COMPLETE.md

---

## ✅ Sign-Off

- [ ] All files created & reviewed
- [ ] All modified files reviewed  
- [ ] Icons generated
- [ ] Deployment plan reviewed
- [ ] Testing plan reviewed
- [ ] Team notified
- [ ] Ready to deploy ✨

**Deployment approved by**: _________________  
**Date**: ________________  
**Time**: ________________  
**Vercel URL**: _______________________  

---

**Next steps after deployment**: 
1. Test thoroughly on real devices
2. Monitor error logs
3. Gather user feedback
4. Plan future enhancements (push notifications, etc.)

---

**Version**: 1.0.0  
**Status**: Ready for Deployment ✨  
**Last Updated**: January 13, 2026
