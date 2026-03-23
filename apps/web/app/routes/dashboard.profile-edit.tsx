import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, redirect } from 'react-router';
import { Form, useActionData, useLoaderData } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import HeroMedia from '~/components/HeroMedia';
import { Icon } from '~/components/Icon';
import { getActiveEdition, getSiteConfig } from '~/lib/sanity.server';
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

  const [edition, siteConfig] = await Promise.all([
    getActiveEdition(),
    getSiteConfig(),
  ]);
  const eventDate = edition?.eventDate || process.env.EVENT_DATE || '2026-08-08';
  
  // Calculate if we're within 5 days of the event
  const daysUntilEvent = Math.ceil((new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const canChangeRoutePreference = daysUntilEvent > 5;

  return { user, canChangeRoutePreference, daysUntilEvent, siteConfig, edition };
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
  const { user, canChangeRoutePreference, daysUntilEvent, siteConfig, edition } = useLoaderData<typeof loader>();
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

      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        <HeroMedia siteConfig={siteConfig} neverShowVideo />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-20">
          {/* Back link */}
          <div className="mb-10">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wide">
              <Icon name="arrow-left" className="w-4 h-4" />
              Dashboard
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 lg:gap-14">
            {/* Profile photo + upload controls */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              {/* Photo */}
              {user.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt="Profielfoto"
                  className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover ring-4 ring-primary-500/60 ring-offset-4 ring-offset-black/60"
                />
              ) : (
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-white/10 ring-4 ring-white/20 ring-offset-4 ring-offset-black/60 flex items-center justify-center">
                  <Icon name="user" className="w-16 h-16 text-white/30" />
                </div>
              )}

              <div className="flex gap-2">
              {/* Upload buttons */}
              <Form method="post" encType="multipart/form-data" className="flex gap-2">
                <input type="hidden" name="intent" value="upload-photo" />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-sm transition-colors font-semibold text-xs uppercase tracking-wide">
                  <Icon name="camera" className="w-3.5 h-3.5" />
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
                        try {
                          if (originalFile.size > 5 * 1024 * 1024) {
                            const compressedFile = await compressImage(originalFile);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(compressedFile);
                            e.target.files = dataTransfer.files;
                          }
                        } catch (error) {
                          console.error('Compression error:', error);
                          alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
                          return;
                        }
                        form.requestSubmit();
                      }
                    }}
                  />
                </label>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-sm transition-colors font-semibold text-xs uppercase tracking-wide">
                  <Icon name="image" className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="sr-only"
                    onChange={async (e) => {
                      const form = e.target.form;
                      const originalFile = e.target.files?.[0];
                      if (form && originalFile) {
                        try {
                          if (originalFile.size > 5 * 1024 * 1024) {
                            const compressedFile = await compressImage(originalFile);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(compressedFile);
                            e.target.files = dataTransfer.files;
                          }
                        } catch (error) {
                          console.error('Compression error:', error);
                          alert('Fout bij verwerken van afbeelding. Probeer een kleinere foto.');
                          return;
                        }
                        form.requestSubmit();
                      }
                    }}
                  />
                </label>
              </Form>

              {user.profile_photo_url && (
                <Form method="post">
                  <input type="hidden" name="intent" value="remove-photo" />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide bg-red-400/70 hover:text-red-300 rounded-sm transition-colors"
                  >
                    <Icon name="trash" className="w-3.5 h-3.5" />
                  </button>
                </Form>
              )}
              </div>
            </div>

            {/* Text + stats */}
            <div className="flex-grow pb-2">
              <p className="text-primary-200 font-semibold text-sm uppercase tracking-widest mb-3">
                {siteConfig?.eventName || 'Deur Den Bocht'} · {edition ? new Date(edition.eventDate).getFullYear() : new Date().getFullYear()}
              </p>
              <h1 className="text-5xl lg:text-6xl font-black mb-4 leading-tight">
                Profiel bewerken
              </h1>
              <p className="text-lg lg:text-xl text-primary-100 leading-relaxed mb-8 max-w-2xl">
                Pas je gegevens, motorinfo en voorkeuren aan.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="user" className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black leading-none">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-primary-200 mt-0.5">Deelnemer</div>
                  </div>
                </div>
                {user.motorcycle_brand && (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Icon name="motorcycle" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black leading-none">{user.motorcycle_brand}</div>
                      <div className="text-xs text-primary-200 mt-0.5">{user.motorcycle_model || 'Motor'}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="road" className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black leading-none capitalize">{routePreference}</div>
                    <div className="text-xs text-primary-200 mt-0.5">Route voorkeur</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex-grow bg-gray-900">

        {/* Alerts */}
        {(actionData?.success || actionData?.error) && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            {actionData?.success && (
              <div ref={alertRef} className="mb-4 flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-300 px-5 py-4 rounded-sm animate-in slide-in-from-top">
                <Icon name="check-circle" className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold">{actionData.success}</span>
              </div>
            )}
            {actionData?.error && (
              <div ref={alertRef} className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-sm animate-in slide-in-from-top">
                <Icon name="alert-circle" className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold">{actionData.error}</span>
              </div>
            )}
          </div>
        )}

        {/* Persoonlijke gegevens section */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-primary-400 font-bold text-xs uppercase tracking-widest mb-3">Gegevens</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-10 leading-tight">Persoonlijke gegevens</h2>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="intent" value="update-profile" />

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                    Voornaam *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    defaultValue={user.first_name}
                    className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                    Achternaam *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    defaultValue={user.last_name}
                    className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  defaultValue={user.email}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/30 rounded-sm cursor-not-allowed"
                />
                <p className="mt-1.5 text-xs text-white/25">Email kan niet worden aangepast</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                  Telefoon *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  defaultValue={user.phone}
                  className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                  Bio <span className="normal-case font-normal text-white/25">(optioneel)</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  defaultValue={user.bio || ''}
                  className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all resize-none"
                  placeholder="Vertel iets over jezelf..."
                />
              </div>

              {/* Motorgegevens divider */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="motorcycle" className="w-4 h-4 text-primary-400" />
                </div>
                <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Motorgegevens</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="motorcycleBrand" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                    Merk *
                  </label>
                  <input
                    id="motorcycleBrand"
                    name="motorcycleBrand"
                    type="text"
                    required
                    defaultValue={user.motorcycle_brand}
                    className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="motorcycleModel" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                    Model *
                  </label>
                  <input
                    id="motorcycleModel"
                    name="motorcycleModel"
                    type="text"
                    required
                    defaultValue={user.motorcycle_model}
                    className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="licensePlate" className="block text-xs font-bold uppercase tracking-wide text-white/40 mb-2">
                  Nummerplaat *
                </label>
                <input
                  id="licensePlate"
                  name="licensePlate"
                  type="text"
                  required
                  defaultValue={user.license_plate}
                  className="w-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-sm focus:bg-white/15 focus:border-primary-400 outline-none transition-all uppercase font-mono tracking-wider"
                />
              </div>

              {/* Voorkeuren divider */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="settings" className="w-4 h-4 text-primary-400" />
                </div>
                <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Voorkeuren</h3>
              </div>

              <div className="space-y-3">
                <label htmlFor="paperRoadbook" className="flex items-center gap-4 p-4 rounded-sm border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all cursor-pointer group">
                  <input
                    id="paperRoadbook"
                    name="paperRoadbook"
                    type="checkbox"
                    defaultChecked={!!user.paper_roadbook}
                    className="h-4 w-4 text-primary-600 border-white/20 rounded focus:ring-primary-500 bg-white/10 cursor-pointer"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                      <Icon name="book" className="w-4 h-4 text-white/40 group-hover:text-primary-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white">Papieren roadbook</span>
                      <span className="text-xs text-white/40">Ontvang een gedrukt roadbook op het event</span>
                    </div>
                  </div>
                </label>

                <label htmlFor="allowLocationSharing" className="flex items-center gap-4 p-4 rounded-sm border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all cursor-pointer group">
                  <input
                    id="allowLocationSharing"
                    name="allowLocationSharing"
                    type="checkbox"
                    defaultChecked={!!user.allow_location_sharing}
                    className="h-4 w-4 text-primary-600 border-white/20 rounded focus:ring-primary-500 bg-white/10 cursor-pointer"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                      <Icon name="marker" className="w-4 h-4 text-white/40 group-hover:text-primary-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white">Live locatie delen</span>
                      <span className="text-xs text-white/40">Toon mij op de publieke volgerpagina</span>
                    </div>
                  </div>
                </label>

                <label htmlFor="showOnLeaderboard" className="flex items-center gap-4 p-4 rounded-sm border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all cursor-pointer group">
                  <input
                    id="showOnLeaderboard"
                    name="showOnLeaderboard"
                    type="checkbox"
                    defaultChecked={!!user.show_on_leaderboard}
                    className="h-4 w-4 text-primary-600 border-white/20 rounded focus:ring-primary-500 bg-white/10 cursor-pointer"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                      <Icon name="trophy" className="w-4 h-4 text-white/40 group-hover:text-primary-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white">Leaderboard</span>
                      <span className="text-xs text-white/40">Toon mij op het klassement</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-black py-3 px-8 rounded-sm uppercase tracking-wide transition-colors"
                >
                  <Icon name="check" className="w-4 h-4" />
                  Opslaan
                </button>
              </div>
            </Form>
          </div>
        </section>

        {/* Route Preference section */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-primary-400 font-bold text-xs uppercase tracking-widest mb-3">Rijformule</p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">Route voorkeur</h2>

            {!canChangeRoutePreference ? (
              <div className="mt-4 mb-6 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-sm">
                <Icon name="alert-circle" className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">Route voorkeur kan niet meer aangepast worden binnen 5 dagen voor het event.</span>
              </div>
            ) : (
              <p className="text-white/40 text-sm mb-6 mt-1">
                Aanpassen tot 5 dagen voor het event · nog {daysUntilEvent} dagen
              </p>
            )}

            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-route-preference" />

              <div className="grid md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-sm border-2 p-5 transition-all ${
                  routePreference === 'adventure'
                    ? 'border-primary-400 bg-white/10'
                    : 'border-white/10 hover:border-white/25 bg-white/5'
                } ${!canChangeRoutePreference ? 'opacity-40 cursor-not-allowed' : ''}`}>
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon name="flag" className="w-5 h-5 text-primary-400" />
                      </div>
                      {routePreference === 'adventure' && (
                        <span className="text-xs font-bold uppercase tracking-wide text-primary-400 flex items-center gap-1">
                          <Icon name="checkSimple" className="w-3.5 h-3.5" /> Geselecteerd
                        </span>
                      )}
                    </div>
                    <span className="block text-lg font-black text-white mb-1">Adventure Track</span>
                    <p className="text-sm text-white/50">Complete route met 4 optionele rally zones</p>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-sm border-2 p-5 transition-all ${
                  routePreference === 'scenic'
                    ? 'border-primary-400 bg-white/10'
                    : 'border-white/10 hover:border-white/25 bg-white/5'
                } ${!canChangeRoutePreference ? 'opacity-40 cursor-not-allowed' : ''}`}>
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon name="mountain" className="w-5 h-5 text-primary-400" />
                      </div>
                      {routePreference === 'scenic' && (
                        <span className="text-xs font-bold uppercase tracking-wide text-primary-400 flex items-center gap-1">
                          <Icon name="checkSimple" className="w-3.5 h-3.5" /> Geselecteerd
                        </span>
                      )}
                    </div>
                    <span className="block text-lg font-black text-white mb-1">Scenic Route</span>
                    <p className="text-sm text-white/50">Volledige route zonder rally zones</p>
                  </div>
                </label>
              </div>

              {canChangeRoutePreference && (
                <div className="pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-black py-3 px-8 rounded-sm uppercase tracking-wide transition-colors"
                  >
                    <Icon name="check" className="w-4 h-4" />
                    Route voorkeur opslaan
                  </button>
                </div>
              )}
            </Form>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
