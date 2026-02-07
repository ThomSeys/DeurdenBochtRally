import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData, useRevalidator } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '~/components/Icon';
import { Lightbox } from '~/components/Lightbox';
import { createRequestLogger } from '~/lib/logger.server';
import { compressImage } from '~/lib/image-compression';
import { stripEXIFAndOptimize } from '~/lib/image-exif.server';
import { getCSRFToken, verifyCSRFToken } from '~/lib/csrf.server';
import CSRFInput from '~/components/CSRFInput';

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

  // Get all photos (filtering happens client-side based on user preference)
  const { data: photos, error: photosError } = await supabaseAdmin
    .from('participant_photos')
    .select(`
      *,
      participant:participants(first_name, last_name, motorcycle_brand, motorcycle_model, profile_photo_url),
      photo_tags(participant_id, participant:participants!photo_tags_participant_id_fkey(id, first_name, last_name))
    `);

  if (photosError) {
    const requestLogger = createRequestLogger(request, userId);
    await requestLogger.error('gallery', 'Failed to load photos', photosError as Error);
  }
  
  console.log('[gallery] total photos found:', photos?.length || 0);
  console.log('[gallery] approved photos:', photos?.filter((p: any) => p.is_approved).length || 0);

  // Get user's own photos (including pending)
  const { data: myPhotos } = await supabaseAdmin
    .from('participant_photos')
    .select(`
      *,
      participant:participants(first_name, last_name, profile_photo_url),
      photo_tags(participant_id, participant:participants!photo_tags_participant_id_fkey(id, first_name, last_name))
    `)
    .eq('participant_id', userId);

  // Get user's accepted buddies for tagging - participant_buddies view already contains buddy info
  const { data: allBuddies, error: buddiesError } = await supabaseAdmin
    .from('participant_buddies')
    .select('*')
    .eq('participant_id', userId)
    .eq('status', 'accepted');

  if (buddiesError) {
    const requestLogger = createRequestLogger(request, userId);
    await requestLogger.error('gallery', 'Failed to load buddies for tagging', buddiesError as Error);
  }

  console.log('[gallery] allBuddies from view:', allBuddies);

  // Transform to expected format - the view already has buddy info in buddy_* fields
  const buddiesList = (allBuddies || []).map(b => ({
    buddy_id: b.buddy_id,
    buddy: {
      id: b.buddy_id,
      first_name: b.buddy_first_name,
      last_name: b.buddy_last_name
    }
  }));

  console.log('[gallery] transformed buddiesList:', buddiesList);

  return { 
    userId, 
    participant, 
    photos: photos || [], 
    myPhotos: myPhotos || [],
    buddies: buddiesList,
    csrfToken: await getCSRFToken(request)
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  // Verify CSRF token first
  const isValidToken = await verifyCSRFToken(request);
  if (!isValidToken) {
    await requestLogger.warn('gallery', 'Action failed: invalid CSRF token');
    return { error: 'Invalid form submission. Please try again.', status: 403 };
  }

  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'like') {
    const photoId = formData.get('photo_id') as string;
    
    await requestLogger.info('gallery', 'Photo like action', { photoId });

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
          .select('like_count')
          .eq('id', photoId)
          .single();
        
        await supabaseAdmin
          .from('participant_photos')
          .update({ like_count: Math.max((photo?.like_count || 0) - 1, 0) })
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
          .select('like_count')
          .eq('id', photoId)
          .single();
        
        await supabaseAdmin
          .from('participant_photos')
          .update({ like_count: (photo?.like_count || 0) + 1 })
          .eq('id', photoId);
      }

      console.info('[gallery] like successful');
    }

    return { success: true };
  }

  if (action === 'tag') {
    const photoId = formData.get('photo_id') as string;
    const taggedParticipantId = formData.get('tagged_participant_id') as string;

    // Verify photo ownership
    const { data: photo } = await supabaseAdmin
      .from('participant_photos')
      .select('participant_id')
      .eq('id', photoId)
      .single();

    if (!photo || photo.participant_id !== userId) {
      return { error: 'You can only tag people in your own photos' };
    }

    // Add tag
    const { error: tagError } = await supabaseAdmin.from('photo_tags').insert({
      photo_id: photoId,
      participant_id: taggedParticipantId,
      tagged_by: userId,
    });

    if (tagError) {
      if (tagError.code === '23505') {
        return { error: 'This person is already tagged in this photo' };
      }
      return { error: 'Failed to tag person' };
    }

    // Send push notification to tagged person
    try {
      const { data: tagger } = await supabaseAdmin
        .from('participants')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('participant_id', taggedParticipantId)
        .eq('is_active', true);

      if (subscriptions && subscriptions.length > 0) {
        const { sendPushNotificationWithHistory } = await import('~/lib/push-notifications-enhanced.server');
        
        await sendPushNotificationWithHistory(
          subscriptions,
          {
            title: 'Je bent getagd! 📸',
            body: `${tagger?.first_name} ${tagger?.last_name} heeft je getagd in een foto`,
            tag: 'photo-tag',
          },
          {
            title: 'Je bent getagd! 📸',
            body: `${tagger?.first_name} ${tagger?.last_name} heeft je getagd in een foto`,
            eventType: 'photo_tag',
            targetType: 'targeted',
            sentBy: userId,
            eventData: { photo_id: photoId, tagged_by: userId },
          }
        );
      }
    } catch (notifError) {
      console.error('[gallery] Failed to send tag notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return { success: true, message: 'Person tagged!' };
  }

  if (action === 'untag') {
    const photoId = formData.get('photo_id') as string;
    const taggedParticipantId = formData.get('tagged_participant_id') as string;

    // Verify photo ownership
    const { data: photo } = await supabaseAdmin
      .from('participant_photos')
      .select('participant_id')
      .eq('id', photoId)
      .single();

    if (!photo || photo.participant_id !== userId) {
      return { error: 'You can only remove tags from your own photos' };
    }

    // Remove tag
    const { error: untagError } = await supabaseAdmin
      .from('photo_tags')
      .delete()
      .eq('photo_id', photoId)
      .eq('participant_id', taggedParticipantId);

    if (untagError) {
      return { error: 'Failed to remove tag' };
    }

    return { success: true, message: 'Tag removed!' };
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
        zone_id: location, // location is the zone name/id from the form
        is_approved: false, // Requires admin approval
      });

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabaseAdmin.storage.from('participant-photos').remove([filePath]);
        return { error: dbError.message };
      }

      // Trigger achievement check after photo upload (async, don't block)
      fetch('/api/check-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'check-participant',
          participantId: userId
        })
      }).catch(err => {
        console.error('[gallery] achievement check failed', err);
      });

      return { success: true, message: 'Photo uploaded! Waiting for admin approval.' };
    } catch (err) {
      console.error('Upload error:', err);
      return { error: 'Failed to upload image. Please try again.' };
    }
  }

  return { error: 'Invalid action' };
}

