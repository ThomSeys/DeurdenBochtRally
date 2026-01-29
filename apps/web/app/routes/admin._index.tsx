import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Admin Dashboard - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get urgent counts (Concept B: check-ins don't need verification)
  const { count: checkInsCount, error: checkInsError } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*', { count: 'exact', head: true });


  const { count: emergencySOSCount, error: sosCountError } = await supabaseAdmin
    .from('emergency_sos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get recent SOS alerts
  const { data: recentSOS, error: sosError } = await supabaseAdmin
    .from('emergency_sos')
    .select('*, participants(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('[admin dashboard] Urgent counts:', {
    emergencySOSCount,
    recentSOSCount: recentSOS?.length || 0,
    recentSOSDetails: recentSOS,
    errors: { sosCountError, sosError }
  });

  // Get statistics
  const { count: totalParticipants } = await supabaseAdmin
    .from('participants')
    .select('*', { count: 'exact', head: true });

  const { count: paidParticipants } = await supabaseAdmin
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'completed');

  const { count: checkedInParticipants } = await supabaseAdmin
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('checked_in', true);

  const { count: totalCheckIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*', { count: 'exact', head: true });

  // Get recent participants
  const { data: recentParticipants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, created_at, payment_status, checked_in')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get top participants by check-in count (Concept B: simple presence tracking)
  const { data: checkInCounts } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('participant_id, participants(first_name, last_name, motorcycle_brand, motorcycle_model)')
    .eq('action', 'CHECKIN');

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
      recentSOS: recentSOS || [],
    },
    stats: {
      totalParticipants: totalParticipants || 0,
      paidParticipants: paidParticipants || 0,
      checkedInParticipants: checkedInParticipants || 0,
      totalCheckIns: totalCheckIns || 0,
    },
    recentParticipants: recentParticipants || [],
    topCheckIns: topCheckIns || [],
  };
}

export default function AdminDashboard() {
  const { urgent, stats, recentParticipants, topCheckIns } = useLoaderData<typeof loader>();

  const hasUrgentMatters = urgent.emergencySOSCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="settings" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xl text-primary-100">Beheer deelnemers en evenementen</p>
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
                <h2 className="text-xl font-bold text-red-900 mb-3">⚠️ Directe Aandacht Vereist</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {urgent.emergencySOSCount > 0 && (
                    <Link
                      to="/admin/emergency-alerts"
                      className="bg-white border-2 border-red-300 rounded-lg p-4 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">🚨 Nood SOS</span>
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          {urgent.emergencySOSCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 group-hover:text-gray-900">Actieve noodoproepen</p>
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
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Priority Actions - Show with badges if urgent */}
          <Link
            to="/admin/emergency-alerts"
            className={`rounded-sm shadow p-6 transition-all relative ${
              urgent.emergencySOSCount > 0
                ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 ring-2 ring-red-400 ring-offset-2'
                : 'bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50'
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
            <h3 className="font-semibold text-white">Nood SOS</h3>
            <p className="text-sm text-white mt-1">
              {urgent.emergencySOSCount > 0 ? `${urgent.emergencySOSCount} actieve oproepen` : 'Bekijk noodoproepen'}
            </p>
          </Link>

          <Link
            to="/admin/pending-scans"
              className={`rounded-sm shadow p-6 transition-all relative ${
                'bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50'
            }`}
          >
            <Icon name="search" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Manual Validatie</h3>
            <p className="text-sm text-white mt-1">
              {'Controleer scans'}
            </p>
          </Link>

          <Link
            to="/admin/fallback-review"
            className={`rounded-sm shadow p-6 transition-all relative ${
              
              'bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50'
            }`}
          >
            
            <Icon name="clipboard" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Fallback Review</h3>
            <p className="text-sm text-white mt-1">
              {'Verifieer inzendingen'}
            </p>
          </Link>

          <Link
            to="/admin/event-markers"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="map" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Event Markers</h3>
            <p className="text-sm text-white mt-1">Live map events</p>
          </Link>

          <Link
            to="/admin/participants"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="users" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Deelnemers</h3>
            <p className="text-sm text-white mt-1">Beheer alle deelnemers</p>
          </Link>

          {/* <Link
            to="/admin/submissions"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="document" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Inzendingen</h3>
            <p className="text-sm text-white mt-1">Bekijk rally codes</p>
          </Link> */}

          <Link
            to="/admin/check-in"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="check" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Check-in</h3>
            <p className="text-sm text-white mt-1">Scan QR codes</p>
          </Link>

          <Link
            to="/admin/zone-control"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="target" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Zone Control</h3>
            <p className="text-sm text-white mt-1">Open/sluit zones</p>
          </Link>

          <Link
            to="/admin/manual-scan"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="document" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Manual Scan</h3>
            <p className="text-sm text-white mt-1">Telefoon dood</p>
          </Link>

          <Link
            to="/admin/gallery"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="camera" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Fotogalerij</h3>
            <p className="text-sm text-white mt-1">Beheer foto's</p>
          </Link>

          <Link
            to="/admin/blog"
            className="bg-gradient-to-r from-orange-500 to-red-700 hover:from-orange-600 hover:to-red-800 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="book-open" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Ride Stories</h3>
            <p className="text-sm text-white mt-1">Modereer verhalen</p>
          </Link>

          <Link
            to="/admin/push-notifications"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="bell" className="w-6 h-6 text-white mb-2" />
            <h3 className="font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-white mt-1">Templates, broadcast & targeted</p>
          </Link>


          {/* V1: Reports page not implemented
          <Link
            to="/admin/reports"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="file-text" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Rapporten</h3>
            <p className="text-sm text-white mt-1">Genereer en beheer rapporten</p>
          </Link>
          */}

          {/* V1: Analytics page not implemented
          <Link
            to="/admin/analytics"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="bar-chart" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Analytics</h3>
            <p className="text-sm text-white mt-1">Statistieken en grafieken</p>
          </Link>
          */}

          <Link
            to="/admin/settings"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <Icon name="settings" className="w-6 h-6 text-white mb-2" />
            <h3 className="font-semibold text-white">Settings</h3>
            <p className="text-sm text-white mt-1">Admin gebruikers</p>
          </Link>

          <Link
            to="/admin/prepare-edition"
            className="bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 rounded-sm shadow p-6 transition-colors border-2 border-yellow-400"
          >
            <Icon name="refresh" className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Nieuwe Editie</h3>
            <p className="text-sm text-white mt-1">Maak klaar voor volgend jaar</p>
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
