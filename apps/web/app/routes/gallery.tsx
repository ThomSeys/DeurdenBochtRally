import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { useState } from 'react';

export const meta: MetaFunction = () => {
  return [{ title: 'Fotogalerij - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Get participant info
  const { data: participant } = await supabase
    .from('participants')
    .select('id, first_name, last_name')
    .eq('id', userId)
    .single();

  // Get approved photos
  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select(`
      *,
      participant:participants(first_name, last_name, motorcycle_brand, motorcycle_model)
    `)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  // Get user's own photos (including pending)
  const { data: myPhotos } = await supabaseAdmin
    .from('participant_photos')
    .select('*')
    .eq('participant_id', userId)
    .order('created_at', { ascending: false });

  return { userId, participant, photos: photos || [], myPhotos: myPhotos || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'like') {
    const photoId = formData.get('photo_id') as string;
    
    // Toggle like
    const { data: existing } = await supabaseAdmin
      .from('photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('participant_id', userId)
      .single();

    if (existing) {
      // Unlike
      await supabaseAdmin.from('photo_likes').delete().eq('id', existing.id);
      await supabaseAdmin.rpc('decrement_photo_likes', { photo_id: photoId });
    } else {
      // Like
      await supabaseAdmin.from('photo_likes').insert({
        photo_id: photoId,
        participant_id: userId,
      });
      await supabaseAdmin.rpc('increment_photo_likes', { photo_id: photoId });
    }

    return { success: true };
  }

  if (action === 'upload') {
    const file = formData.get('image') as File;
    const caption = formData.get('caption') as string;
    const location = formData.get('location') as string;

    if (!file || file.size === 0) {
      return { error: 'Image file is required' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Only JPG, PNG, and WebP images are allowed' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { error: 'Image must be smaller than 5MB' };
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${timestamp}.${fileExt}`;
      const filePath = `rally-photos/${fileName}`;

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('participant-photos')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          return { error: 'Storage bucket not configured. Please contact admin to set up photo storage.' };
        }
        return { error: `Upload failed: ${uploadError.message}` };
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('participant-photos')
        .getPublicUrl(filePath);

      // Insert record into database
      const { error: dbError } = await supabaseAdmin.from('participant_photos').insert({
        participant_id: userId,
        image_url: urlData.publicUrl,
        caption,
        location,
        is_approved: false, // Requires admin approval
      });

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabaseAdmin.storage.from('participant-photos').remove([filePath]);
        return { error: dbError.message };
      }

      return { success: true, message: 'Photo uploaded! Waiting for admin approval.' };
    } catch (err) {
      console.error('Upload error:', err);
      return { error: 'Failed to upload image. Please try again.' };
    }
  }

  return { error: 'Invalid action' };
}

export default function Gallery() {
  const { photos, myPhotos, userId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📸 Fotogalerij</h1>
            <p className="text-gray-600 mt-2">Deel jouw rally momenten!</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-medium transition-colors"
          >
            {showUpload ? '✕ Sluiten' : '+ Upload Foto'}
          </button>
        </div>

        {actionData?.message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {/* Upload Form */}
        {showUpload && (
          <div className="bg-white rounded-sm shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Foto</h2>
            <Form method="post" encType="multipart/form-data" className="space-y-4">
              <input type="hidden" name="action" value="upload" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecteer Foto
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-sm text-gray-500 mt-1">JPG, PNG of WebP - Max 5MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  name="caption"
                  rows={3}
                  placeholder="Beschrijf je foto..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locatie
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="Waar was dit?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                Upload Foto
              </button>

              <p className="text-sm text-gray-600">
                ℹ️ Je foto wordt na goedkeuring door een admin zichtbaar voor iedereen.
              </p>
            </Form>
          </div>
        )}

        {/* My Photos */}
        {myPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mijn Foto's</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPhotos.map((photo: any) => (
                <div key={photo.id} className="bg-white rounded-sm shadow overflow-hidden">
                  <img 
                    src={photo.image_url} 
                    alt={photo.caption || 'Rally foto'}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    {photo.caption && <p className="text-gray-900 mb-2">{photo.caption}</p>}
                    {photo.location && <p className="text-sm text-gray-600">📍 {photo.location}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-sm px-2 py-1 rounded ${photo.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {photo.is_approved ? '✓ Goedgekeurd' : '⏳ In behandeling'}
                      </span>
                      <span className="text-sm text-gray-600">❤️ {photo.likes_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Approved Photos */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Alle Foto's</h2>
        {photos.length === 0 ? (
          <div className="bg-white rounded-sm shadow p-12 text-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-gray-600">Nog geen foto's geupload. Wees de eerste!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo: any) => (
              <div key={photo.id} className="bg-white rounded-sm shadow overflow-hidden">
                <img 
                  src={photo.image_url} 
                  alt={photo.caption || 'Rally foto'}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {photo.participant?.first_name} {photo.participant?.last_name}
                    </div>
                  </div>
                  {photo.caption && <p className="text-gray-700 mb-2">{photo.caption}</p>}
                  {photo.location && <p className="text-sm text-gray-600 mb-2">📍 {photo.location}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <Form method="post" className="inline">
                      <input type="hidden" name="action" value="like" />
                      <input type="hidden" name="photo_id" value={photo.id} />
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-600 font-medium"
                      >
                        ❤️ {photo.likes_count}
                      </button>
                    </Form>
                    <span className="text-sm text-gray-500">
                      {new Date(photo.created_at).toLocaleDateString('nl-BE')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
