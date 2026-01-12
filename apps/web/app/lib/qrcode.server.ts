import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

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
