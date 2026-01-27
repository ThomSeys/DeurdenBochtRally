-- Add password_hash column to participants table
-- This allows password-based authentication instead of QR code login

ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- For existing users without passwords, you can either:
-- 1. Let them reset their password via a password reset flow (recommended)
-- 2. Set a temporary password and force them to change it on first login
-- 3. Generate random passwords and email them

-- Example: Set temporary password for existing users (optional)
-- UPDATE participants 
-- SET password_hash = '$2a$10$...' -- Replace with actual bcrypt hash
-- WHERE password_hash IS NULL;

COMMENT ON COLUMN participants.password_hash IS 'Bcrypt hashed password for authentication';
