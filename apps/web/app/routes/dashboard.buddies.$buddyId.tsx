import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.buddy) {
    return [{ title: 'Buddy niet gevonden - Deur Den Bocht' }];
  }
  return [{ title: `${data.buddy.first_name} ${data.buddy.last_name} - Naftgenoot - Deur Den Bocht` }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
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

  return {
    buddy,
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
  const { buddy, achievements, checkIns, stats } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero with gradient */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-12 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
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
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white">
                <Icon name="user" className="w-12 h-12 text-white" />
              </div>
            )}
            
            <div className="flex-grow">
              <h1 className="text-4xl font-bold mb-2">
                {buddy.first_name} {buddy.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-primary-100">
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
      </section>

      <div className="flex-grow py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-sm shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon name="map-pin" className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Check-ins</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCheckIns}</p>
            </div>

            <div className="bg-white rounded-sm shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon name="users" className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Naftgenoten</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBuddies}</p>
            </div>

            <div className="bg-white rounded-sm shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Icon name="trophy" className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Achievements</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAchievements}</p>
            </div>
          </div>

          {/* Bio */}
          {buddy.bio && (
            <div className="bg-white rounded-sm shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bio</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{buddy.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-white rounded-sm shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="mail" className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${buddy.email}`} className="text-primary-600 hover:text-primary-700">
                  {buddy.email}
                </a>
              </div>
              {buddy.phone && (
                <div className="flex items-center gap-3">
                  <Icon name="phone" className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${buddy.phone}`} className="text-primary-600 hover:text-primary-700">
                    {buddy.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-white rounded-sm shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
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
            <div className="bg-white rounded-sm shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Icon name="map-pin" className="w-6 h-6 text-primary-600" />
                Recente Check-ins
              </h2>
              <div className="space-y-3">
                {checkIns.map((checkIn: any) => (
                  <div
                    key={checkIn.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {checkIn.zone?.name || 'Onbekende zone'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {checkIn.zone?.location_name && `${checkIn.zone.location_name} • `}
                          Zone {checkIn.zone?.zone_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(checkIn.checked_in_at).toLocaleDateString('nl-BE', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(checkIn.checked_in_at).toLocaleTimeString('nl-BE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
