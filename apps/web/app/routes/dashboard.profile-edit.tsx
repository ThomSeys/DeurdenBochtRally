import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, redirect } from 'react-router';
import { Form, useActionData, useLoaderData } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { getActiveEdition } from '~/lib/sanity.server';
import { createRequestLogger } from '~/lib/logger.server';
import { compressImage } from '~/lib/image-compression';
import { stripEXIFAndOptimize } from '~/lib/image-exif.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Profiel bewerken - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  const edition = await getActiveEdition();
  const eventDate = edition?.eventDate || process.env.EVENT_DATE || '2026-08-08';
  
  // Calculate if we're within 5 days of the event
  const daysUntilEvent = Math.ceil((new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const canChangeRoutePreference = daysUntilEvent > 5;

  return { user, canChangeRoutePreference, daysUntilEvent };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  const requestLogger = createRequestLogger(request, userId);

  if (!user) {
    await requestLogger.warn('profile', 'Profile edit failed: user not found');
    return { error: 'Gebruiker niet gevonden', status: 404 };
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'upload-photo') {
      await requestLogger.info('profile', 'Profile photo upload initiated');
      const photo = formData.get('photo') as File;
      
      if (!photo || !(photo instanceof File)) {
        await requestLogger.warn('profile', 'Photo upload failed: no photo selected');
        return { error: 'Geen foto geselecteerd', status: 400 };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(photo.type)) {
        await requestLogger.warn('profile', 'Photo upload failed: invalid file type', { fileType: photo.type });
        return { error: 'Alleen JPG, PNG en WebP bestanden zijn toegestaan', status: 400 };
      }

      // Validate file size (max 5MB)
      if (photo.size > 5 * 1024 * 1024) {
        await requestLogger.warn('profile', 'Photo upload failed: file too large', { fileSize: photo.size });
        return { error: 'Foto mag maximaal 5MB zijn', status: 400 };
      }

      // Generate unique filename
      const fileExt = photo.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await photo.arrayBuffer();
      let buffer = Buffer.from(arrayBuffer);

      // Strip EXIF data and optimize image
      try {
        const { buffer: processedBuffer } = await stripEXIFAndOptimize(buffer, photo.type, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 85,
        });
        buffer = processedBuffer;
      } catch (error) {
        console.error('EXIF stripping failed, continuing with original:', error);
        // Continue with original buffer if processing fails
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('profile-photos')
        .upload(filePath, buffer, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        await requestLogger.error('profile', 'Photo upload failed: storage error', uploadError as Error, {
          fileName,
          fileSize: photo.size
        });
        return { error: 'Er ging iets mis bij het uploaden van de foto', status: 500 };
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update user profile with photo URL
      const { error: updateError } = await supabaseAdmin
        .from('participants')
        .update({ profile_photo_url: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        await requestLogger.error('profile', 'Profile photo update failed', updateError as Error, {
          photoUrl: urlData.publicUrl
        });
        return { error: 'Foto geüpload maar profiel niet bijgewerkt', status: 500 };
      }

      return { success: 'Profielfoto succesvol geüpload' };
    }

    if (intent === 'remove-photo') {
      // Remove photo URL from profile
      const { error: updateError } = await supabaseAdmin
        .from('participants')
        .update({ profile_photo_url: null })
        .eq('id', userId);

      if (updateError) {
        console.error('[profile-edit] remove photo error', updateError);
        return { error: 'Er ging iets mis bij het verwijderen van de foto', status: 500 };
      }

      // Optionally delete from storage (we could keep it for history)
      if (user.profile_photo_url) {
        const pathMatch = user.profile_photo_url.match(/profiles\/(.+)$/);
        if (pathMatch) {
          await supabaseAdmin.storage
            .from('profile-photos')
            .remove([`profiles/${pathMatch[1]}`]);
        }
      }

      return { success: 'Profielfoto succesvol verwijderd' };
    }

    if (intent === 'update-profile') {
      const firstName = formData.get('firstName');
      const lastName = formData.get('lastName');
      const phone = formData.get('phone');
      const bio = formData.get('bio');
      const motorcycleBrand = formData.get('motorcycleBrand');
      const motorcycleModel = formData.get('motorcycleModel');
      const licensePlate = formData.get('licensePlate');
      const paperRoadbook = formData.get('paperRoadbook') === 'on';
      const allowLocationSharing = formData.get('allowLocationSharing') === 'on';
      const showOnLeaderboard = formData.get('showOnLeaderboard') === 'on';

      if (
        typeof firstName !== 'string' ||
        typeof lastName !== 'string' ||
        typeof phone !== 'string' ||
        typeof motorcycleBrand !== 'string' ||
        typeof motorcycleModel !== 'string' ||
        typeof licensePlate !== 'string'
      ) {
        return { error: 'Alle verplichte velden moeten ingevuld zijn', status: 400 };
      }

      const { error: updateError } = await supabaseAdmin
        .from('participants')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          bio: typeof bio === 'string' ? bio : null,
          motorcycle_brand: motorcycleBrand,
          motorcycle_model: motorcycleModel,
          license_plate: licensePlate.toUpperCase(),
          paper_roadbook: paperRoadbook,
          allow_location_sharing: allowLocationSharing,
          show_on_leaderboard: showOnLeaderboard,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[profile-edit] update error', updateError);
        return { error: 'Er ging iets mis bij het opslaan', status: 500 };
      }

      return { success: 'Profiel succesvol bijgewerkt' };
    }

    if (intent === 'update-route-preference') {
      const routePreference = formData.get('routePreference');
      
      if (typeof routePreference !== 'string' || !['adventure', 'scenic'].includes(routePreference)) {
        return { error: 'Ongeldige route voorkeur', status: 400 };
      }

      const edition = await getActiveEdition();
      const eventDate = edition?.eventDate || process.env.EVENT_DATE || '2026-08-08';
      const daysUntilEvent = Math.ceil((new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilEvent <= 5) {
        return { error: 'Route voorkeur kan niet meer aangepast worden binnen 5 dagen voor het event', status: 403 };
      }

      const { error: updateError } = await supabaseAdmin
        .from('participants')
        .update({
          route_preference: routePreference,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[profile-edit] route preference update error', updateError);
        return { error: 'Er ging iets mis bij het opslaan', status: 500 };
      }

      return { success: 'Route voorkeur succesvol aangepast' };
    }

    return { error: 'Ongeldige actie', status: 400 };
  } catch (error) {
    console.error('[profile-edit] action error', error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function ProfileEdit() {
  const { user, canChangeRoutePreference, daysUntilEvent } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const [routePreference, setRoutePreference] = useState(user.route_preference || 'adventure');
  const alertRef = useRef<HTMLDivElement>(null);

  // Scroll to alert when actionData changes
  useEffect(() => {
    if (actionData && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero with gradient */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Profiel bewerken
          </h1>
          <p className="text-xl text-primary-100">
            Pas je gegevens en voorkeuren aan
          </p>
        </div>
      </section>

      <div className="flex-grow py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700">
              <Icon name="arrow-left" className="w-5 h-5 mr-2" />
              Terug naar dashboard
            </Link>
          </div>
          {actionData?.success && (
            <div ref={alertRef} className="mb-6 bg-green-50 border-2 border-green-500 text-green-800 px-4 py-3 rounded-sm flex items-center gap-3 animate-in slide-in-from-top">
              <Icon name="check-circle" className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="font-medium">{actionData.success}</span>
            </div>
          )}

          {actionData?.error && (
            <div ref={alertRef} className="mb-6 bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded-sm flex items-center gap-3 animate-in slide-in-from-top">
              <Icon name="alert-circle" className="w-6 h-6 text-red-600 flex-shrink-0" />
              <span className="font-medium">{actionData.error}</span>
            </div>
          )}

          {/* Profile Photo */}
          <div className="bg-white rounded-sm shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profielfoto</h2>
            
            <div className="flex items-start gap-6">
              {/* Current Photo */}
              <div className="flex-shrink-0">
                {user.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt="Profielfoto"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center">
                    <Icon name="user" className="w-16 h-16 text-primary-600" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Upload een profielfoto om je profiel persoonlijker te maken. Deze foto wordt getoond bij je naftgenoten en in de achievements.
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Toegestane formaten: JPG, PNG, WebP. Grote foto's worden automatisch verkleind.
                </p>

                <Form method="post" encType="multipart/form-data" className="space-y-3">
                  <input type="hidden" name="intent" value="upload-photo" />
                  
                  <div className="flex gap-2">
                    {/* Camera Upload */}
                    <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors">
                      <Icon name="camera" className="w-4 h-4" />
                      <span className="text-sm font-medium">Camera</span>
                      <input
                        type="file"
                        name="photo"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        capture="environment"
                        className="sr-only"
                        onChange={async (e) => {
                          const form = e.target.form;
                          const originalFile = e.target.files?.[0];
                          if (form && originalFile) {
                            // Compress if needed
                            try {
                              if (originalFile.size > 5 * 1024 * 1024) {
                                // Show loading state
                                const submitBtn = form.querySelector('button[type="submit"]');
                                if (submitBtn) {
                                  submitBtn.textContent = 'Comprimeren...';
                               }
                                
                                const compressedFile = await compressImage(originalFile);
                                
                                // Create new DataTransfer to replace file
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(compressedFile);
                                e.target.files = dataTransfer.files;
                              }
                            } catch (error) {
                              console.error('Compression error:', error);
                              alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
                              return;
                            }
                            
                            // Auto-submit form when file is ready
                            form.requestSubmit();
                          }
                        }}
                      />
                    </label>

                    {/* Album Upload */}
                    <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors">
                      <Icon name="image" className="w-4 h-4" />
                      <span className="text-sm font-medium">Album</span>
                      <input
                        type="file"
                        name="photo"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const form = e.target.form;
                          const originalFile = e.target.files?.[0];
                          if (form && originalFile) {
                            // Compress if needed
                            try {
                              if (originalFile.size > 5 * 1024 * 1024) {
                                // Show loading state
                                const submitBtn = form.querySelector('button[type="submit"]');
                                if (submitBtn) {
                                  submitBtn.textContent = 'Comprimeren...';
                               }
                                
                                const compressedFile = await compressImage(originalFile);
                                
                                // Create new DataTransfer to replace file
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(compressedFile);
                                e.target.files = dataTransfer.files;
                              }
                            } catch (error) {
                              console.error('Compression error:', error);
                              alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
                              return;
                            }
                            
                            // Auto-submit form when file is ready
                            form.requestSubmit();
                          }
                        }}
                      />
                    </label>
                  </div>
                </Form>

                {user.profile_photo_url && (
                  <Form method="post" className="mt-3">
                    <input type="hidden" name="intent" value="remove-photo" />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Foto verwijderen
                    </button>
                  </Form>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-sm shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Persoonlijke gegevens</h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-profile" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    defaultValue={user.first_name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Achternaam *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    defaultValue={user.last_name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (kan niet aangepast worden)
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  defaultValue={user.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  defaultValue={user.phone}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (optioneel)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  defaultValue={user.bio || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Vertel iets over jezelf..."
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Motorgegevens</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="motorcycleBrand" className="block text-sm font-medium text-gray-700 mb-1">
                    Merk *
                  </label>
                  <input
                    id="motorcycleBrand"
                    name="motorcycleBrand"
                    type="text"
                    required
                    defaultValue={user.motorcycle_brand}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="motorcycleModel" className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    id="motorcycleModel"
                    name="motorcycleModel"
                    type="text"
                    required
                    defaultValue={user.motorcycle_model}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                  Nummerplaat *
                </label>
                <input
                  id="licensePlate"
                  name="licensePlate"
                  type="text"
                  required
                  defaultValue={user.license_plate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Voorkeuren</h3>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="paperRoadbook"
                    name="paperRoadbook"
                    type="checkbox"
                    defaultChecked={!!user.paper_roadbook}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="paperRoadbook" className="ml-3 text-sm text-gray-700">
                    <span className="font-semibold">Ik wil een papieren roadbook ontvangen</span>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="allowLocationSharing"
                    name="allowLocationSharing"
                    type="checkbox"
                    defaultChecked={!!user.allow_location_sharing}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="allowLocationSharing" className="ml-3 text-sm text-gray-700">
                    Sta locatie delen toe (voor live kaart)
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="showOnLeaderboard"
                    name="showOnLeaderboard"
                    type="checkbox"
                    defaultChecked={!!user.show_on_leaderboard}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="showOnLeaderboard" className="ml-3 text-sm text-gray-700">
                    Toon mij op het leaderboard
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-sm transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </Form>
          </div>

          {/* Route Preference */}
          <div className="bg-white rounded-sm shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Route voorkeur</h2>
            
            {!canChangeRoutePreference && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <Icon name="alert-circle" className="w-5 h-5 inline mr-2" />
                Route voorkeur kan niet meer aangepast worden binnen 5 dagen voor het event.
              </div>
            )}

            {canChangeRoutePreference && (
              <p className="text-sm text-gray-600 mb-4">
                Je kan je route voorkeur aanpassen tot 5 dagen voor het event. ({daysUntilEvent} dagen te gaan)
              </p>
            )}

            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-route-preference" />
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-sm border-2 p-4 transition-all ${
                  routePreference === 'adventure' 
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${!canChangeRoutePreference ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="routePreference"
                    value="adventure"
                    disabled={!canChangeRoutePreference}
                    checked={routePreference === 'adventure'}
                    onChange={(e) => setRoutePreference(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🎯</span>
                      {routePreference === 'adventure' && (
                        <Icon name="check-circle" className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <span className="block text-lg font-semibold text-gray-900 mb-2">Adventure Track</span>
                    <p className="text-sm text-gray-600">
                      Complete route met 4 optionele rally zones
                    </p>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-sm border-2 p-4 transition-all ${
                  routePreference === 'scenic' 
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${!canChangeRoutePreference ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="routePreference"
                    value="scenic"
                    disabled={!canChangeRoutePreference}
                    checked={routePreference === 'scenic'}
                    onChange={(e) => setRoutePreference(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🗺️</span>
                      {routePreference === 'scenic' && (
                        <Icon name="check-circle" className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <span className="block text-lg font-semibold text-gray-900 mb-2">Scenic Route</span>
                    <p className="text-sm text-gray-600">
                      Volledige route zonder rally zones
                    </p>
                  </div>
                </label>
              </div>

              {canChangeRoutePreference && (
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-sm transition-colors"
                  >
                    Route voorkeur opslaan
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
