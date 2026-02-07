# Storage Security & RLS Configuration Guide

## Overview

This guide covers the Row-Level Security (RLS) policies needed for Supabase storage buckets to protect participant photos and profile pictures.

## Current Storage Buckets

1. **participant-photos** - Gallery, challenge, and rally photos
2. **profile-photos** - Profile picture photos

## Security Status

✅ **EXIF Data Stripping**: All photo uploads now strip EXIF metadata (GPS coordinates, camera info, timestamps) using the `sharp` library
- Implemented in: `api.upload-photo.ts`, `dashboard.profile-edit.tsx`, `gallery.tsx`

⏳ **RLS Policies**: Need to be configured in Supabase for both buckets

## RLS Policy Configuration

### Step 1: Access Supabase Console

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to: **Storage** → **Buckets**

### Step 2: Configure `participant-photos` Bucket

#### Policy: SELECT (Read)
- **Who**: Authenticated users
- **Condition**: Public photos (approved) OR owner (any status)

```sql
-- Allow reading approved (public) photos
((bucket_id = 'participant-photos') AND (auth.role() = 'authenticated') AND (
  (storage.foldername(name))[1] IN (
    SELECT id FROM participants WHERE id = auth.uid()
  )
))
OR
((bucket_id = 'participant-photos') AND (auth.role() = 'authenticated') AND (
  auth.uid() IN (
    SELECT participant_id FROM participant_photos 
    WHERE is_approved = true AND image_url LIKE '%' || storage.foldername(name)[1] || '%'
  )
))
```

**Simpler approach**: Just allow authenticated users to read all participant-photos (photos are moderated at DB level):
```sql
(bucket_id = 'participant-photos' AND auth.role() = 'authenticated')
```

#### Policy: INSERT (Upload)
- **Who**: Authenticated users (participants)
- **Condition**: Users can only upload to their own folder

```sql
(bucket_id = 'participant-photos' AND auth.role() = 'authenticated' AND 
 (storage.foldername(name))[1] = auth.uid())
```

#### Policy: UPDATE (Modify)
- Not typically needed for photos (no updates after upload)

#### Policy: DELETE (Remove)
- **Who**: Authenticated users (owners only) + Admins
- **Condition**: User is the owner of the file OR is admin

```sql
(bucket_id = 'participant-photos' AND auth.role() = 'authenticated' AND 
 ((storage.foldername(name))[1] = auth.uid() OR 
  auth.uid() IN (SELECT id FROM participants WHERE is_admin = true)))
```

### Step 3: Configure `profile-photos` Bucket

#### Policy: SELECT (Read)
```sql
(bucket_id = 'profile-photos' AND auth.role() = 'authenticated')
```

#### Policy: INSERT (Upload)
```sql
(bucket_id = 'profile-photos' AND auth.role() = 'authenticated' AND 
 (storage.foldername(name))[1] = auth.uid())
```

#### Policy: DELETE (Remove)
```sql
(bucket_id = 'profile-photos' AND auth.role() = 'authenticated' AND 
 ((storage.foldername(name))[1] = auth.uid() OR 
  auth.uid() IN (SELECT id FROM participants WHERE is_admin = true)))
```

## Implementation Steps in Supabase UI

1. **Go to Storage → Policies**
2. **Click the bucket name** (e.g., `participant-photos`)
3. **Click "New Policy" or "+ Add Policy"**
4. **Select** the operation (SELECT, INSERT, DELETE)
5. **Choose** "For full customization, use SQL editor"
6. **Paste** the appropriate policy SQL above
7. **Click "Review"** then **"Save policy"**

## File Naming Convention

Our implementation uses this naming pattern:
```
participant-photos/
  {participant_id}/{type}_{timestamp}_{random}.{ext}
  
profile-photos/
  profiles/{participant_id}-{timestamp}.{ext}
```

This allows RLS policies to extract the participant ID from the folder path:
```
(storage.foldername(name))[1] = auth.uid()
```

## Testing RLS Policies

### Command Line Test (using Supabase CLI)

```bash
# List buckets
supabase storage ls

# Test upload (simulated)
supabase storage upload participant-photos/YOUR_ID/test_1234_5678.jpg ./test.jpg
```

### In Application

1. Log in as a participant
2. Upload a profile photo - should succeed
3. Try to delete another user's photo - should fail
4. Admins should be able to delete/modify any photo

## Monitoring & Troubleshooting

### Common Issues

**"Access Denied" on upload**
- Check that the RLS policy for INSERT is enabled
- Verify the user ID matches the folder path

**"File not found" on read**
- Check that the RLS policy for SELECT is enabled
- Verify the participant ID in the path is correct

**Photos visible to all users**
- This is intentional for approved photos (moderation at DB level)
- If privacy is needed, add DB-level filters at the application layer

### Audit Storage Access

Logs are available in:
- Supabase Dashboard: **Logs** → **Storage Queries**
- Look for 403 errors (permission denied) which indicate RLS policy blocks

## Additional Security Notes

1. **EXIF Data**: Already being stripped by sharp library during upload
2. **File Size Limits**: Enforced at upload endpoints (5MB max)
3. **File Type Validation**: MIME type checking at upload endpoints
4. **Moderation**: Photos require admin approval before public visibility (DB constraint)
5. **URL Security**: Public URLs are generated server-side, not directly exposed to clients for sensitive files

## Related Files

- Upload endpoint: [apps/web/app/routes/api.upload-photo.ts](apps/web/app/routes/api.upload-photo.ts)
- Profile upload: [apps/web/app/routes/dashboard.profile-edit.tsx](apps/web/app/routes/dashboard.profile-edit.tsx)
- Gallery upload: [apps/web/app/routes/gallery.tsx](apps/web/app/routes/gallery.tsx)
- EXIF utility: [apps/web/app/lib/image-exif.server.ts](apps/web/app/lib/image-exif.server.ts)

## Next Steps

1. ✅ EXIF stripping implemented
2. 🔲 Configure RLS policies in Supabase Console (manual step)
3. 🔲 Test all upload/delete operations with different user types
4. 🔲 Verify audit logs for any access violations
5. 🔲 Document in Sanity CMS for team reference
