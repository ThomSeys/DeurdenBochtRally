import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, redirect, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Leaderboard - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get rally zones with points from Sanity
  const rallyZones = await sanityClient.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      order,
      points,
      validAnswers
    }`
  );

  // Get all rally submissions with codes
  const { data: submissions } = await supabaseAdmin
    .from('rally_submissions')
    .select(`
      participant_id,
      rz1_code, rz2_code, rz3_code, rz4_code,
      rz5_code, rz6_code, rz7_code, rz8_code,
      participants!inner (
        id,
        first_name,
        last_name,
        email,
        motorcycle_brand,
        motorcycle_model,
        license_plate
      )
    `);

  // Get shadow scores for all participants
  const { data: shadowScores } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('participant_id, zone_id, shadow_score');

  // Calculate leaderboard
  const leaderboard = (submissions || []).map(submission => {
    let basicPoints = 0;
    let shadowTotal = 0;

    // Calculate basic points (correct answers)
    for (let i = 1; i <= 8; i++) {
      const code = submission[`rz${i}_code` as keyof typeof submission] as string | null;
      if (code) {
        const zone = rallyZones[i - 1];
        const isCorrect = zone?.validAnswers?.some((answer: string) => 
          answer.toLowerCase() === code.toLowerCase()
        );
        if (isCorrect && zone?.points) {
          basicPoints += zone.points;
        }
      }
    }

    // Calculate shadow score total
    const participantShadowScores = shadowScores?.filter(
      s => s.participant_id === submission.participant_id
    ) || [];
    shadowTotal = participantShadowScores.reduce((sum, s) => sum + (s.shadow_score || 0), 0);

    return {
      participant: submission.participants,
      basicPoints,
      shadowTotal,
      totalScore: basicPoints + shadowTotal
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  // Get participants without submissions
  const participantIds = submissions?.map(s => s.participant_id) || [];
  const { data: noScores } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email')
    .not('id', 'in', participantIds.length > 0 ? `(${participantIds.join(',')})` : '(null)');

  return { leaderboard, noScores: noScores || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[admin.leaderboard] action start');

  try {
    await requireAdmin(request);
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'recalculate') {
      const participantId = formData.get('participant_id') as string;
      
      await fetch(`${request.url.split('/admin')[0]}/api/shadow-recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });

      console.info('[admin.leaderboard] action success', { action, participantId });
      return redirect('/admin/leaderboard');
    }

    console.info('[admin.leaderboard] action success', { action: 'noop' });
    return null;
  } catch (error) {
    console.error('[admin.leaderboard] action error', error);
    return { error: 'Unexpected error' };
  }
}

export default function AdminLeaderboard() {
  const { leaderboard, noScores } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="trophy" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Scorebord</h1>
          <p className="text-xl text-primary-100">Live rally ranking en scores</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Leaderboard Beheer</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">
              {leaderboard.length} deelnemers met scores
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-sm shadow overflow-hidden mb-8">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 break-words">Klassement</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Positie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rally Punten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shadow Punten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, index: number) => (
                  <tr key={entry.participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <span className="text-2xl mr-2">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        ) : null}
                        <span className="text-sm font-semibold text-gray-900">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.participant.first_name} {entry.participant.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{entry.participant.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.participant.motorcycle_brand} {entry.participant.motorcycle_model}
                      </div>
                      <div className="text-sm text-gray-500">{entry.participant.license_plate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.basicPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.shadowTotal.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-primary-600">
                        {entry.totalScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-gray-400">-</span>
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Geen scores gevonden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Participants without scores */}
        {noScores.length > 0 && (
          <div className="bg-white rounded-sm shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Deelnemers zonder scores ({noScores.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {noScores.map((participant: any) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {participant.first_name} {participant.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{participant.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
