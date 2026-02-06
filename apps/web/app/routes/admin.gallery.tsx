import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, Link, useActionData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useState, useEffect } from 'react';
import { useToast } from '~/contexts/ToastContext';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [{ title: 'Foto Beheer - Admin - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all photos (pending and approved)
  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select(`
      *,
      participant:participants(first_name, last_name, email)
    `)
    .order('uploaded_at', { ascending: false });

  const pendingCount = photos?.filter(p => !p.is_approved).length || 0;

  return { photos: photos || [], pendingCount };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  const formData = await request.formData();
  const action = formData.get('action');
  const photoId = formData.get('photo_id') as string;

  if (action === 'approve') {
    await supabaseAdmin
      .from('participant_photos')
      .update({ is_approved: true })
      .eq('id', photoId);

    return { success: true, message: 'Foto goedgekeurd!' };
  }

  if (action === 'reject' || action === 'delete') {
    await supabaseAdmin
      .from('participant_photos')
      .delete()
      .eq('id', photoId);

    return { success: true, message: 'Foto verwijderd!' };
  }

  if (action === 'feature') {
    const isFeatured = formData.get('is_featured') === 'true';
    await supabaseAdmin
      .from('participant_photos')
      .update({ is_featured: !isFeatured })
      .eq('id', photoId);

    return { success: true, message: isFeatured ? 'Niet meer uitgelicht' : 'Foto uitgelicht!' };
  }

  return { error: 'Invalid action' };
}

export default function AdminGallery() {
  const { photos, pendingCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { success, error } = useToast();
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

  useEffect(() => {
    if (actionData?.message) {
      success(actionData.message);
    }
    if (actionData?.error) {
      error(actionData.error);
    }
  }, [actionData, success, error]);

  const pendingPhotos = photos.filter(p => !p.is_approved);
  const approvedPhotos = photos.filter(p => p.is_approved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50\">
      <Header />

      <div className="relative bg-gradient-to-br from-violet-900 via-violet-600 to-violet-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="camera" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Foto's Beheer</h1>
          <p className="text-xl text-violet-100">{pendingCount} foto{pendingCount !== 1 ? 's' : ''} wacht{pendingCount === 1 ? '' : 'en'} op goedkeuring</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Pending Photos - Polaroid Style */}
        {pendingPhotos.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Icon name="hourglass" className="w-8 h-8 text-yellow-600" /> 
              In Behandeling
              <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-lg font-semibold">
                {pendingPhotos.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingPhotos.map((photo: any) => {
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
                          className="w-full h-full object-cover transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          ⏳ Wacht op goedkeuring
                        </div>
                      </div>

                      {/* Caption Area */}
                      <div className="space-y-2">
                        {photo.caption && (
                          <p className="text-gray-800 font-medium text-sm leading-relaxed">
                            {photo.caption}
                          </p>
                        )}
                        {photo.zone_id && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Icon name="marker" className="w-3 h-3" />
                            {photo.zone_id}
                          </p>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            {photo.participant?.first_name} {photo.participant?.last_name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(photo.uploaded_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {photo.participant?.email}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <Form method="post" className="flex-1">
                          <input type="hidden" name="action" value="approve" />
                          <input type="hidden" name="photo_id" value={photo.id} />
                          <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-sm text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            <Icon name="checkSimple" className="w-4 h-4" /> Goed
                          </button>
                        </Form>
                        <Form method="post" className="flex-1">
                          <input type="hidden" name="action" value="reject" />
                          <input type="hidden" name="photo_id" value={photo.id} />
                          <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-sm text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            <Icon name="x" className="w-4 h-4" /> Afwijs
                          </button>
                        </Form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Approved Photos - Polaroid Style */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Icon name="checkSimple" className="w-8 h-8 text-green-600" /> 
            Goedgekeurd
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-semibold">
              {approvedPhotos.length}
            </span>
          </h2>
          
          {approvedPhotos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Icon name="camera" className="w-16 h-16 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nog geen goedgekeurde foto's</h3>
              <p className="text-gray-600">Foto's verschijnen hier nadat ze zijn goedgekeurd</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedPhotos.map((photo: any) => {
                return (
                  <div
                    key={photo.id}
                    className="break-inside-avoid group"
                  >
                    {/* Polaroid Card */}
                    <div className={`bg-white p-4 pb-16 rounded-sm shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer relative ${
                      photo.is_featured ? 'ring-2 ring-yellow-400' : ''
                    }`}>
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
                          className="w-full h-full object-cover transition-transform duration-500"
                        />
                        {photo.is_featured && (
                          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <Icon name="star" className="w-4 h-4" /> Featured
                          </div>
                        )}
                      </div>

                      {/* Caption Area */}
                      <div className="space-y-2">
                        {photo.caption && (
                          <p className="text-gray-800 font-medium text-sm leading-relaxed">
                            {photo.caption}
                          </p>
                        )}
                        {photo.zone_id && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Icon name="marker" className="w-3 h-3" />
                            {photo.zone_id}
                          </p>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            {photo.participant?.first_name} {photo.participant?.last_name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                            <Icon name="heart" className="w-3 h-3" /> {photo.likes_count}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <Form method="post" className="flex-1">
                          <input type="hidden" name="action" value="feature" />
                          <input type="hidden" name="photo_id" value={photo.id} />
                          <input type="hidden" name="is_featured" value={photo.is_featured.toString()} />
                          <button
                            type="submit"
                            className={`w-full py-1.5 rounded-sm text-xs font-semibold transition-all ${
                              photo.is_featured 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                          >
                            {photo.is_featured ? '★ Featured' : '☆ Feature'}
                          </button>
                        </Form>
                        <Form method="post" className="flex-none">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="photo_id" value={photo.id} />
                          <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-all"
                            onClick={(e) => !confirm('Weet je zeker dat je deze foto wilt verwijderen?') && e.preventDefault()}
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        </Form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-[1200] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>

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
                    {lightboxPhoto.zone_id && (
                      <span className="flex items-center gap-1">
                        <Icon name="marker" className="w-4 h-4" />
                        {lightboxPhoto.zone_id}
                      </span>
                    )}
                    <span className="text-xs">
                      {new Date(lightboxPhoto.uploaded_at).toLocaleDateString('nl-BE')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
