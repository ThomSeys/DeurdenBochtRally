# QR Code Storage System

QR codes are generated during registration and stored as static PNG images for reliable email delivery.

## How It Works

### Registration Flow
1. User registers → unique QR code ID is generated (e.g., `a3f8d92e4b1c...`)
2. QR code is immediately converted to PNG image
3. Image saved to `apps/web/public/qrcodes/{userId}.png`
4. Database stores both `qr_code` (ID) and `qr_code_image_url` (e.g., `/qrcodes/{userId}.png`)

### Email Templates
Use the stored image URL:
```html
<img 
  src="https://deurdenbocht.be{{qr_code_image_url}}" 
  alt="Your Check-in QR Code"
  style="width: 300px; height: 300px;"
>
```

### Fallback System
If `qr_code_image_url` is null, the API endpoint generates it on-demand:
```tsx
<img src={user.qr_code_image_url || `/api/qrcode?text=${user.qr_code}`} />
```

## Setup

### 1. Database Migration
Run in Supabase SQL Editor:
```sql
ALTER TABLE participants ADD COLUMN IF NOT EXISTS qr_code_image_url TEXT;
```

### 2. Generate QR Codes for Existing Users
```bash
# Make sure .env file exists in root with:
# SUPABASE_URL=your-url
# SUPABASE_SERVICE_ROLE_KEY=your-key

npx tsx scripts/generate-qr-codes.ts
```

### 3. Create Public Directory
```bash
mkdir -p apps/web/public/qrcodes
```

## API Endpoint (Fallback)

**GET** `/api/qrcode?text={text}&format={format}`

Used as fallback for legacy users or if image generation fails during registration.

Parameters:
- `text` (required): The QR code ID
- `format` (optional): `png` (default) or `dataURL`

## Files Structure

```
apps/web/
  public/
    qrcodes/
      {userId-1}.png
      {userId-2}.png
  app/
    lib/
      qrcode.server.ts          # QR generation functions
    routes/
      registration._index.tsx    # Creates QR image on signup
      dashboard._index.tsx       # Displays QR image
      admin.participants.tsx     # Shows QR in admin
      api.qrcode.tsx            # Fallback API endpoint
```

## Benefits

✅ **Email Reliable** - Static file URL always works in emails  
✅ **Fast Loading** - Direct file serving, no generation delay  
✅ **Fallback Ready** - API endpoint for missing/legacy QR codes  
✅ **Persistent** - Images survive server restarts  

## Testing

1. **New Registration**: QR image created in `public/qrcodes/`
2. **Dashboard**: Shows stored image or generates on-demand
3. **Admin Panel**: All QR codes display correctly
4. **Email**: Use `qr_code_image_url` field in templates

## Troubleshooting

### QR codes not generating
- Check directory permissions: `apps/web/public/qrcodes/`
- Verify the directory exists
- Check server logs for file write errors

### Existing users missing QR images
Run the backfill script:
```bash
npx tsx scripts/generate-qr-codes.ts
```
