import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Mijn Voortgang - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get rally submission
  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', user.id)
    .single();

  // Get rally zones from Sanity
  const rallyZones = await sanityClient.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      order,
      points,
      zoneType,
      estimatedDistance,
      checkpoints[] {
        name,
        validAnswers
      }
    }`
  );

  // Get zone-level submissions with times
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('zone_id, checkpoint_number, submitted_answer, shadow_score, zone_time_minutes, entry_timestamp, answer_timestamp')
    .eq('participant_id', user.id)
    .order('zone_id', { ascending: true });

  // Calculate completed zones
  const completedZones: Record<number, any> = {};
  if (submission) {
    for (let i = 1; i <= 8; i++) {
      const code = (submission as any)[`rz${i}_code`];
      if (code && code.trim()) {
        const zoneSubmission = zoneSubmissions?.find(z => z.zone_id === i.toString());
        completedZones[i] = {
          code,
          time: zoneSubmission?.zone_time_minutes || null,
          shadowScore: zoneSubmission?.shadow_score || 0,
          timestamp: zoneSubmission?.answer_timestamp || null,
        };
      }
    }
  }

  // Get all submissions for leaderboard
  const { data: allSubmissions } = await supabaseAdmin
    .from('rally_submissions')
    .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code');

  // Get shadow scores
  const { data: shadowScores } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('participant_id, shadow_score');

  // Get achievement points
  const { data: achievementPoints } = await supabaseAdmin
    .from('participants')
    .select('id, total_achievement_points');

  // Calculate scores
  const scores = (allSubmissions || []).map(sub => {
    let basicPoints = 0;
    for (let i = 1; i <= 8; i++) {
      const code = (sub as any)[`rz${i}_code`];
      const zone = rallyZones[i - 1];
      const isCorrect = zone?.checkpoints?.some((cp: any) => 
        cp.validAnswers?.some((answer: string) => answer.toLowerCase() === code?.toLowerCase())
      );
      if (isCorrect && zone?.points) {
        basicPoints += zone.points;
      }
    }

    const participantShadowScores = shadowScores?.filter(s => s.participant_id === sub.participant_id) || [];
    const shadowTotal = participantShadowScores.reduce((sum, s) => sum + (s.shadow_score || 0), 0);
    const achievementTotal = achievementPoints?.find(a => a.id === sub.participant_id)?.total_achievement_points || 0;

    return {
      participant_id: sub.participant_id,
      basicPoints,
      shadowTotal,
      achievementTotal,
      totalScore: basicPoints + shadowTotal + achievementTotal,
    };
  });

  // Sort by total score
  const sortedScores = scores.sort((a, b) => b.totalScore - a.totalScore);
  const userRank = sortedScores.findIndex(s => s.participant_id === user.id) + 1;
  const userScore = sortedScores.find(s => s.participant_id === user.id);

  return { 
    user,
    submission,
    rallyZones,
    completedZones,
    userRank,
    totalParticipants: sortedScores.length,
    userScore,
  };
}

export default function Progress() {
  const { user, submission, rallyZones, completedZones, userRank, totalParticipants, userScore } = useLoaderData<typeof loader>();

  const completedCount = Object.keys(completedZones).length;
  const progressPercentage = (completedCount / 8) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="trending-up" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Mijn Voortgang</h1>
          <p className="text-xl text-primary-100">Volg je rally prestaties in real-time</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Zones Voltooid</p>
                <p className="text-3xl font-bold text-primary-600">{completedCount}/8</p>
              </div>
              <Icon name="map-pin" className="w-12 h-12 text-primary-200" />
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Huidige Positie</p>
                <p className="text-3xl font-bold text-primary-600">#{userRank || '-'}</p>
                <p className="text-xs text-gray-500">van {totalParticipants}</p>
              </div>
              <Icon name="trophy" className="w-12 h-12 text-primary-200" />
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Punten</p>
                <p className="text-3xl font-bold text-primary-600">{userScore?.totalScore.toFixed(0) || 0}</p>
              </div>
              <Icon name="star" className="w-12 h-12 text-primary-200" />
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Afstand</p>
                <p className="text-3xl font-bold text-primary-600">{submission?.total_distance || 0}</p>
                <p className="text-xs text-gray-500">km</p>
              </div>
              <Icon name="navigation" className="w-12 h-12 text-primary-200" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-sm shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rally Voortgang</h2>
          <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">
                {progressPercentage.toFixed(0)}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Points Breakdown */}
        {userScore && (
          <div className="bg-white rounded-sm shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Punten Overzicht</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Icon name="flag" className="w-6 h-6 text-blue-600" />
                  <span className="font-medium">Rally Punten (Basis)</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{userScore.basicPoints}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Icon name="eye" className="w-6 h-6 text-purple-600" />
                  <span className="font-medium">Shadow Rally Punten</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{userScore.shadowTotal.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Icon name="award" className="w-6 h-6 text-green-600" />
                  <span className="font-medium">Achievement Punten</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{userScore.achievementTotal}</span>
              </div>
              <div className="flex items-center justify-between py-4 bg-primary-50 -mx-6 px-6">
                <span className="text-lg font-bold">Totaal</span>
                <span className="text-3xl font-bold text-primary-600">{userScore.totalScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Zone Checklist */}
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-900">Rally Zones</h2>
          </div>
          <div className="divide-y">
            {rallyZones.map((zone: any) => {
              const isCompleted = !!completedZones[zone.order];
              const zoneData = completedZones[zone.order];
              
              return (
                <div 
                  key={zone._id}
                  className={`p-6 transition-colors ${isCompleted ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {isCompleted ? (
                          <Icon name="check" className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-lg font-bold text-gray-600">{zone.order}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{zone.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Icon name="map" className="w-4 h-4" />
                            {zone.estimatedDistance} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="star" className="w-4 h-4" />
                            {zone.points} punten
                          </span>
                          {zoneData?.time && (
                            <span className="flex items-center gap-1">
                              <Icon name="clock" className="w-4 h-4" />
                              {zoneData.time} min
                            </span>
                          )}
                        </div>
                        {zoneData?.shadowScore !== undefined && (
                          <div className="mt-2">
                            <span className="text-sm text-purple-600 font-medium">
                              Shadow Score: {zoneData.shadowScore.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Voltooid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                          Wachten
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            to="/dashboard/rally-submission"
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-semibold text-center transition-colors"
          >
            Codes Indienen
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm font-semibold text-center transition-colors"
          >
            Terug naar Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
