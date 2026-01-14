import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Admin Dashboard - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
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

  const { count: totalSubmissions } = await supabaseAdmin
    .from('rally_submissions')
    .select('*', { count: 'exact', head: true })
    .not('submitted_at', 'is', null);

  // Get recent participants
  const { data: recentParticipants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, created_at, payment_status, checked_in')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get top scorers
  const { data: topScorers } = await supabaseAdmin
    .from('rally_submissions')
    .select(`
      final_score,
      total_points,
      shadow_total,
      participants!inner (
        first_name,
        last_name,
        motorcycle_brand,
        motorcycle_model
      )
    `)
    .not('final_score', 'is', null)
    .order('final_score', { ascending: false })
    .limit(10);

  return {
    stats: {
      totalParticipants: totalParticipants || 0,
      paidParticipants: paidParticipants || 0,
      checkedInParticipants: checkedInParticipants || 0,
      totalSubmissions: totalSubmissions || 0,
    },
    recentParticipants: recentParticipants || [],
    topScorers: topScorers || [],
  };
}

export default function AdminDashboard() {
  const { stats, recentParticipants, topScorers } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Beheer deelnemers, rally inzendingen en meer</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Deelnemers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalParticipants}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Betaald</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.paidParticipants}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingecheckt</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.checkedInParticipants}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rally Inzendingen</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">{stats.totalSubmissions}</p>
              </div>
              <div className="text-4xl">🏁</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            to="/admin/participants"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-900">Deelnemers</h3>
            <p className="text-sm text-gray-600 mt-1">Beheer alle deelnemers</p>
          </Link>

          <Link
            to="/admin/submissions"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">Inzendingen</h3>
            <p className="text-sm text-gray-600 mt-1">Bekijk rally codes</p>
          </Link>

          <Link
            to="/admin/check-in"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-gray-900">Check-in</h3>
            <p className="text-sm text-gray-600 mt-1">Scan QR codes</p>
          </Link>

          <Link
            to="/admin/leaderboard"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold text-gray-900">Klassement</h3>
            <p className="text-sm text-gray-600 mt-1">Live scoreboard</p>
          </Link>

          <Link
            to="/admin/pending-scans"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors border-2 border-yellow-400"
          >
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-gray-900">Manual Validatie</h3>
            <p className="text-sm text-gray-600 mt-1">Controleer scans</p>
          </Link>

          <Link
            to="/admin/zone-control"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors border-2 border-red-400"
          >
            <div className="text-2xl mb-2">🚦</div>
            <h3 className="font-semibold text-gray-900">Zone Control</h3>
            <p className="text-sm text-gray-600 mt-1">Open/sluit zones</p>
          </Link>

          <Link
            to="/admin/manual-scan"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors border-2 border-blue-400"
          >
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">Manual Scan</h3>
            <p className="text-sm text-gray-600 mt-1">Telefoon dood</p>
          </Link>

          <Link
            to="/admin/event-markers"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors border-2 border-green-400"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="font-semibold text-gray-900">Event Markers</h3>
            <p className="text-sm text-gray-600 mt-1">Live map events</p>
          </Link>

          <Link
            to="/admin/settings"
            className="bg-white hover:bg-gray-50 rounded-sm shadow p-6 transition-colors"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-900">Instellingen</h3>
            <p className="text-sm text-gray-600 mt-1">Admin gebruikers</p>
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

          {/* Top Scorers */}
          <div className="bg-white rounded-sm shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Top 10 Klassement</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {topScorers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Nog geen inzendingen</div>
              ) : (
                topScorers.map((scorer: any, index: number) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {scorer.participants.first_name} {scorer.participants.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {scorer.participants.motorcycle_brand} {scorer.participants.motorcycle_model}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{scorer.final_score?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{scorer.total_points} pts + {scorer.shadow_total?.toFixed(0)} shadow</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <Link to="/admin/leaderboard" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Bekijk volledig klassement →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
