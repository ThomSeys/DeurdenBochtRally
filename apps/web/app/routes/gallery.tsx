import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData, useRevalidator } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { useState, useEffect } from 'react';
import { Icon } from '~/components/Icon';

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
    
    console.info('[gallery] like action start', { photoId, userId });

    // Toggle like
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('participant_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[gallery] error checking existing like', checkError);
      return { error: 'Error checking like status' };
    }

    if (existing) {
      // Unlike
      console.info('[gallery] unliking photo', { photoId });
      const { error: deleteError } = await supabaseAdmin
        .from('photo_likes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('[gallery] error deleting like', deleteError);
        return { error: 'Error removing like' };
      }

      // Decrement like count - try RPC first, fall back to direct update
      const { error: rpcError } = await supabaseAdmin.rpc('decrement_photo_likes', { photo_id: photoId });
      if (rpcError) {
        console.warn('[gallery] RPC decrement failed, using direct update', rpcError);
        const { data: photo } = await supabaseAdmin
          .from('participant_photos')
          .select('likes_count')
          .eq('id', photoId)
          .single();
        
        await supabaseAdmin
          .from('participant_photos')
          .update({ likes_count: Math.max((photo?.likes_count || 0) - 1, 0) })
          .eq('id', photoId);
      }

      console.info('[gallery] unlike successful');
    } else {
      // Like
      console.info('[gallery] liking photo', { photoId });
      const { error: insertError } = await supabaseAdmin.from('photo_likes').insert({
        photo_id: photoId,
        participant_id: userId,
      });

      if (insertError) {
        console.error('[gallery] error inserting like', insertError);
        return { error: 'Error adding like' };
      }

      // Increment like count - try RPC first, fall back to direct update
      const { error: rpcError } = await supabaseAdmin.rpc('increment_photo_likes', { photo_id: photoId });
      if (rpcError) {
        console.warn('[gallery] RPC increment failed, using direct update', rpcError);
        const { data: photo } = await supabaseAdmin
          .from('participant_photos')
          .select('likes_count')
          .eq('id', photoId)
          .single();
        
        await supabaseAdmin
          .from('participant_photos')
          .update({ likes_count: (photo?.likes_count || 0) + 1 })
          .eq('id', photoId);
      }

      console.info('[gallery] like successful');
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
  const revalidator = useRevalidator();
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  // Revalidate data after like action succeeds
  useEffect(() => {
    if (actionData?.success) {
      console.info('[gallery] like successful, revalidating data');
      revalidator.revalidate();
    }
  }, [actionData?.success, revalidator]);

  const displayPhotos = filter === 'mine' ? myPhotos : photos;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxPhoto(null);
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox('prev');
      } else if (e.key === 'ArrowRight') {
        navigateLightbox('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, displayPhotos]);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!lightboxPhoto) return;
    
    const currentIndex = displayPhotos.findIndex((p: any) => p.id === lightboxPhoto.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % displayPhotos.length;
    } else {
      newIndex = currentIndex - 1 < 0 ? displayPhotos.length - 1 : currentIndex - 1;
    }

    setLightboxPhoto(displayPhotos[newIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="camera" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rally Fotoalbum</h1>
          <p className="text-xl text-primary-100 mb-8">Onze mooiste momenten op de baan</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Icon name={showUpload ? "x" : "camera"} className="w-5 h-5" />
              {showUpload ? 'Sluiten' : 'Upload Foto'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {actionData?.message && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-r-lg shadow-md flex items-center gap-3">
            <Icon name="check-circle" className="w-6 h-6" />
            <span>{actionData.message}</span>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg shadow-md flex items-center gap-3">
            <Icon name="alert-triangle" className="w-6 h-6" />
            <span>{actionData.error}</span>
          </div>
        )}

        {/* Upload Form */}
        {showUpload && (
          <div className="mb-12 transform transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-primary-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Icon name="camera" className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Deel Je Rallyfoto</h2>
              </div>
              <Form method="post" encType="multipart/form-data" className="space-y-6">
                <input type="hidden" name="action" value="upload" />
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📸 Kies je foto
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  />
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <Icon name="info" className="w-4 h-4" />
                    JPG, PNG of WebP - Max 5MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    ✍️ Vertel je verhaal
                  </label>
                  <textarea
                    name="caption"
                    rows={3}
                    placeholder="Wat maakte dit moment speciaal?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📍 Waar was je?
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Locatie of zone nummer"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Icon name="upload" className="w-5 h-5" />
                  Upload Mijn Foto
                </button>

                <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <Icon name="info" className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                  <span>Je foto wordt na goedkeuring door een admin zichtbaar voor iedereen in het album.</span>
                </p>
              </Form>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setFilter('all')}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-primary-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <Icon name="users" className="w-5 h-5 inline mr-2" />
            Alle Foto's ({photos.length})
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              filter === 'mine'
                ? 'bg-white text-primary-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <Icon name="user" className="w-5 h-5 inline mr-2" />
            Mijn Foto's ({myPhotos.length})
          </button>
        </div>

        {/* Photo Gallery - Polaroid Masonry Style */}
        {displayPhotos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Icon name="camera" className="w-16 h-16 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nog geen foto's</h3>
            <p className="text-gray-600 mb-6">Wees de eerste om een moment te delen!</p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
            >
              <Icon name="camera" className="w-5 h-5" />
              Upload Je Eerste Foto
            </button>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {displayPhotos.map((photo: any) => {
              return (
                <div
                  key={photo.id}
                  className="break-inside-avoid group"
                >
                  {/* Polaroid Card */}
                  <div className="bg-white p-4 pb-16 rounded-sm shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer relative">
                    {/* Tape effect */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-8 bg-amber-100/70 rounded-sm shadow-sm" style={{ transform: 'rotate(-2deg)' }}></div>
                    
                    {/* Photo */}
                    <div
                      onClick={() => setLightboxPhoto(photo)}
                      className="relative overflow-hidden rounded-sm bg-gray-100 mb-4 aspect-square"
                    >
                      <img 
                        src={photo.image_url} 
                        alt={photo.caption || 'Rally foto'}
                        className="w-full h-full object-cover"
                      />
                      {!photo.is_approved && filter === 'mine' && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          ⏳ Wacht op goedkeuring
                        </div>
                      )}
                    </div>

                    {/* Caption Area - Handwritten Style */}
                    <div className="space-y-2">
                      {photo.caption && (
                        <p className="text-gray-800 font-medium text-sm leading-relaxed bold">
                          {photo.caption}
                        </p>
                      )}
                      {photo.location && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Icon name="marker" className="w-3 h-3" />
                          {photo.location}
                        </p>
                      )}
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {photo.participant?.first_name} {photo.participant?.last_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(photo.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Like Button - Bottom Corner */}
                    <div className="absolute bottom-4 right-4">
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="like" />
                        <input type="hidden" name="photo_id" value={photo.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg transition-all transform hover:scale-110"
                        >
                          <Icon name="heart" className="w-4 h-4" />
                          {photo.likes_count}
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lightbox */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-[1200] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setLightboxPhoto(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>

            {/* Previous button */}
            {displayPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('prev');
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <Icon name="chevron-left" className="w-6 h-6" />
              </button>
            )}

            {/* Next button */}
            {displayPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('next');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <Icon name="chevron-right" className="w-6 h-6" />
              </button>
            )}

            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxPhoto.image_url}
                alt={lightboxPhoto.caption}
                className="max-h-[70vh] max-w-[80vw] h-auto w-auto mx-auto rounded-lg shadow-2xl object-contain"
              />
              {lightboxPhoto.caption && (
                <div className="mt-6 bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <p className="text-white text-lg mb-2">{lightboxPhoto.caption}</p>
                  <div className="flex items-center justify-between text-white/70 text-sm">
                    <span>{lightboxPhoto.participant?.first_name} {lightboxPhoto.participant?.last_name}</span>
                    <div className="flex items-center gap-4">
                      {lightboxPhoto.location && (
                        <span className="flex items-center gap-1">
                          <Icon name="marker" className="w-4 h-4" />
                          {lightboxPhoto.location}
                        </span>
                      )}
                      {displayPhotos.length > 1 && (
                        <span className="text-xs">
                          {displayPhotos.findIndex((p: any) => p.id === lightboxPhoto.id) + 1} / {displayPhotos.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
