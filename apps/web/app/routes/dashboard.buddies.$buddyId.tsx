import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import HeroMedia from '~/components/HeroMedia';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';
import { getSiteConfig } from '~/lib/sanity.server';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.buddy) {
    return [{ title: 'Buddy niet gevonden - Deur Den Bocht' }];
  }
  return [{ title: `${data.buddy.first_name} ${data.buddy.last_name} - Naftgenoot - Deur Den Bocht` }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Buddy detail page loaded', { buddyId: params.buddyId });
  
  const { buddyId } = params;

  if (!buddyId) {
    throw new Response('Buddy ID is verplicht', { status: 400 });
  }

  // Verify they are actually buddies
  const { data: buddyRelation } = await supabaseAdmin
    .from('riding_buddies')
    .select('id')
    .or(`and(participant_id.eq.${userId},buddy_id.eq.${buddyId},status.eq.accepted),and(participant_id.eq.${buddyId},buddy_id.eq.${userId},status.eq.accepted)`)
    .single();

  if (!buddyRelation) {
    throw new Response('Je bent geen naftgenoten met deze deelnemer', { status: 403 });
  }

  // Get buddy details
  const { data: buddy, error: buddyError } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, phone, bio, motorcycle_brand, motorcycle_model, license_plate, profile_photo_url, route_preference, created_at')
    .eq('id', buddyId)
    .single();

  if (buddyError || !buddy) {
    throw new Response('Buddy niet gevonden', { status: 404 });
  }

  // Get buddy's PARTICIPANT achievements (individual achievements, not buddy group achievements)
  const { data: achievements, error: achievementsError } = await supabaseAdmin
    .from('participant_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('participant_id', buddyId)
    .order('unlocked_at', { ascending: false });

  if (achievementsError) {
    console.error('[buddy-detail] participant achievements error:', achievementsError);
  }

  // Get buddy's recent check-ins
  const { data: checkIns, error: checkInsError } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*')
    .eq('participant_id', buddyId)
    .order('checked_in_at', { ascending: false })
    .limit(20);

  if (checkInsError) {
    console.error('[buddy-detail] check-ins error:', checkInsError);
  }

  // Format check-ins with zone_id as zone name (zones come from Sanity, not Supabase)
  const checkInsWithZones = (checkIns || []).map((checkIn: any) => ({
    ...checkIn,
    zone: {
      name: checkIn.zone_id ? formatZoneName(checkIn.zone_id) : 'Onbekende zone',
      zone_number: checkIn.zone_id,
      location_name: null
    }
  }));

  function formatZoneName(zoneId: string): string {
    // Convert slug to readable name
    return zoneId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get buddy's stats - use actual data length instead of separate count queries
  const totalCheckIns = checkIns?.length || 0;

  // Get actual buddy relationships instead of just counting
  const { data: buddiesAsParticipant, error: buddiesAsParticipantError } = await supabaseAdmin
    .from('riding_buddies')
    .select('*')
    .eq('participant_id', buddyId)
    .eq('status', 'accepted');

  const { data: buddiesAsBuddy, error: buddiesAsBuddyError } = await supabaseAdmin
    .from('riding_buddies')
    .select('*')
    .eq('buddy_id', buddyId)
    .eq('status', 'accepted');

  if (buddiesAsParticipantError) {
    console.error('[buddy-detail] buddies as participant error:', buddiesAsParticipantError);
  }
  if (buddiesAsBuddyError) {
    console.error('[buddy-detail] buddies as buddy error:', buddiesAsBuddyError);
  }

  const totalBuddies = (buddiesAsParticipant?.length || 0) + (buddiesAsBuddy?.length || 0);

  const siteConfig = await getSiteConfig();

  return {
    buddy,
    siteConfig,
    achievements: achievements || [],
    checkIns: checkInsWithZones || [],
    stats: {
      totalCheckIns: totalCheckIns || 0,
      totalBuddies: totalBuddies,
      totalAchievements: achievements?.length || 0,
    },
  };
}

export default function BuddyDetail() {
  const { buddy, achievements, checkIns, stats, siteConfig } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="relative text-white overflow-hidden">
        <HeroMedia siteConfig={siteConfig} neverShowVideo />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-20">
          <div className="max-w-3xl">
            <div className="mb-6">
              <Link to="/dashboard/riding-buddies" className="inline-flex items-center text-white hover:text-primary-100">
                <Icon name="arrow-left" className="w-5 h-5 mr-2" />
                Terug naar Naftgenoten
              </Link>
            </div>

            <div className="flex items-start gap-6">
              {buddy.profile_photo_url ? (
                <img
                  src={buddy.profile_photo_url}
                  alt={buddy.first_name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center border-4 border-white">
                  <Icon name="user" className="w-12 h-12 text-white" />
                </div>
              )}

              <div className="flex-grow">
                <h1 className="text-4xl lg:text-5xl font-black mb-2 text-white">
                  {buddy.first_name} {buddy.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/80">
                  {buddy.motorcycle_brand && buddy.motorcycle_model && (
                    <div className="flex items-center gap-2">
                      <Icon name="bike" className="w-5 h-5" />
                      <span>{buddy.motorcycle_brand} {buddy.motorcycle_model}</span>
                    </div>
                  )}
                  {buddy.route_preference && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      buddy.route_preference === 'rally'
                        ? 'bg-red-500/20 text-white border border-red-300'
                        : 'bg-green-500/20 text-white border border-green-300'
                    }`}>
                      <Icon name={buddy.route_preference === 'rally' ? 'zap' : 'leaf'} className="w-4 h-4" />
                      <span>{buddy.route_preference === 'rally' ? 'Rally Route' : 'Scenic Route'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex-grow bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-800/20 rounded-full flex items-center justify-center">
                  <Icon name="pin" className="w-5 h-5 text-primary-300" />
                </div>
                <h3 className="text-sm font-medium text-white/70">Check-ins</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalCheckIns}</p>
            </div>

            <div className="bg-white/5 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-800/20 rounded-full flex items-center justify-center">
                  <Icon name="users" className="w-5 h-5 text-primary-300" />
                </div>
                <h3 className="text-sm font-medium text-white/70">Naftgenoten</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalBuddies}</p>
            </div>

            <div className="bg-white/5 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-800/20 rounded-full flex items-center justify-center">
                  <Icon name="trophy" className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-sm font-medium text-white/70">Achievements</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalAchievements}</p>
            </div>
          </div>

          {/* Bio */}
          {buddy.bio && (
            <div className="bg-white/5 rounded-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Bio</h2>
              <p className="text-white/70 whitespace-pre-wrap">{buddy.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-white/5 rounded-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="mail" className="w-5 h-5 text-white/60" />
                <a href={`mailto:${buddy.email}`} className="text-primary-300 hover:text-primary-200">
                  {buddy.email}
                </a>
              </div>
              {buddy.phone && (
                <div className="flex items-center gap-3">
                  <Icon name="phone" className="w-5 h-5 text-white/60" />
                  <a href={`tel:${buddy.phone}`} className="text-primary-300 hover:text-primary-200">
                    {buddy.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-white/5 rounded-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Icon name="trophy" className="w-6 h-6 text-yellow-500" />
                Achievements ({achievements.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((participantAchievement: any) => (
                  <div
                    key={participantAchievement.id}
                    className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{participantAchievement.achievement?.icon || '🏆'}</div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {participantAchievement.achievement?.name || 'Achievement'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {participantAchievement.achievement?.description || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          Behaald op {new Date(participantAchievement.unlocked_at).toLocaleDateString('nl-BE')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Check-ins */}
          {checkIns.length > 0 && (
              <div className="bg-white/5 rounded-sm p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Icon name="map-pin" className="w-6 h-6 text-primary-300" />
                  Recente Check-ins
                </h2>
                <div className="space-y-3">
                  {checkIns.map((checkIn: any) => (
                    <div
                      key={checkIn.id}
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-white">
                            {checkIn.zone?.name || 'Onbekende zone'}
                          </h3>
                          <p className="text-sm text-white/70">
                            {checkIn.zone?.location_name && `${checkIn.zone.location_name} • `}
                            Zone {checkIn.zone?.zone_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {new Date(checkIn.checked_in_at).toLocaleDateString('nl-BE', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xs text-white/60"> 
                            {new Date(checkIn.checked_in_at).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