export default function Gallery() {
  const { photos, myPhotos, userId, buddies, csrfToken } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const revalidator = useRevalidator();
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [lightboxLikeCount, setLightboxLikeCount] = useState(0);
  const [lightboxLiked, setLightboxLiked] = useState(false);
  const [lightboxTags, setLightboxTags] = useState<any[]>([]);
  const [lightboxSubmitting, setLightboxSubmitting] = useState(false);
  
  // Touch/swipe state for lightbox
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Revalidate data after actions succeed and update lightbox photo
  useEffect(() => {
    if (actionData?.success) {
      console.info('[gallery] action successful, revalidating data');
      revalidator.revalidate();
    }
  }, [actionData?.success, revalidator]);


  // Filter photos: 'mine' shows user's photos (all statuses), 'all' shows only approved photos
  const displayPhotos = filter === 'mine' 
    ? myPhotos 
    : photos.filter((p: any) => p.is_approved);
  const lightboxIndex = lightboxPhoto
    ? displayPhotos.findIndex((photo: any) => photo.id === lightboxPhoto.id)
    : -1;

  // Update lightbox photo after revalidation to show new tags
  useEffect(() => {
    if (lightboxPhoto && revalidator.state === 'idle') {
      const updatedPhoto = displayPhotos.find((p: any) => p.id === lightboxPhoto.id);
      if (updatedPhoto) {
        setLightboxPhoto(updatedPhoto);
      }
    }
  }, [revalidator.state, displayPhotos]);

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

  // Swipe handlers for lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - next photo
        navigateLightbox('next');
      } else {
        // Swiped right - previous photo
        navigateLightbox('prev');
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

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

  const refreshLightboxSnapshot = async (photoId: string) => {
    const response = await fetch('/api/photo-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'snapshot', photoId }),
    });

    if (!response.ok) return;

    const result = await response.json().catch(() => null);
    if (result?.snapshot) {
      setLightboxLikeCount(result.snapshot.like_count ?? 0);
      setLightboxTags(result.snapshot.tags ?? []);
      setLightboxLiked(Boolean(result.snapshot.liked));
      setLightboxPhoto((prev: any) =>
        prev
          ? {
              ...prev,
              like_count: result.snapshot.like_count ?? prev.like_count,
              photo_tags: result.snapshot.tags ?? prev.photo_tags,
            }
          : prev
      );
    }
  };

  useEffect(() => {
    if (!lightboxPhoto) return;
    setLightboxLikeCount(lightboxPhoto.like_count || 0);
    setLightboxTags(lightboxPhoto.photo_tags || []);
    refreshLightboxSnapshot(lightboxPhoto.id).catch(() => undefined);
  }, [lightboxPhoto?.id]);

  const handleLightboxLike = async () => {
    if (!lightboxPhoto || lightboxSubmitting) return;
    setLightboxSubmitting(true);

    try {
      const response = await fetch('/api/photo-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', photoId: lightboxPhoto.id }),
      });

      if (!response.ok) return;

      const result = await response.json().catch(() => null);
      if (result?.snapshot) {
        setLightboxLikeCount(result.snapshot.like_count ?? lightboxLikeCount);
        setLightboxTags(result.snapshot.tags ?? lightboxTags);
        setLightboxLiked(Boolean(result.snapshot.liked));
        setLightboxPhoto((prev: any) =>
          prev
            ? {
                ...prev,
                like_count: result.snapshot.like_count ?? prev.like_count,
                photo_tags: result.snapshot.tags ?? prev.photo_tags,
              }
            : prev
        );
      } else {
        const nextLiked = !lightboxLiked;
        setLightboxLiked(nextLiked);
        setLightboxLikeCount((prev) => Math.max(prev + (nextLiked ? 1 : -1), 0));
      }
    } finally {
      setLightboxSubmitting(false);
    }
  };

  const handleLightboxTagToggle = async (buddyId: string) => {
    if (!lightboxPhoto || !buddyId || lightboxSubmitting) return;
    setLightboxSubmitting(true);

    const isTagged = lightboxTags.some((tag: any) => tag.participant_id === buddyId);
    const action = isTagged ? 'untag' : 'tag';

    try {
      const response = await fetch('/api/photo-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          photoId: lightboxPhoto.id,
          taggedParticipantId: buddyId,
        }),
      });

      if (!response.ok) return;

      const result = await response.json().catch(() => null);
      if (result?.snapshot) {
        setLightboxLikeCount(result.snapshot.like_count ?? lightboxLikeCount);
        setLightboxTags(result.snapshot.tags ?? lightboxTags);
        if (typeof result.snapshot.liked === 'boolean') {
          setLightboxLiked(result.snapshot.liked);
        }
        setLightboxPhoto((prev: any) =>
          prev
            ? {
                ...prev,
                like_count: result.snapshot.like_count ?? prev.like_count,
                photo_tags: result.snapshot.tags ?? prev.photo_tags,
              }
            : prev
        );
      } else if (isTagged) {
        setLightboxTags((prev) => prev.filter((tag: any) => tag.participant_id !== buddyId));
      } else {
        const buddy = buddies.find((b: any) => b.buddy_id === buddyId);
        if (buddy) {
          setLightboxTags((prev) => [
            ...prev,
            {
              participant_id: buddy.buddy_id,
              participant: { first_name: buddy.buddy?.first_name, last_name: buddy.buddy?.last_name },
            },
          ]);
        }
      }
    } finally {
      setLightboxSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
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
                <CSRFInput token={csrfToken} />
                <input type="hidden" name="action" value="upload" />
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📸 Kies je foto
                  </label>
                  <div className="flex gap-2">
                    {/* Camera Input */}
                    <input
                      type="file"
                      name="image"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      capture="environment"
                      required
                      className="hidden"
                      id="gallery-camera-input"
                      onChange={async (e) => {
                        const originalFile = e.target.files?.[0];
                        if (originalFile && originalFile.size > 5 * 1024 * 1024) {
                          try {
                            const compressedFile = await compressImage(originalFile);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(compressedFile);
                            e.target.files = dataTransfer.files;
                          } catch (error) {
                            console.error('Compression error:', error);
                            alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="gallery-camera-input"
                      className="flex-1 px-4 py-3 border-2 border-blue-600 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="camera" className="w-5 h-5" />
                      Camera
                    </label>

                    {/* Album Input */}
                    <input
                      type="file"
                      name="image"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      required
                      className="hidden"
                      id="gallery-album-input"
                      onChange={async (e) => {
                        const originalFile = e.target.files?.[0];
                        if (originalFile && originalFile.size > 5 * 1024 * 1024) {
                          try {
                            const compressedFile = await compressImage(originalFile);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(compressedFile);
                            e.target.files = dataTransfer.files;
                          } catch (error) {
                            console.error('Compression error:', error);
                            alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="gallery-album-input"
                      className="flex-1 px-4 py-3 border-2 border-primary-600 rounded-xl bg-primary-600 text-white font-semibold cursor-pointer hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="image" className="w-5 h-5" />
                      Album
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <Icon name="info" className="w-4 h-4" />
                    JPG, PNG of WebP - Grote foto's worden automatisch verkleind
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
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 md:mb-12 px-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 sm:px-8 py-3 rounded-full font-semibold transition-all min-h-[44px] ${
              filter === 'all'
                ? 'bg-white text-primary-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <Icon name="users" className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
            Alle Foto's ({photos.length})
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-6 sm:px-8 py-3 rounded-full font-semibold transition-all min-h-[44px] ${
              filter === 'mine'
                ? 'bg-white text-primary-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <Icon name="user" className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
            >
              <Icon name="camera" className="w-5 h-5" />
              Upload Je Eerste Foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                      {photo.photo_tags && photo.photo_tags.length > 0 && (
                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                          {photo.photo_tags.slice(0, 3).map((tag: any) => (
                            <div 
                              key={tag.participant_id}
                              className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"
                            >
                              <Icon name="user" className="w-3 h-3" />
                              {tag.participant?.first_name}
                            </div>
                          ))}
                          {photo.photo_tags.length > 3 && (
                            <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                              +{photo.photo_tags.length - 3}
                            </div>
                          )}
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
                          {photo.like_count}
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
          <Lightbox
            imageSrc={lightboxPhoto.image_url}
            imageAlt={lightboxPhoto.caption || 'Rally foto'}
            onClose={() => setLightboxPhoto(null)}
            onPrev={displayPhotos.length > 1 ? () => navigateLightbox('prev') : undefined}
            onNext={displayPhotos.length > 1 ? () => navigateLightbox('next') : undefined}
            showNav={displayPhotos.length > 1}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            interactions={
              lightboxPhoto
                ? {
                    likeCount: lightboxLikeCount,
                    liked: lightboxLiked,
                    onLike: handleLightboxLike,
                    tags: lightboxTags,
                    tagOptions: lightboxPhoto.participant_id === userId
                      ? buddies.map((buddy: any) => ({
                          id: buddy.buddy_id,
                          first_name: buddy.buddy?.first_name,
                          last_name: buddy.buddy?.last_name,
                        }))
                      : undefined,
                    onToggleTag: lightboxPhoto.participant_id === userId
                      ? handleLightboxTagToggle
                      : undefined,
                    isSubmitting: lightboxSubmitting,
                  }
                : undefined
            }
            footer={
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  {lightboxPhoto.participant?.profile_photo_url ? (
                    <img
                      src={lightboxPhoto.participant.profile_photo_url}
                      alt={lightboxPhoto.participant.first_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                      {(lightboxPhoto.participant?.first_name || 'U').charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{lightboxPhoto.participant?.first_name} {lightboxPhoto.participant?.last_name}</p>
                    <p className="text-sm text-white/70">Deelnemer</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mb-4">
                  {lightboxPhoto.location && (
                    <>
                      <span className="bg-white/10 px-3 py-1 rounded-full">{lightboxPhoto.location}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    Geupload op {lightboxPhoto.uploaded_at && new Date(lightboxPhoto.uploaded_at).toLocaleDateString('nl-BE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {displayPhotos.length > 1 && lightboxIndex >= 0 && (
                    <>
                      <span>•</span>
                      <span className="text-xs">
                        {lightboxIndex + 1} / {displayPhotos.length}
                      </span>
                    </>
                  )}
                </div>

                {lightboxPhoto.caption && (
                  <p className="text-white">{lightboxPhoto.caption}</p>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
