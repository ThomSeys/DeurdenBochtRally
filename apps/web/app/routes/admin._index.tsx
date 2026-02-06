import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Admin Dashboard - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin dashboard loaded');
  
  const [
    checkInsCountResult,
    pendingChallengesCountResult,
    emergencySOSCountResult,
    recentSOSResult,
    totalParticipantsResult,
    paidParticipantsResult,
    checkedInParticipantsResult,
    totalCheckInsResult,
    pendingScansResult,
    fallbackReviewResult,
    pendingPhotosResult,
    pendingStoriesResult,
    buddyGroupsResult,
    totalAchievementsResult,
    totalAlbumsResult,
    totalSOSResult,
    totalChallengesResult,
    totalStoriesResult,
    paymentsResult,
    rallyZonesResult,
    eventMarkersResult,
    recentParticipantsResult,
    checkInCountsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('route_challenge_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_validated', false),
    supabaseAdmin
      .from('emergency_sos')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'resolved'),
    supabaseAdmin
      .from('emergency_sos')
      .select('*, participants!emergency_sos_participant_id_fkey(first_name, last_name)')
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('participants')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'completed'),
    supabaseAdmin
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('checked_in', true),
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('requires_manual_validation', true)
      .is('manually_validated_at', null),
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('is_fallback', true)
      .is('is_validated', null),
    supabaseAdmin
      .from('participant_photos')
      .select('*', { count: 'exact', head: true })
      .or('is_approved.is.null,is_approved.eq.false'),
    supabaseAdmin
      .from('ride_stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabaseAdmin
      .from('riding_buddies')
      .select('buddy_id')
      .not('buddy_id', 'is', null),
    supabaseAdmin
      .from('achievements')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('photo_albums')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('emergency_sos')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('route_challenge_submissions')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('ride_stories')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('participants')
      .select('amount_paid')
      .eq('payment_status', 'completed'),
    sanityClient.fetch(`
      *[_type == "rallyZone"] | order(order asc) {
        _id,
        name,
        is_open
      }
    `),
    sanityClient.fetch(`
      *[_type == "eventMarker"] {
        _id,
        name,
        isActive
      }
    `),
    supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, email, created_at, payment_status, checked_in')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('participant_id, participants(first_name, last_name, motorcycle_brand, motorcycle_model)')
      .eq('action', 'CHECKIN'),
  ]);

  const { count: checkInsCount, error: checkInsError } = checkInsCountResult;
  const { count: pendingChallengesCount, error: challengesCountError } = pendingChallengesCountResult;
  const { count: emergencySOSCount, error: sosCountError } = emergencySOSCountResult;
  const { data: recentSOS, error: sosError } = recentSOSResult;
  const { count: totalParticipants } = totalParticipantsResult;
  const { count: paidParticipants } = paidParticipantsResult;
  const { count: checkedInParticipants } = checkedInParticipantsResult;
  const { count: totalCheckIns } = totalCheckInsResult;
  const { count: pendingScansCount } = pendingScansResult;
  const { count: fallbackReviewCount } = fallbackReviewResult;
  const { count: pendingPhotosCount } = pendingPhotosResult;
  const { count: pendingStoriesCount } = pendingStoriesResult;
  const { data: buddyGroups } = buddyGroupsResult;
  const { count: totalAchievementsCount } = totalAchievementsResult;
  const { count: totalAlbumsCount } = totalAlbumsResult;
  const { count: totalSOSCount } = totalSOSResult;
  const { count: totalChallengesCount } = totalChallengesResult;
  const { count: totalStoriesCount } = totalStoriesResult;
  const { data: payments } = paymentsResult;
  const rallyZones = rallyZonesResult as any[];
  const eventMarkers = eventMarkersResult as any[];
  const { data: recentParticipants } = recentParticipantsResult;
  const { data: checkInCounts } = checkInCountsResult;

  console.log('[admin dashboard] Urgent counts:', {
    emergencySOSCount,
    pendingChallengesCount,
    recentSOSCount: recentSOS?.length || 0,
    recentSOSDetails: recentSOS,
    errors: { sosCountError, sosError, challengesCountError }
  });

  const activeBuddyGroupsCount = new Set(buddyGroups?.map(b => b.buddy_id) || []).size;

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

  const openZonesCount = rallyZones?.filter((z: any) => z.is_open).length || 0;
  const totalZonesCount = rallyZones?.length || 0;

  const activeMarkersCount = eventMarkers?.filter((m: any) => m.isActive).length || 0;
  const totalMarkersCount = eventMarkers?.length || 0;

  // Count check-ins per participant
  const participantCheckIns = new Map();
  checkInCounts?.forEach((checkIn: any) => {
    const pid = checkIn.participant_id;
    if (!participantCheckIns.has(pid)) {
      participantCheckIns.set(pid, {
        participant_id: pid,
        first_name: checkIn.participants?.first_name,
        last_name: checkIn.participants?.last_name,
        motorcycle_brand: checkIn.participants?.motorcycle_brand,
        motorcycle_model: checkIn.participants?.motorcycle_model,
        check_in_count: 0,
      });
    }
    participantCheckIns.get(pid).check_in_count++;
  });

  const topCheckIns = Array.from(participantCheckIns.values())
    .sort((a, b) => b.check_in_count - a.check_in_count)
    .slice(0, 10);

  return {
    urgent: {
      checkInsCount: checkInsCount || 0,
      emergencySOSCount: emergencySOSCount || 0,
      pendingChallengesCount: pendingChallengesCount || 0,
      recentSOS: recentSOS || [],
    },
    stats: {
      totalParticipants: totalParticipants || 0,
      paidParticipants: paidParticipants || 0,
      checkedInParticipants: checkedInParticipants || 0,
      totalCheckIns: totalCheckIns || 0,
    },
    teasers: {
      pendingScansCount: pendingScansCount || 0,
      fallbackReviewCount: fallbackReviewCount || 0,
      pendingPhotosCount: pendingPhotosCount || 0,
      pendingStoriesCount: pendingStoriesCount || 0,
      activeBuddyGroupsCount: activeBuddyGroupsCount || 0,
      totalAchievementsCount: totalAchievementsCount || 0,
      totalAlbumsCount: totalAlbumsCount || 0,
      totalSOSCount: totalSOSCount || 0,
      totalChallengesCount: totalChallengesCount || 0,
      totalStoriesCount: totalStoriesCount || 0,
      totalRevenue,
      openZonesCount,
      totalZonesCount,
      activeMarkersCount,
      totalMarkersCount,
    },
    recentParticipants: recentParticipants || [],
    topCheckIns: topCheckIns || [],
  };
}

