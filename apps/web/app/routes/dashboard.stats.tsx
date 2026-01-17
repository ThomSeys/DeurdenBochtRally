import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Mijn Statistieken - Deur Den Bocht' },
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

  // Get zone-level submissions with full details
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('*')
    .eq('participant_id', user.id)
    .order('zone_id', { ascending: true });

  // Get achievements
  const { data: achievements } = await supabaseAdmin
    .from('participant_achievements')
    .select(`
      *,
      achievement:achievement_id (
        id,
        name,
        description,
        category,
        points,
        icon
      )
    `)
    .eq('participant_id', user.id)
    .order('unlocked_at', { ascending: false });

  // Calculate zone statistics
  let totalZoneTime = 0;
  let completedZonesCount = 0;
  let totalShadowScore = 0;
  let totalRhythmScore = 0;
  let totalViewScore = 0;

  const zoneStats: Record<number, any> = {};

  if (zoneSubmissions) {
    for (const zone of zoneSubmissions) {
      if (zone.zone_time_minutes) {
        totalZoneTime += zone.zone_time_minutes;
        completedZonesCount++;
      }
      
      totalShadowScore += zone.shadow_score || 0;
      totalRhythmScore += zone.rhythm_score || 0;
      totalViewScore += zone.view_score || 0;

      const zoneId = Number(zone.zone_id);
      if (!zoneStats[zoneId]) {
        zoneStats[zoneId] = {
          time: 0,
          checkpoints: 0,
          shadowScore: 0,
          rhythmScore: 0,
          viewScore: 0,
        };
      }

      zoneStats[zoneId].time += zone.zone_time_minutes || 0;
      zoneStats[zoneId].checkpoints += 1;
      zoneStats[zoneId].shadowScore += zone.shadow_score || 0;
      zoneStats[zoneId].rhythmScore += zone.rhythm_score || 0;
      zoneStats[zoneId].viewScore += zone.view_score || 0;
    }
  }

  const avgZoneTime = completedZonesCount > 0 ? totalZoneTime / completedZonesCount : 0;

  // Get rally zones info
  const rallyZones = await sanityClient.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      order,
      points,
      estimatedDistance
    }`
  );

  // Achievement statistics
  const achievementsByCategory = achievements?.reduce((acc: any, a: any) => {
    const category = a.achievement?.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(a);
    return acc;
  }, {}) || {};

  const totalAchievementPoints = achievements?.reduce((sum: number, a: any) => 
    sum + (a.achievement?.points || 0), 0
  ) || 0;

  return { 
    user,
    submission,
    zoneSubmissions,
    achievements,
    achievementsByCategory,
    totalAchievementPoints,
    stats: {
      totalDistance: submission?.total_distance || 0,
      startKm: submission?.start_km || 0,
      endKm: submission?.end_km || 0,
      totalZoneTime,
      avgZoneTime,
      completedZonesCount,
      totalShadowScore,
      totalRhythmScore,
      totalViewScore,
      zoneStats,
    },
    rallyZones,
  };
}

export default function Stats() {
  const { user, submission, achievements, achievementsByCategory, totalAchievementPoints, stats, rallyZones } = useLoaderData<typeof loader>();

  const categoryColors: Record<string, string> = {
    participation: 'bg-blue-100 text-blue-800',
    completion: 'bg-green-100 text-green-800',
    speed: 'bg-yellow-100 text-yellow-800',
    exploration: 'bg-purple-100 text-purple-800',
    social: 'bg-pink-100 text-pink-800',
    special: 'bg-orange-100 text-orange-800',
  };

  const categoryIcons: Record<string, string> = {
    participation: 'user-check',
    completion: 'check-circle',
    speed: 'zap',
    exploration: 'compass',
    social: 'users',
    special: 'star',
  };

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
            <Icon name="bar-chart" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Mijn Statistieken</h1>
          <p className="text-xl text-primary-100">Gedetailleerde analyse van je rally prestaties</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Distance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Totale Afstand</h3>
              <Icon name="navigation" className="w-8 h-8 text-primary-200" />
            </div>
            <p className="text-4xl font-bold text-primary-600">{stats.totalDistance}</p>
            <p className="text-sm text-gray-500 mt-1">kilometers</p>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Start Km-stand</h3>
              <Icon name="play" className="w-8 h-8 text-green-200" />
            </div>
            <p className="text-4xl font-bold text-green-600">{stats.startKm}</p>
            <p className="text-sm text-gray-500 mt-1">km</p>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Eind Km-stand</h3>
              <Icon name="square" className="w-8 h-8 text-red-200" />
            </div>
            <p className="text-4xl font-bold text-red-600">{stats.endKm}</p>
            <p className="text-sm text-gray-500 mt-1">km</p>
          </div>
        </div>

        {/* Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Totale Zone Tijd</h3>
              <Icon name="clock" className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-4xl font-bold text-blue-600">{Math.round(stats.totalZoneTime)}</p>
            <p className="text-sm text-gray-500 mt-1">minuten</p>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Gemiddelde Zone Tijd</h3>
              <Icon name="activity" className="w-8 h-8 text-purple-200" />
            </div>
            <p className="text-4xl font-bold text-purple-600">{Math.round(stats.avgZoneTime)}</p>
            <p className="text-sm text-gray-500 mt-1">minuten per zone</p>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Zones Voltooid</h3>
              <Icon name="check-circle" className="w-8 h-8 text-green-200" />
            </div>
            <p className="text-4xl font-bold text-green-600">{stats.completedZonesCount}</p>
            <p className="text-sm text-gray-500 mt-1">van 8 zones</p>
          </div>
        </div>

        {/* Shadow Rally Breakdown */}
        <div className="bg-white rounded-sm shadow mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-900">Shadow Rally Analyse</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-sm">
                <p className="text-sm text-gray-600 mb-1">Totaal Shadow Score</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalShadowScore.toFixed(1)}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-sm">
                <p className="text-sm text-gray-600 mb-1">Ritme Score</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRhythmScore.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">Timing consistentie</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-sm">
                <p className="text-sm text-gray-600 mb-1">Vision Score</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalViewScore.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">Antwoord creativiteit</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Zone</h3>
              <div className="space-y-3">
                {Object.entries(stats.zoneStats).map(([zoneId, data]: [string, any]) => {
                  const zone = rallyZones.find((z: any) => z.order === parseInt(zoneId));
                  return (
                    <div key={zoneId} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                          {zoneId}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{zone?.title || `Zone ${zoneId}`}</p>
                          <p className="text-sm text-gray-600">{data.time} min • {data.checkpoints} checkpoint(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{data.shadowScore.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">shadow score</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Progress */}
        <div className="bg-white rounded-sm shadow">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">{achievements?.length || 0}</p>
                <p className="text-sm text-gray-600">ontgrendeld</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-sm border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="award" className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Totaal Achievement Punten</p>
                    <p className="text-sm text-gray-600">Bonus punten verdiend via achievements</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{totalAchievementPoints}</p>
              </div>
            </div>

            {Object.keys(achievementsByCategory).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(achievementsByCategory).map(([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize flex items-center gap-2">
                      <Icon name={categoryIcons[category] || 'star'} className="w-5 h-5" />
                      {category}
                      <span className="text-sm font-normal text-gray-500">({items.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((a: any) => (
                        <div key={a.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-sm border border-gray-200">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
                            <Icon name={a.achievement?.icon || 'award'} className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{a.achievement?.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{a.achievement?.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500">
                                {new Date(a.unlocked_at).toLocaleDateString('nl-BE')}
                              </span>
                              <span className="text-sm font-bold text-primary-600">
                                +{a.achievement?.points} punten
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Icon name="award" className="w-16 h-16 text-gray-300 mb-4" />
                <p>Je hebt nog geen achievements ontgrendeld</p>
                <p className="text-sm mt-2">Blijf deelnemen om achievements te verdienen!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            to="/dashboard/progress"
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-semibold text-center transition-colors"
          >
            Bekijk Voortgang
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
