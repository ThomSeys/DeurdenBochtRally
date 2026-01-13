-- Add qr_code_image_url column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS qr_code_image_url TEXT;

-- Update comment
COMMENT ON COLUMN participants.qr_code_image_url IS 'Public URL path to the QR code image file';
