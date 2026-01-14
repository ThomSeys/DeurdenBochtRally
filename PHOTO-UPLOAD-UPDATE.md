# Photo Upload Update - Direct File Upload

## What Changed

The photo gallery now supports **direct file uploads** instead of requiring participants to upload images to external services (Sanity/Cloudinary) first.

## Changes Made

### 1. Updated Gallery Route (`apps/web/app/routes/gallery.tsx`)

**Before:**
- Required image URL input
- Participants had to upload to Sanity/Cloudinary first
- Just stored the URL in database

**After:**
- File input with drag & drop support
- Direct upload to Supabase Storage
- Automatic file validation (type, size)
- Unique filename generation
- Automatic cleanup on errors

### 2. Upload Process

```typescript
// Old workflow
User → Upload to Sanity → Get URL → Paste in form → Submit

// New workflow  
User → Select file → Upload → Done!
```

### 3. File Validation

- ✅ **Type check**: Only JPG, PNG, WebP allowed
- ✅ **Size limit**: Max 5 MB
- ✅ **Client validation**: Browser checks before upload
- ✅ **Server validation**: Double-check on server
- ✅ **Unique names**: `{userId}-{timestamp}.{ext}`

### 4. Storage Structure

```
participant-photos/
└── rally-photos/
    ├── user1-1234567890.jpg
    ├── user2-1234567891.png
    └── user3-1234567892.webp
```

### 5. Error Handling

- Upload fails → File removed from storage
- Database insert fails → File removed from storage
- No orphaned files left behind

## Setup Required

### Step 1: Create Storage Bucket

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage**
3. Click **New Bucket**
4. Configure:
   - Name: `participant-photos`
   - Public: ✅ **Yes**
   - Save

### Step 2: Test Upload

1. Start dev server: `npm run dev`
2. Go to `/gallery`
3. Click "Upload Foto"
4. Select an image
5. Submit
6. Verify in Supabase Storage

## Benefits

✅ **Better UX** - No external uploads needed  
✅ **Faster** - Direct upload, one step  
✅ **Simpler** - No Sanity/Cloudinary setup  
✅ **Cheaper** - Use existing Supabase plan  
✅ **Reliable** - Built-in error handling  
✅ **Secure** - Validation on both sides  

## Files Created/Updated

- ✅ `apps/web/app/routes/gallery.tsx` - Updated with file upload
- ✅ `scripts/setup-storage-bucket.sql` - Storage policies
- ✅ `docs/PHOTO-UPLOAD-SETUP.md` - Complete setup guide
- ✅ `ENHANCED-FEATURES-SETUP.md` - Updated instructions

## No Breaking Changes

- Existing photos with URLs still work
- Database schema unchanged
- API endpoints unchanged
- Only the upload mechanism changed

## Next Steps

1. **Create storage bucket** in Supabase (required)
2. **Test upload** with a sample image
3. **Monitor storage usage** in Supabase dashboard
4. Optional: Add image optimization with Sharp

## Storage Costs

**Supabase Free Tier:**
- 1 GB storage
- 2 GB bandwidth/month

**Estimate:**
- 100 photos × 2 MB = 200 MB
- Well within free tier!

---

**Setup is complete!** Just create the storage bucket and you're ready to go! 🎉
