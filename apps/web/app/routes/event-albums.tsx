import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { useEffect, useState } from 'react';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { Lightbox } from '~/components/Lightbox';
import { requireUserId } from '~/lib/session.server';

interface AlbumPhoto {
  photo_id: string | null;
  caption: string | null;
  location_lat: number | null;
  location_lng: number | null;
  uploaded_at: string;
  participant_id: string;
  participant_name: string;
  participant_photo: string | null;
  like_count: number;
  image_url: string;
  photo_tags?: Array<{ participant_id: string; participant?: { first_name: string; last_name: string } }>;
}

interface Album {
  zone_id: string;
  zone_name: string;
  description: string | null;
  is_open: boolean;
  photos: AlbumPhoto[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Get open albums
  const { data: openAlbums, error: albumsError } = await supabaseAdmin
    .from('photo_albums')
    .select('*')
    .eq('is_open', true);

  if (albumsError) {
    console.error('[event-albums] Error fetching albums:', albumsError);
    return { albums: [], userId, likedPhotoIds: [], buddies: [] };
  }

  // Get validated and correct photo submissions for open albums
  const openZoneIds = openAlbums?.map(a => a.zone_id) || [];
  
  if (openZoneIds.length === 0) {
    return { albums: [], userId, likedPhotoIds: [], buddies: [] };
  }

  const { data: photoSubmissions, error: photosError } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select(`
      *,
      participant:participants(id, first_name, last_name, profile_photo_url)
    `)
    .eq('challenge_type', 'photo')
    .eq('is_validated', true)
    .eq('is_correct', true)
    .not('photo_url', 'is', null)
    .in('zone_id', openZoneIds)
    .order('submitted_at', { ascending: false });

  if (photosError) {
    console.error('[event-albums] Error fetching photos:', photosError);
  }

  console.log('[event-albums] Photo submissions found:', photoSubmissions?.length || 0);

  const submissionIds = (photoSubmissions || []).map((submission) => submission.id).filter(Boolean);
  const { data: challengePhotos, error: challengePhotosError } = submissionIds.length > 0
    ? await supabaseAdmin
        .from('participant_photos')
        .select(
          'id, challenge_submission_id, like_count, photo_tags(participant_id, participant:participants!photo_tags_participant_id_fkey(id, first_name, last_name))'
        )
        .in('challenge_submission_id', submissionIds)
    : { data: [] };

  if (challengePhotosError) {
    console.error('[event-albums] Error fetching challenge photos:', challengePhotosError);
  }

  const photosBySubmissionId: Record<string, any> = {};
  (challengePhotos || []).forEach((photo: any) => {
    if (photo.challenge_submission_id) {
      photosBySubmissionId[photo.challenge_submission_id] = photo;
    }
  });

  // Group photos by zone
  const albumsMap = new Map<string, Album>();
  
  // Initialize albums
  for (const album of openAlbums || []) {
    albumsMap.set(album.zone_id, {
      zone_id: album.zone_id,
      zone_name: album.zone_name,
      description: album.description,
      is_open: !!album.is_open,
      photos: [],
    });
  }

  // Add photos to albums
  for (const submission of photoSubmissions || []) {
    if (submission.zone_id && albumsMap.has(submission.zone_id)) {
      const photoData = photosBySubmissionId[submission.id];
      albumsMap.get(submission.zone_id)!.photos.push({
        photo_id: photoData?.id || null,
        caption: submission.admin_notes,
        location_lat: null,
        location_lng: null,
        uploaded_at: submission.submitted_at ?? "",
        participant_id: submission.participant?.id || '',
        participant_name: `${submission.participant?.first_name || ''} ${submission.participant?.last_name || ''}`.trim(),
        participant_photo: submission.participant?.profile_photo_url,
        like_count: photoData?.like_count || 0,
        photo_tags: photoData?.photo_tags || [],
        image_url: submission.photo_url ?? "",
      });
    }
  }

  const albums = Array.from(albumsMap.values());

  const photoIds = (challengePhotos || []).map((photo: any) => photo.id).filter(Boolean);
  const { data: likedPhotos } = userId && photoIds.length > 0
    ? await supabaseAdmin
        .from('photo_likes')
        .select('photo_id')
        .eq('participant_id', userId)
        .in('photo_id', photoIds)
    : { data: [] };

  const likedPhotoIds = (likedPhotos || []).map((like: any) => like.photo_id);

  const { data: allBuddies } = userId
    ? await supabaseAdmin
        .from('participant_buddies')
        .select('*')
        .eq('participant_id', userId)
        .eq('status', 'accepted')
    : { data: [] };

  const buddiesList = (allBuddies || []).map((buddy: any) => ({
    buddy_id: buddy.buddy_id,
    buddy: {
      first_name: buddy.buddy_first_name,
      last_name: buddy.buddy_last_name,
    },
  }));

  return { albums, userId, likedPhotoIds, buddies: buddiesList };
}

export default function EventAlbums() {
  const { albums, userId, likedPhotoIds, buddies } = useLoaderData<typeof loader>();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [tags, setTags] = useState<Array<any>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPhoto = selectedAlbum?.photos[selectedIndex] || null;

  useEffect(() => {
    if (!selectedPhoto?.photo_id) {
      setLikeCount(0);
      setLiked(false);
      setTags([]);
      return;
    }
    setLikeCount(selectedPhoto.like_count || 0);
    setLiked(likedPhotoIds.includes(selectedPhoto.photo_id));
    setTags(selectedPhoto.photo_tags || []);
  }, [selectedPhoto?.photo_id, selectedIndex, selectedAlbum, likedPhotoIds]);

  const handleClose = () => {
    setSelectedAlbum(null);
    setSelectedIndex(0);
  };

  const handlePrev = () => {
    if (!selectedAlbum) return;
    setSelectedIndex((prev) => (prev - 1 + selectedAlbum.photos.length) % selectedAlbum.photos.length);
  };

  const handleNext = () => {
    if (!selectedAlbum) return;
    setSelectedIndex((prev) => (prev + 1) % selectedAlbum.photos.length);
  };

  const handleLike = async () => {
    if (!userId || !selectedPhoto?.photo_id || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/photo-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', photoId: selectedPhoto.photo_id }),
      });

      if (!response.ok) return;

      const result = await response.json().catch(() => null);
      if (result?.snapshot) {
        setLikeCount(result.snapshot.like_count ?? likeCount);
        setTags(result.snapshot.tags ?? tags);
        setLiked(Boolean(result.snapshot.liked));
        setSelectedAlbum((prev) => {
          if (!prev || !selectedPhoto) return prev;
          return {
            ...prev,
            photos: prev.photos.map((photo, index) =>
              index === selectedIndex
                ? {
                    ...photo,
                    like_count: result.snapshot.like_count ?? photo.like_count,
                    photo_tags: result.snapshot.tags ?? photo.photo_tags,
                  }
                : photo
            ),
          };
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = async (buddyId: string) => {
    if (!userId || !selectedPhoto?.photo_id || !buddyId || isSubmitting) return;
    setIsSubmitting(true);

    const isTagged = tags.some((tag) => tag.participant_id === buddyId);
    const action = isTagged ? 'untag' : 'tag';

    try {
      const response = await fetch('/api/photo-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          photoId: selectedPhoto.photo_id,
          taggedParticipantId: buddyId,
        }),
      });

      if (!response.ok) return;

      const result = await response.json().catch(() => null);
      if (result?.snapshot) {
        setLikeCount(result.snapshot.like_count ?? likeCount);
        setTags(result.snapshot.tags ?? tags);
        if (typeof result.snapshot.liked === 'boolean') {
          setLiked(result.snapshot.liked);
        }
        setSelectedAlbum((prev) => {
          if (!prev || !selectedPhoto) return prev;
          return {
            ...prev,
            photos: prev.photos.map((photo, index) =>
              index === selectedIndex
                ? {
                    ...photo,
                    like_count: result.snapshot.like_count ?? photo.like_count,
                    photo_tags: result.snapshot.tags ?? photo.photo_tags,
                  }
                : photo
            ),
          };
        });
      } else if (isTagged) {
        setTags((prev) => prev.filter((tag) => tag.participant_id !== buddyId));
      } else {
        const buddy = buddies.find((b: any) => b.buddy_id === buddyId);
        if (buddy) {
          setTags((prev) => [
            ...prev,
            {
              participant_id: buddy.buddy_id,
              participant: { first_name: buddy.buddy?.first_name, last_name: buddy.buddy?.last_name },
            },
          ]);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
              <Icon name="folder" className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Event Albums</h1>
            <p className="text-xl text-primary-100">
              Bekijk officiële foto's per rally zone
            </p>
          </div>
        </div>

        {/* Albums */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {albums.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-lg">
              <Icon name="folder" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-2xl font-bold text-gray-900">Nog geen albums beschikbaar</p>
              <p className="text-gray-600 mt-2">De admin heeft nog geen event albums geopend.</p>
              <p className="text-sm text-gray-500 mt-4">
                Check later terug voor officiële foto's van het event per rally zone!
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {albums.map((album) => (
              <div key={album.zone_id} className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 transition-all hover:shadow-2xl">
                {/* Album Header */}
                <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 px-6 py-6">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                      {album.zone_name}
                    </h2>
                    {album.description && (
                    <p className="text-primary-100 mt-2">{album.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Icon name="camera" className="w-4 h-4 text-white/80" />
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {album.photos.length} foto's
                      </span>
                    </div>
                  </div>

                  {/* Photos Grid */}
                  {album.photos.length > 0 ? (
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {album.photos.map((photo, index) => (
                          <button
                            key={photo.photo_id || photo.image_url}
                            onClick={() => {
                              setSelectedAlbum(album);
                              setSelectedIndex(index);
                            }}
                            className="relative aspect-square overflow-hidden rounded-lg bg-gray-200 hover:scale-105 transition-transform shadow-md hover:shadow-xl"
                          >
                            <img
                              src={photo.image_url}
                              alt={photo.caption || 'Rally foto'}
                              className="w-full h-full object-cover"
                            />

                            {/* Like Count */}
                            {photo.like_count > 0 && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold flex gap-2">
                                <div className="w-5"><Icon name="heart" /> </div>{photo.like_count}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-500">
                      <Icon name="image" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-lg font-semibold">Nog geen foto's in dit album</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo Modal */}
        {selectedPhoto && selectedAlbum && (
          <Lightbox
            imageSrc={selectedPhoto.image_url}
            imageAlt={selectedPhoto.caption || 'Rally foto'}
            onClose={handleClose}
            onPrev={selectedAlbum.photos.length > 1 ? handlePrev : undefined}
            onNext={selectedAlbum.photos.length > 1 ? handleNext : undefined}
            showNav={selectedAlbum.photos.length > 1}
            interactions={
              selectedPhoto.photo_id
                ? {
                    likeCount,
                    liked,
                    onLike: handleLike,
                    tags,
                    tagOptions: userId
                      ? buddies.map((buddy: any) => ({
                          id: buddy.buddy_id,
                          first_name: buddy.buddy?.first_name,
                          last_name: buddy.buddy?.last_name,
                        }))
                      : undefined,
                    onToggleTag: userId ? handleTagToggle : undefined,
                    isSubmitting,
                  }
                : undefined
            }
            footer={
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  {selectedPhoto.participant_photo ? (
                    <img
                      src={selectedPhoto.participant_photo}
                      alt={selectedPhoto.participant_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                      {selectedPhoto.participant_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{selectedPhoto.participant_name}</p>
                    <p className="text-sm text-white/70">Deelnemer</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="bg-white/10 px-3 py-1 rounded-full">{selectedAlbum.zone_name}</span>
                  <span>•</span>
                  <span>
                    Geupload op {new Date(selectedPhoto.uploaded_at).toLocaleDateString('nl-BE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {selectedPhoto.caption && (
                  <p className="mt-4 text-white">{selectedPhoto.caption}</p>
                )}

                {selectedPhoto.location_lat && selectedPhoto.location_lng && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedPhoto.location_lat},${selectedPhoto.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200 hover:text-blue-100 text-sm font-semibold mt-3 inline-block"
                  >
                    <Icon name="marker" /> Bekijk op kaart →
                  </a>
                )}
              </div>
            }
          />
        )}
      </div>
    </>
  );
}