export default function AdminDashboard() {
  const { urgent, stats, teasers, recentParticipants, topCheckIns } = useLoaderData<typeof loader>();

  const hasUrgentMatters = urgent.emergencySOSCount > 0 || urgent.pendingChallengesCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 via-orange-500 via-green-500 to-teal-500 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="settings" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xl text-white/90">Beheer deelnemers en evenementen</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Beheer deelnemers, rally inzendingen en meer</p>
        </div>

        {/* Urgent Matters Alert Section */}
        {hasUrgentMatters && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="relative">
                  <Icon name="alert-triangle" className="w-10 h-10 text-red-600" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 mb-3">Directe Aandacht Vereist</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {urgent.emergencySOSCount > 0 && (
                    <Link
                      to="/admin/emergency-alerts"
                      className="bg-white border-2 border-red-300 rounded-lg p-4 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">Nood SOS</span>
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          {urgent.emergencySOSCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 group-hover:text-gray-900">Actieve noodoproepen</p>
                    </Link>
                  )}
                  {urgent.pendingChallengesCount > 0 && (
                    <Link
                      to="/admin/challenges"
                      className="bg-white border-2 border-orange-300 rounded-lg p-4 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-700">Route Challenges</span>
                        <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          {urgent.pendingChallengesCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 group-hover:text-gray-900">Wachten op goedkeuring</p>
                    </Link>
                  )}
                </div>

                {/* Recent SOS Alerts */}
                {urgent.recentSOS.length > 0 && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-red-200">
                    <h3 className="text-sm font-bold text-red-900 mb-2">Recente SOS Meldingen:</h3>
                    <div className="space-y-2">
                      {urgent.recentSOS.map((sos: any) => (
                        <div key={sos.id} className="flex items-center justify-between text-xs bg-red-50 rounded p-2">
                          <div>
                            <span className="font-medium text-gray-900">
                              {sos.participants?.first_name} {sos.participants?.last_name}
                            </span>
                            <span className="text-gray-500 ml-2">
                              {new Date(sos.created_at).toLocaleString('nl-BE', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sos.status === 'active' ? 'bg-red-100 text-red-700' :
                            sos.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {sos.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Deelnemers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalParticipants}</p>
              </div>
              <Icon name="users" className="w-10 h-10 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Betaald</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.paidParticipants}</p>
              </div>
              <Icon name="money" className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingecheckt</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.checkedInParticipants}</p>
              </div>
              <Icon name="check" className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal aantal submissions</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalCheckIns}</p>
              </div>
              <Icon name="check" className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* ===== ZEER URGENT - VEILIGHEID & DAGOPERATIE ===== */}
          
          {/* 1. Nood SOS - Hoogste prioriteit tijdens event */}
          <Link
            to="/admin/emergency-alerts"
            className={`rounded-sm shadow p-6 transition-all relative ${
              urgent.emergencySOSCount > 0
                ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 ring-2 ring-red-400 ring-offset-2'
                : 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800'
            }`}
          >
            {urgent.emergencySOSCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-red-500 text-white text-xs font-bold items-center justify-center">
                  {urgent.emergencySOSCount}
                </span>
              </span>
            )}
            <Icon name="alert-triangle" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Nood SOS</h3>
              {teasers.totalSOSCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.totalSOSCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">
              {urgent.emergencySOSCount > 0 ? `${urgent.emergencySOSCount} onbehandeld` : 'Alle meldingen behandeld'}
            </p>
          </Link>

          {/* 2. Check-in - Kern dagoperatie */}
          <Link
            to="/admin/check-in"
            className="bg-gradient-to-r from-lime-600 to-lime-800 hover:from-lime-700 hover:to-lime-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="check" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Check-in</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                {stats.checkedInParticipants}/{stats.totalParticipants}
              </span>
            </div>
            <p className="text-sm text-white/90 mt-1">Scan QR codes</p>
          </Link>

          {/* 3. Zone Control - Beheer zones tijdens event */}
          <Link
            to="/admin/zone-control"
            className="bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="target" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Zone Control</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                {teasers.openZonesCount}/{teasers.totalZonesCount}
              </span>
            </div>
            <p className="text-sm text-white/90 mt-1">Open/sluit zones</p>
          </Link>

          {/* 4. Manual Scan - Backup scanning methode */}
          <Link
            to="/admin/manual-scan"
            className="bg-gradient-to-r from-pink-600 to-pink-800 hover:from-pink-700 hover:to-pink-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="document" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Manual Scan</h3>
            <p className="text-sm text-white mt-1">Handmatig scannen</p>
          </Link>

          {/* 5. Event Dashboard - Real-time monitoring */}
          <Link
            to="/admin/event-dashboard"
            className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="activity" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Event Dashboard</h3>
            <p className="text-sm text-white mt-1">Real-time statistieken</p>
          </Link>

          {/* ===== MODERATIE & VALIDATIE ===== */}
          
          {/* 6. Manual Validatie - Scans controleren */}
          <Link
            to="/admin/pending-scans"
            className={`rounded-sm shadow p-6 transition-all relative ${
              teasers.pendingScansCount > 0
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900 ring-2 ring-cyan-400 ring-offset-2'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900'
            }`}
          >
            {teasers.pendingScansCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center">
                <span className="relative inline-flex rounded-full h-8 w-8 bg-cyan-500 text-white text-xs font-bold items-center justify-center">
                  {teasers.pendingScansCount}
                </span>
              </span>
            )}
            <Icon name="search" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Manual Validatie</h3>
              {teasers.pendingScansCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.pendingScansCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">Controleer scans</p>
          </Link>

          {/* 7. Fallback Review - Verifieer inzendingen */}
          <Link
            to="/admin/fallback-review"
            className={`rounded-sm shadow p-6 transition-all relative ${
              teasers.fallbackReviewCount > 0
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 ring-2 ring-slate-400 ring-offset-2'
                : 'bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900'
            }`}
          >
            {teasers.fallbackReviewCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center">
                <span className="relative inline-flex rounded-full h-8 w-8 bg-slate-500 text-white text-xs font-bold items-center justify-center">
                  {teasers.fallbackReviewCount}
                </span>
              </span>
            )}
            <Icon name="clipboard" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Fallback Review</h3>
              {teasers.fallbackReviewCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.fallbackReviewCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">Verifieer inzendingen</p>
          </Link>

          {/* 8. Route Challenges - Pending validatie */}
          <Link
            to="/admin/challenges"
            className={`rounded-sm shadow p-6 transition-all relative ${
              urgent.pendingChallengesCount > 0
                ? 'bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900 ring-2 ring-orange-400 ring-offset-2'
                : 'bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800'
            }`}
          >
            {urgent.pendingChallengesCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-orange-500 text-white text-xs font-bold items-center justify-center">
                  {urgent.pendingChallengesCount}
                </span>
              </span>
            )}
            <Icon name="check-square" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Route Challenges</h3>
              {teasers.totalChallengesCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.totalChallengesCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">
              {urgent.pendingChallengesCount > 0 ? `${urgent.pendingChallengesCount} te valideren` : 'Alle gevalideerd'}
            </p>
          </Link>

          {/* 9. Foto Goedkeuring - Photo review */}
          <Link
            to="/admin/gallery"
            className={`rounded-sm shadow p-6 transition-all relative ${
              teasers.pendingPhotosCount > 0
                ? 'bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 ring-2 ring-violet-400 ring-offset-2'
                : 'bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900'
            }`}
          >
            {teasers.pendingPhotosCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center">
                <span className="relative inline-flex rounded-full h-8 w-8 bg-violet-500 text-white text-xs font-bold items-center justify-center">
                  {teasers.pendingPhotosCount}
                </span>
              </span>
            )}
            <Icon name="camera" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Foto Goedkeuring</h3>
              {teasers.pendingPhotosCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.pendingPhotosCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">Review & featured</p>
          </Link>

          {/* 10. Ride Stories - Content moderatie */}
          <Link
            to="/admin/blog"
            className={`rounded-sm shadow p-6 transition-all relative ${
              teasers.pendingStoriesCount > 0
                ? 'bg-gradient-to-r from-orange-500 to-red-700 hover:from-orange-600 hover:to-red-800 ring-2 ring-orange-400 ring-offset-2'
                : 'bg-gradient-to-r from-orange-500 to-red-700 hover:from-orange-600 hover:to-red-800'
            }`}
          >
            {teasers.pendingStoriesCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center">
                <span className="relative inline-flex rounded-full h-8 w-8 bg-orange-500 text-white text-xs font-bold items-center justify-center">
                  {teasers.pendingStoriesCount}
                </span>
              </span>
            )}
            <Icon name="book-open" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Ride Stories</h3>
              {teasers.totalStoriesCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.totalStoriesCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">
              {teasers.pendingStoriesCount > 0 ? `${teasers.pendingStoriesCount} te modereren` : 'Alle gemodereerd'}
            </p>
          </Link>

          {/* ===== BEHEER & CONTENT ===== */}
          
          {/* 11. Event Markers - Map management */}
          <Link
            to="/admin/event-markers"
            className="bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="map" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Event Markers</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                {teasers.activeMarkersCount}/{teasers.totalMarkersCount}
              </span>
            </div>
            <p className="text-sm text-white/90 mt-1">Live map events</p>
          </Link>

          {/* 12. Deelnemers - Participant management */}
          <Link
            to="/admin/participants"
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="users" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Deelnemers</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                {stats.totalParticipants}
              </span>
            </div>
            <p className="text-sm text-white/90 mt-1">{stats.paidParticipants} betaald • {stats.checkedInParticipants} ingecheckt</p>
          </Link>

          {/* 13. Event Albums - Photo albums */}
          <Link
            to="/admin/photo-albums"
            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:via-indigo-800 hover:to-indigo-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="folder" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Event Albums</h3>
              {teasers.totalAlbumsCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.totalAlbumsCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">Albums per rally zone</p>
          </Link>

          {/* 14. Emergency Contacts - Noodcontacten & GPS */}
          <Link
            to="/admin/emergency-contact-dashboard"
            className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="phone" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Emergency Contacts</h3>
            <p className="text-sm text-white mt-1">Noodcontacten & GPS</p>
          </Link>

          {/* 15. Event Checklist - Voorbereiding & taken */}
          <Link
            to="/admin/event-checklist"
            className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="check-square" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Event Checklist</h3>
            <p className="text-sm text-white mt-1">Voorbereiding & taken</p>
          </Link>

          {/* ===== COMMUNICATIE & GAMIFICATION ===== */}
          
          {/* 16. Push Notifications - Communicatie */}
          <Link
            to="/admin/push-notifications"
            className="bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-700 hover:to-rose-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="bell" className="w-6 h-6 text-white mb-2" />
            <h3 className="font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-white mt-1">Templates, broadcast & targeted</p>
          </Link>

          {/* 17. Buddy Stats - Naftgenoten */}
          <Link
            to="/admin/buddy-stats"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="users" className="w-6 h-6 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Naftgenoten</h3>
              {teasers.activeBuddyGroupsCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.activeBuddyGroupsCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">Groepsformatie & insights</p>
          </Link>

          {/* 18. Achievements - Gamification */}
          <Link
            to="/admin/achievements"
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="award" className="w-6 h-6 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Achievements</h3>
              {teasers.totalAchievementsCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                  {teasers.totalAchievementsCount}
                </span>
              )}
            </div>
            <p className="text-sm text-white/90 mt-1">Beheer criteria</p>
          </Link>

          {/* ===== RAPPORTAGE & SYSTEEM ===== */}
          
          {/* 19. Financieel Rapport - Financial reporting */}
          <Link
            to="/admin/financial-report"
            className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="dollar-sign" className="w-8 h-8 text-white mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Financieel Rapport</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded">
                €{teasers.totalRevenue.toLocaleString('nl-BE')}
              </span>
            </div>
            <p className="text-sm text-white/90 mt-1">Inkomsten & betalingen</p>
          </Link>

          {/* 20. Settings - Admin gebruikers */}
          <Link
            to="/admin/settings"
            className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="settings" className="w-6 h-6 text-white mb-2" />
            <h3 className="font-semibold text-white">Settings</h3>
            <p className="text-sm text-white mt-1">Admin gebruikers</p>
          </Link>

          {/* 21. System Logs - Debug & monitoring */}
          <Link
            to="/admin/logs"
            className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-black rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="document-text" className="w-6 h-6 text-white mb-2" />
            <h3 className="font-semibold text-white">System Logs</h3>
            <p className="text-sm text-white mt-1">Debug & monitoring</p>
          </Link>

          {/* 22. Nieuwe Editie - Year rollover */}
          <Link
            to="/admin/prepare-edition"
            className="bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 rounded-sm shadow p-6 transition-colors border-2 border-yellow-400"
          >
            <Icon name="refresh" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Nieuwe Editie</h3>
            <p className="text-sm text-white mt-1">Volgend jaar voorbereiden</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Participants */}
          <div className="bg-white rounded-sm shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recente Inschrijvingen</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentParticipants.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Geen deelnemers gevonden</div>
              ) : (
                recentParticipants.map((participant: any) => (
                  <div key={participant.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {participant.first_name} {participant.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{participant.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {participant.payment_status === 'completed' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Betaald</span>
                        )}
                        {participant.checked_in && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Ingecheckt</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <Link to="/admin/participants" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Bekijk alle deelnemers →
              </Link>
            </div>
          </div>

          {/* Top Check-ins */}
          <div className="bg-white rounded-sm shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Top 10 Check-ins</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {topCheckIns.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Nog geen check-ins</div>
              ) : (
                topCheckIns.map((participant: any, index: number) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.first_name} {participant.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {participant.motorcycle_brand} {participant.motorcycle_model}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{participant.check_in_count}</p>
                        <p className="text-xs text-gray-500">zones bezocht</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* V1: my-day link removed - page doesn't exist
            <div className="p-4 border-t border-gray-200">
              <Link to="/my-day" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Bekijk rally geschiedenis →
              </Link>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
