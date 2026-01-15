# Photo Upload Setup Guide

## Overview
The photo gallery now supports **direct file uploads** instead of requiring external hosting. Photos are stored in Supabase Storage.

## Setup Steps

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New Bucket**
5. Configure the bucket:
   - **Name**: `participant-photos`
   - **Public**: ✅ **Yes** (check this box)
   - **File size limit**: 5 MB (or your preference)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 2. Apply Storage Policies

The storage policies are automatically created by Supabase, but you can verify or customize them:

1. In Supabase Dashboard, go to **Storage > participant-photos**
2. Click **Policies** tab
3. Ensure these policies exist:
   - ✅ Public can view (SELECT)
   - ✅ Authenticated can upload (INSERT)
   - ✅ Authenticated can delete own files (DELETE)

If you need custom policies, use the SQL in `scripts/setup-storage-bucket.sql`.

### 3. Test the Upload

1. Start your development server: `npm run dev`
2. Navigate to `/gallery`
3. Click **Upload Foto**
4. Select an image file (JPG, PNG, or WebP)
5. Add optional caption and location
6. Click **Upload Foto**
7. Check that the photo appears in "Mijn Foto's" section with "In behandeling" status

### 4. Verify Storage

1. In Supabase Dashboard, go to **Storage > participant-photos**
2. You should see uploaded files in the `rally-photos/` folder
3. Each file is named: `{userId}-{timestamp}.{ext}`

## File Upload Limits

- **Max file size**: 5 MB
- **Allowed formats**: JPG, JPEG, PNG, WebP
- **Naming**: Automatically generated with user ID and timestamp
- **Storage path**: `rally-photos/{userId}-{timestamp}.{ext}`

## How It Works

1. **User uploads file** via form with `<input type="file">`
2. **Server receives file** in action handler as `File` object
3. **Validation** checks file type and size
4. **Upload to Supabase Storage** using service role client
5. **Get public URL** for the uploaded file
6. **Store URL in database** with photo metadata
7. **Admin approval required** before photo is visible to all users

## Storage URL Format

Public URLs follow this pattern:
```
https://{project-ref}.supabase.co/storage/v1/object/public/participant-photos/rally-photos/{userId}-{timestamp}.jpg
```

## File Cleanup

If a database insert fails after upload, the file is automatically removed from storage to prevent orphaned files.

## Admin Photo Management

Admins can:
- View all uploaded photos at `/admin/gallery`
- Approve or reject pending photos
- Feature special photos
- Delete approved photos (removes from database, not storage)

To also remove files from storage when deleting via admin:
```typescript
// In admin.gallery.tsx delete action
await supabaseAdmin.storage
  .from('participant-photos')
  .remove([extractPathFromUrl(photo.image_url)]);
```

## Security

- ✅ Only authenticated users can upload
- ✅ File type validation (client + server)
- ✅ File size validation (5MB limit)
- ✅ Unique filenames prevent overwrites
- ✅ Public bucket allows serving images directly
- ✅ Admin approval required before public visibility

## Troubleshooting

### Upload fails with "Bucket not found"
- **Solution**: Create the `participant-photos` bucket in Supabase Dashboard

### Upload fails with "Permission denied"
- **Solution**: Ensure bucket is set to **Public**
- **Or**: Add proper storage policies (see `setup-storage-bucket.sql`)

### Image doesn't display
- **Solution**: Verify the bucket is **Public**
- **Check**: URL format should be `.../storage/v1/object/public/...`

### File size errors
- **Solution**: Reduce image size before upload
- **Or**: Increase max size in code (currently 5MB)

### Wrong MIME type error
- **Solution**: Convert image to JPG, PNG, or WebP format

## Optional Enhancements

### Image Optimization
Add image processing with Sharp or similar:
```typescript
import sharp from 'sharp';

const optimized = await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer();
```

### Client-side Preview
Add image preview before upload:
```typescript
const [preview, setPreview] = useState<string | null>(null);

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }
};
```

### Progress Indicator
Show upload progress for large files using XHR or fetch with progress events.

## Cost Considerations

Supabase Storage pricing (as of 2024):
- **Free tier**: 1 GB storage, 2 GB bandwidth per month
- **Pro plan**: 100 GB storage, 200 GB bandwidth included
- **Additional**: $0.021/GB storage, $0.09/GB bandwidth

Monitor usage in Supabase Dashboard under **Settings > Usage**.

## Complete!

Your photo gallery now supports direct file uploads with no external dependencies! 🎉
