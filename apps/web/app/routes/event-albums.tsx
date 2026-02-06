import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { useState } from 'react';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

interface AlbumPhoto {
  photo_id: string;
  caption: string | null;
  location_lat: number | null;
  location_lng: number | null;
  uploaded_at: string;
  participant_id: string;
  participant_name: string;
  participant_photo: string | null;
  like_count: number;
  image_url: string;
}

interface Album {
  zone_id: string;
  zone_name: string;
  description: string | null;
  is_open: boolean;
  photos: AlbumPhoto[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Get open albums
  const { data: openAlbums, error: albumsError } = await supabaseAdmin
    .from('photo_albums')
    .select('*')
    .eq('is_open', true);

  if (albumsError) {
    console.error('[event-albums] Error fetching albums:', albumsError);
    return { albums: [] };
  }

  // Get validated and correct photo submissions for open albums
  const openZoneIds = openAlbums?.map(a => a.zone_id) || [];
  
  if (openZoneIds.length === 0) {
    return { albums: [] };
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
      albumsMap.get(submission.zone_id)!.photos.push({
        photo_id: submission.id,
        caption: submission.admin_notes,
        location_lat: null,
        location_lng: null,
        uploaded_at: submission.submitted_at ?? "",
        participant_id: submission.participant?.id || '',
        participant_name: `${submission.participant?.first_name || ''} ${submission.participant?.last_name || ''}`.trim(),
        participant_photo: submission.participant?.profile_photo_url,
        like_count: 0,
        image_url: submission.photo_url ?? "",
      });
    }
  }

  const albums = Array.from(albumsMap.values());

  return { albums };
}

export default function EventAlbums() {
  const { albums } = useLoaderData<typeof loader>();
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

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
                        {album.photos.map((photo) => (
                          <button
                            key={photo.photo_id}
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setSelectedAlbum(album);
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
          <div
            className="fixed inset-0 bg-black/90 z-[1100] flex items-center justify-center p-4"
            onClick={() => {
              setSelectedPhoto(null);
              setSelectedAlbum(null);
            }}
          >
            <div
              className="max-w-6xl w-full bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-2">
                {/* Image */}
                <div className="bg-gray-900 flex items-center justify-center p-4">
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.caption || 'Rally foto'}
                    className="max-h-[70vh] object-contain rounded"
                  />
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col">
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setSelectedPhoto(null);
                      setSelectedAlbum(null);
                    }}
                    className="self-end text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ✕
                  </button>

                  {/* Caption */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedPhoto.caption || 'Rally Foto'}
                  </h3>

                  {/* Metadata */}
                  <div className="space-y-4 flex-1">
                    {/* Participant */}
                    <div className="flex items-center gap-3">
                    {selectedPhoto.participant_photo ? (
                      <img
                        src={selectedPhoto.participant_photo}
                          alt={selectedPhoto.participant_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-teal-400"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                          {selectedPhoto.participant_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{selectedPhoto.participant_name}</p>
                        <p className="text-sm text-gray-500">Deelnemer</p>
                      </div>
                    </div>

                    {/* Rally Zone */}
                    <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-3">
                      <p className="text-xs text-teal-600 font-semibold uppercase">Rally Zone</p>
                      <p className="text-lg font-bold text-teal-900">{selectedAlbum.zone_name}</p>
                    </div>

                    {/* Location */}
                    {selectedPhoto.location_lat && selectedPhoto.location_lng && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-semibold uppercase">Locatie</p>
                        <p className="text-sm text-blue-900 font-mono">
                          {selectedPhoto.location_lat.toFixed(6)}, {selectedPhoto.location_lng.toFixed(6)}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${selectedPhoto.location_lat},${selectedPhoto.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold mt-1 inline-block"
                        >
                          <Icon name="marker" /> Bekijk op kaart →
                        </a>
                      </div>
                    )}

                    {/* Likes */}
                    <div className="flex items-center gap-2">
                    <div className="w-4">
                        <Icon name="heart" size={1} className="text-3xl text-red-600" />
                      </div>
                      <span className="text-2xl font-black text-gray-900">
                        {selectedPhoto.like_count}
                      </span>
                      <span className="text-gray-600">likes</span>
                    </div>

                    {/* Date */}
                    <p className="text-sm text-gray-500">
                      Geüpload op {new Date(selectedPhoto.uploaded_at).toLocaleDateString('nl-BE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
