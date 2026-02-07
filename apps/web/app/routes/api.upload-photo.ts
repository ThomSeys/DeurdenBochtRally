import type { ActionFunctionArgs } from 'react-router';
import { getUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { stripEXIFAndOptimize } from '~/lib/image-exif.server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get participant
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('id', userId)
      .single();

    if (!participant) {
      return Response.json({ error: 'Participant not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'challenge';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${participant.id}/${type}_${timestamp}_${random}.${extension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Strip EXIF data and optimize image
    try {
      const { buffer: processedBuffer } = await stripEXIFAndOptimize(buffer, file.type, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 80,
      });
      buffer = processedBuffer;
    } catch (error) {
      console.error('EXIF stripping failed, continuing with original:', error);
      // Continue with original buffer if processing fails
    }

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('participant-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Photo upload failed:', error);
      return Response.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('participant-photos')
      .getPublicUrl(filename);

    return Response.json({
      success: true,
      url: urlData.publicUrl,
      filename: data.path,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
