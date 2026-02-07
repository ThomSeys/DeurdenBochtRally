/**
 * Server-side image processing utilities
 * Strips EXIF data and optimizes images before storage
 */

import sharp from 'sharp';

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Process image: strip EXIF data, optimize, and convert to specified format
 * This removes all metadata including GPS coordinates, camera info, timestamps
 * 
 * @param buffer Raw image buffer
 * @param mimeType Original MIME type (e.g., 'image/jpeg')
 * @param options Processing options
 * @returns Promise with processed buffer and metadata
 */
export async function stripEXIFAndOptimize(
  buffer: Buffer,
  mimeType: string,
  options: ProcessImageOptions = {}
): Promise<{ buffer: Buffer; format: string }> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 80,
  } = options;

  try {
    let pipeline = sharp(buffer);

    // Get image metadata to determine orientation
    const metadata = await pipeline.metadata();

    // Determine output format based on input MIME type
    let outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg';
    if (mimeType.includes('png')) {
      outputFormat = 'png';
    } else if (mimeType.includes('webp')) {
      outputFormat = 'webp';
    }

    // Reset pipeline with fresh buffer
    pipeline = sharp(buffer);

    // Rotate if needed (EXIF orientation)
    pipeline = pipeline.rotate();

    // Resize if larger than max dimensions
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // Convert to output format and strip all metadata
    let outputPipeline = pipeline;
    
    if (outputFormat === 'jpeg') {
      outputPipeline = outputPipeline.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });
    } else if (outputFormat === 'png') {
      outputPipeline = outputPipeline.png({
        quality,
        progressive: true,
      });
    } else if (outputFormat === 'webp') {
      outputPipeline = outputPipeline.webp({
        quality,
      });
    }

    // Convert to buffer and strip EXIF completely
    // sharp.rotate() and conversion already removes EXIF, but be explicit
    const processedBuffer = await outputPipeline
      .withMetadata(false) // Explicitly remove all metadata
      .toBuffer();

    return {
      buffer: processedBuffer,
      format: outputFormat,
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate image dimensions are within acceptable range
 */
export function validateImageDimensions(
  width: number,
  height: number,
  maxWidth: number = 8192,
  maxHeight: number = 8192
): { isValid: boolean; error?: string } {
  if (width <= 0 || height <= 0) {
    return { isValid: false, error: 'Invalid image dimensions' };
  }

  if (width > maxWidth || height > maxHeight) {
    return { isValid: false, error: `Image dimensions exceed maximum (${maxWidth}x${maxHeight})` };
  }

  return { isValid: true };
}

/**
 * Get safe image details without exposing EXIF metadata
 */
export async function getImageDetails(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  hasExif: boolean;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      hasExif: !!(metadata.exif || metadata.icc || metadata.iptc),
    };
  } catch (error) {
    throw new Error(`Failed to get image details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
