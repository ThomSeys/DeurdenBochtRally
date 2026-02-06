import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useState } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all albums with stats
  const { data: albums, error } = await supabaseAdmin.rpc('get_album_stats');

  if (error) {
    console.error('[admin.photo-albums] Error fetching albums:', error);
    console.error('[admin.photo-albums] This likely means the SQL migration has not been run yet.');
    console.error('[admin.photo-albums] Please run scripts/add-photo-albums.sql in Supabase SQL Editor');
    throw new Response('Could not load albums - run SQL migration first', { status: 500 });
  }

  console.log('[admin.photo-albums] Albums loaded:', albums);

  // Get all photo submissions grouped by zone
  const { data: allPhotos } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select(`
      *,
      participant:participants(first_name, last_name, email)
    `)
    .eq('challenge_type', 'photo')
    .not('photo_url', 'is', null)
    .order('submitted_at', { ascending: false });

  console.log('[admin.photo-albums] Total photo submissions found:', allPhotos?.length || 0);

  // Group photos by zone_id
  const photosByZone: Record<string, any[]> = {};
  allPhotos?.forEach((photo) => {
    if (photo.zone_id) {
      if (!photosByZone[photo.zone_id]) {
        photosByZone[photo.zone_id] = [];
      }
      photosByZone[photo.zone_id].push(photo);
    }
  });

  console.log('[admin.photo-albums] Photos by zone:', Object.keys(photosByZone).map(z => `${z}: ${photosByZone[z].length}`));

  // Update album stats with actual photo counts from route_challenge_submissions
  const albumsWithStats = (albums || []).map((album: any) => {
    const zonePhotos = photosByZone[album.zone_id] || [];
    return {
      ...album,
      total_photos: zonePhotos.length,
      approved_photos: zonePhotos.filter(p => p.is_validated && p.is_correct).length,
      pending_photos: zonePhotos.filter(p => !p.is_validated).length,
    };
  });

  return { albums: albumsWithStats, photosByZone };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const zoneId = formData.get('zoneId') as string;
  const isOpen = formData.get('isOpen') === 'true';

  if (!zoneId) {
    return { error: 'Zone ID is required', status: 400 };
  }

  // Toggle album status
  const { error } = await supabaseAdmin
    .from('photo_albums')
    .update({ is_open: isOpen })
    .eq('zone_id', zoneId);

  if (error) {
    console.error('[admin.photo-albums] Error updating album:', error);
    return { error: 'Could not update album', status: 500 };
  }

  return { success: true, message: `Album ${isOpen ? 'geopend' : 'gesloten'}` };
}

export default function AdminPhotoAlbums() {
  const { albums, photosByZone } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedZone, setSelectedZone] = useState<{ zone_id: string; zone_name: string } | null>(null);

  const openPhotoModal = (zoneId: string, zoneName: string) => {
    setSelectedZone({ zone_id: zoneId, zone_name: zoneName });
  };

  const closeModal = () => {
    setSelectedZone(null);
  };

  const currentZonePhotos = selectedZone ? (photosByZone[selectedZone.zone_id] || []) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Header />

      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-600 to-indigo-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="folder" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Event Albums Beheer</h1>
          <p className="text-xl text-primary-100">Toggle foto albums per rally zone</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Success/Error Messages */}
        {actionData?.error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md">
            <div className="flex items-center">
              <Icon name="alert-triangle" className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-900 font-semibold">{actionData.error}</p>
            </div>
          </div>
        )}
        {actionData?.success && (
          <div className="mb-6 bg-teal-50 border-l-4 border-teal-500 rounded-lg p-4 shadow-md">
            <div className="flex items-center">
              <Icon name="check-circle" className="w-5 h-5 text-teal-600 mr-3" />
              <p className="text-teal-900 font-semibold">{actionData.message}</p>
            </div>
          </div>
        )}

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
            <Icon name="alert-triangle" className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Geen albums gevonden</h3>
            <p className="text-gray-600 mb-4">
              De photo_albums tabel bestaat mogelijk nog niet in de database.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <p className="font-semibold text-blue-900 mb-2">🔧 Oplossing:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open Supabase Dashboard → SQL Editor</li>
                <li>Plak de inhoud van <code className="bg-blue-100 px-1 rounded">scripts/add-photo-albums.sql</code></li>
                <li>Run de SQL migratie</li>
                <li>Refresh deze pagina</li>
              </ol>
            </div>
          </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {albums.map((album) => (
            <div
              key={album.zone_id}
              className={`bg-white rounded-lg p-6 shadow-lg transition-all ${
                album.is_open 
                  ? 'border-2 border-teal-500 ring-2 ring-teal-200' 
                  : 'border border-gray-200'
              }`}
            >
              {/* Album Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {album.zone_name}
                    {album.is_open && (
                      <span className="text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded font-semibold">
                        OPEN
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">ID: {album.zone_id}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div>
                  <p className="text-2xl font-black text-teal-600">{album.approved_photos}</p>
                  <p className="text-xs text-gray-600 uppercase">Correct</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-orange-600">{album.pending_photos}</p>
                  <p className="text-xs text-gray-600 uppercase">Wachtend</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-600">{album.total_photos}</p>
                  <p className="text-xs text-gray-600 uppercase">Totaal</p>
                </div>
              </div>

              {/* Toggle Form */}
              <Form method="post" className="flex gap-3">
                <input type="hidden" name="zoneId" value={album.zone_id} />
                <input type="hidden" name="isOpen" value={album.is_open ? 'false' : 'true'} />
                
                <button
                  type="submit"
                  className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg ${
                    album.is_open
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                      : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white'
                  }`}
                >
                  {album.is_open ? '🔒 Album Sluiten' : '✅ Album Openen'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openPhotoModal(album.zone_id, album.zone_name);
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-center"
                >
                  📷 Foto's ({photosByZone[album.zone_id]?.length || 0})
                </button>
              </Form>
            </div>
          ))}
        </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Hoe werkt het?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Alleen <strong>gevalideerde en correcte foto's</strong> worden getoond in open albums</li>
            <li>• Deelnemers zien alleen albums die <strong>open</strong> staan</li>
            <li>• Foto's komen uit challenge submissions met type "photo"</li>
            <li>• Je kunt albums op elk moment aan- of uitzetten</li>
          </ul>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedZone && (
        <div
          className="fixed inset-0 bg-black/80 z-[1100] flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedZone.zone_name}</h2>
                <p className="text-primary-100 text-sm mt-1">
                  {currentZonePhotos.length} foto's • {currentZonePhotos.filter(p => p.is_validated).length} gevalideerd
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:text-primary-100 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {currentZonePhotos.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="image" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900">Geen foto's gevonden</p>
                  <p className="text-gray-600 mt-2">
                    Er zijn nog geen foto's geüpload voor deze rally zone.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {currentZonePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`relative aspect-square rounded-lg overflow-hidden shadow-md ${
                        photo.is_validated
                          ? photo.is_correct
                            ? 'ring-2 ring-teal-400'
                            : 'ring-2 ring-red-400'
                          : 'ring-2 ring-orange-400'
                      }`}
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.admin_notes || ''}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                        photo.is_validated
                          ? photo.is_correct
                            ? 'bg-teal-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-orange-500 text-white'
                      }`}>
                        {photo.is_validated ? (photo.is_correct ? '✓ OK' : '✗ Fout') : '⏳ Wacht'}
                      </div>

                      {/* Participant */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-semibold truncate">
                          {photo.participant?.first_name} {photo.participant?.last_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
