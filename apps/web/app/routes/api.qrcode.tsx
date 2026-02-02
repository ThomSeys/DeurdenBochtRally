import type { LoaderFunctionArgs } from 'react-router';
import QRCode from 'qrcode';
import { createRequestLogger } from '~/lib/logger.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('api-call', 'QR code generated');
  
  const url = new URL(request.url);
  const text = url.searchParams.get('text');
  const format = url.searchParams.get('format') || 'png';
  
  if (!text) {
    return Response.json({ error: 'Missing text parameter' }, { status: 400 });
  }
  
  try {
    if (format === 'dataURL') {
      const dataURL = await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return Response.json({ dataURL });
    }
    
    // Generate and return PNG image
    const buffer = await QRCode.toBuffer(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return Response.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
