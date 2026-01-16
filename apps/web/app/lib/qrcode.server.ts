import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export function generateQRCode(): string {
  return randomBytes(16).toString('hex');
}

export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate QR code and save it as a PNG file in public/qrcodes directory
 * @param text - The text to encode in the QR code
 * @param userId - The user ID to use as the filename
 * @returns The public URL path to the QR code image
 */
export async function generateAndSaveQRCode(text: string, userId: string): Promise<string> {
  // Create qrcodes directory if it doesn't exist
  const publicDir = join(process.cwd(), 'apps', 'web', 'public', 'qrcodes');
  
  if (!existsSync(publicDir)) {
    await mkdir(publicDir, { recursive: true });
  }

  // Generate QR code as buffer
  const qrBuffer = await QRCode.toBuffer(text, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Save to file
  const filename = `${userId}.png`;
  const filepath = join(publicDir, filename);
  await writeFile(filepath, qrBuffer);

  // Return public URL
  return `/qrcodes/${filename}`;
}
