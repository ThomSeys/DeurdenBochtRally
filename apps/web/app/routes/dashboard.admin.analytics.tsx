import { useState } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin, supabase } from '~/lib/supabase.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Analytics - Admin - Deur Den Bocht' },
  ];
};

interface AnalyticsData {
  overview: {
    totalParticipants: number;
    activeParticipants: number;
    totalCheckpoints: number;
    totalPhotos: number;
    totalStories: number;
    totalAchievements: number;
  };
  participation: {
    hourly: Array<{ hour: string; count: number }>;
    daily: Array<{ date: string; count: number }>;
    checkpointCompletion: Array<{ checkpoint: string; completions: number; percentage: number }>;
  };
  zoneHeatmap: Array<{
    zoneId: number;
    zoneName: string;
    completions: number;
    avgTimeMinutes: number;
  }>;
  engagement: {
    photosPerParticipant: number;
    storiesPerParticipant: number;
    achievementsPerParticipant: number;
    topPhotographers: Array<{ name: string; count: number }>;
    topStoryTellers: Array<{ name: string; count: number }>;
  };
  routes: {
    popularRoutes: Array<{
      routeSequence: string[];
      count: number;
      percentage: number;
    }>;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Verify admin access
  const { data: participant } = await supabase
    .from('participants')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (!participant || !participant.is_admin) {
    throw new Response('Unauthorized', { status: 403 });
  }

  // Get overview statistics
  const [
    { count: totalParticipants },
    { count: activeParticipants },
    { count: totalCheckpoints },
    { count: totalPhotos },
    { count: totalStories },
    { data: achievements },
  ] = await Promise.all([
    supabaseAdmin.from('participants').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('rally_zone_submissions')
      .select('participant_id', { count: 'exact', head: true })
      .gte('entry_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabaseAdmin.from('rally_zone_submissions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('rally_zone_submissions').select('*', { count: 'exact', head: true }).not('proof_photo_url', 'is', null),
    supabaseAdmin.from('participant_photos').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('achievements').select('id'),
  ]);

  // Calculate total achievements unlocked
  const totalAchievements = achievements?.length || 0;

  // Get hourly participation pattern (last 24 hours)
  const { data: hourlyData } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('entry_timestamp')
    .gte('entry_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('entry_timestamp', { ascending: true });

  const hourlyMap = new Map<number, number>();
  hourlyData?.forEach((checkin) => {
    const hour = new Date(checkin.entry_timestamp).getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  });

  const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: hourlyMap.get(i) || 0,
  }));

  // Get daily participation (last 7 days)
  const { data: dailyData } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('entry_timestamp')
    .gte('entry_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('entry_timestamp', { ascending: true });

  const dailyMap = new Map<string, number>();
  dailyData?.forEach((checkin) => {
    const date = new Date(checkin.entry_timestamp).toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const dailyStats = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr,
      count: dailyMap.get(dateStr) || 0,
    };
  });

  // Get checkpoint completion stats
  const { data: checkpointData } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('checkpoint_number')
    .order('checkpoint_number', { ascending: true });

  const checkpointMap = new Map<number, number>();
  checkpointData?.forEach((checkin) => {
    const cp = checkin.checkpoint_number;
    checkpointMap.set(cp, (checkpointMap.get(cp) || 0) + 1);
  });

  const checkpointStats = Array.from(checkpointMap.entries())
    .map(([checkpoint, count]) => ({
      checkpoint: `CP ${checkpoint}`,
      completions: count,
      percentage: totalParticipants ? Math.round((count / (totalParticipants || 1)) * 100) : 0,
    }))
    .sort((a, b) => {
      const numA = parseInt(a.checkpoint.replace('CP ', ''));
      const numB = parseInt(b.checkpoint.replace('CP ', ''));
      return numA - numB;
    });

  // Get zone heatmap
  const { data: zoneData } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('zone_id, zone_time_minutes')
    .not('zone_time_minutes', 'is', null);

  const zoneMap = new Map<string, { name: string; completions: number; totalTime: number }>();
  zoneData?.forEach((submission: any) => {
    const existing = zoneMap.get(submission.zone_id) || {
      name: `Zone ${submission.zone_id}`,
      completions: 0,
      totalTime: 0,
    };
    existing.completions++;
    existing.totalTime += submission.zone_time_minutes || 0;
    zoneMap.set(submission.zone_id, existing);
  });

  const zoneHeatmap = Array.from(zoneMap.entries())
    .map(([zoneId, data]) => ({
      zoneId,
      zoneName: data.name,
      completions: data.completions,
      avgTimeMinutes: Math.round(data.totalTime / data.completions),
    }))
    .sort((a, b) => b.completions - a.completions);

  // Get engagement metrics
  const { data: photoStats } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('participant_id, participants(first_name, last_name)')
    .not('proof_photo_url', 'is', null)
    .order('participant_id');

  const photoCountMap = new Map<string, { name: string; count: number }>();
  photoStats?.forEach((photo: any) => {
    const existing = photoCountMap.get(photo.participant_id) || {
      name: photo.participants ? `${photo.participants.first_name} ${photo.participants.last_name}` : 'Unknown',
      count: 0,
    };
    existing.count++;
    photoCountMap.set(photo.participant_id, existing);
  });

  const topPhotographers = Array.from(photoCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const { data: storyStats } = await supabaseAdmin
    .from('participant_photos')
    .select('participant_id, participants(first_name, last_name)')
    .order('participant_id');

  const storyCountMap = new Map<string, { name: string; count: number }>();
  storyStats?.forEach((story: any) => {
    const existing = storyCountMap.get(story.participant_id) || {
      name: story.participants ? `${story.participants.first_name} ${story.participants.last_name}` : 'Unknown',
      count: 0,
    };
    existing.count++;
    storyCountMap.set(story.participant_id, existing);
  });

  const topStoryTellers = Array.from(storyCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const analyticsData: AnalyticsData = {
    overview: {
      totalParticipants: totalParticipants || 0,
      activeParticipants: activeParticipants || 0,
      totalCheckpoints: totalCheckpoints || 0,
      totalPhotos: totalPhotos || 0,
      totalStories: totalStories || 0,
      totalAchievements,
    },
    participation: {
      hourly: hourlyStats,
      daily: dailyStats,
      checkpointCompletion: checkpointStats,
    },
    zoneHeatmap,
    engagement: {
      photosPerParticipant:
        totalParticipants && totalPhotos
          ? Math.round((totalPhotos / totalParticipants) * 10) / 10
          : 0,
      storiesPerParticipant:
        totalParticipants && totalStories
          ? Math.round((totalStories / totalParticipants) * 10) / 10
          : 0,
      achievementsPerParticipant:
        totalParticipants && totalAchievements
          ? Math.round((totalAchievements / totalParticipants) * 10) / 10
          : 0,
      topPhotographers,
      topStoryTellers,
    },
    routes: {
      popularRoutes: [],
    },
  };

  return { analytics: analyticsData };
}

export default function AnalyticsDashboard() {
  const { analytics } = useLoaderData<typeof loader>();
  const [timeRange, setTimeRange] = useState<'hourly' | 'daily'>('hourly');

  const participationData =
    timeRange === 'hourly' ? analytics.participation.hourly : analytics.participation.daily;

  const maxCount = Math.max(...participationData.map((d) => d.count), 1);

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
            <Icon name="bar-chart" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-xl text-primary-100">Real-time event performance metrics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Statistieken en prestatie-indicatoren</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors shadow"
          >
            <Icon name="download" className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics.overview.totalParticipants}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Icon name="users" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.overview.activeParticipants} active in last 24h
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Check-ins</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics.overview.totalCheckpoints}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Icon name="map-pin" className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.participation.checkpointCompletion.length} checkpoints active
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Photos Submitted</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics.overview.totalPhotos}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Icon name="camera" className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.engagement.photosPerParticipant} per participant avg
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stories Shared</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics.overview.totalStories}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Icon name="book-open" className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.engagement.storiesPerParticipant} per participant avg
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics.overview.totalAchievements}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Icon name="award" className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.engagement.achievementsPerParticipant} per participant avg
            </p>
          </div>
        </div>

        {/* Participation Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Participation Pattern</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('hourly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'hourly'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setTimeRange('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'daily'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                7 Days
              </button>
            </div>
          </div>

          {/* Graph */}
          <div className="relative h-80">
            <svg className="w-full h-full" viewBox="0 0 800 320" preserveAspectRatio="none">
              {/* Grid lines */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = (i * 320) / 4;
                return (
                  <g key={i}>
                    <line
                      x1="0"
                      y1={y}
                      x2="800"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="0"
                      y={y - 4}
                      fill="#9ca3af"
                      fontSize="12"
                      fontFamily="system-ui"
                    >
                      {Math.round(maxCount - (i * maxCount) / 4)}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {participationData.length > 0 && (
                <path
                  d={`
                    M 0,320
                    ${participationData
                      .map((d, i) => {
                        const x = (i * 800) / Math.max(participationData.length - 1, 1);
                        const y = 320 - (d.count / maxCount) * 300;
                        return `L ${x},${y}`;
                      })
                      .join(' ')}
                    L 800,320 Z
                  `}
                  fill="url(#areaGradient)"
                />
              )}

              {/* Line */}
              {participationData.length > 0 && (
                <path
                  d={participationData
                    .map((d, i) => {
                      const x = (i * 800) / Math.max(participationData.length - 1, 1);
                      const y = 320 - (d.count / maxCount) * 300;
                      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {participationData.map((d, i) => {
                const x = (i * 800) / Math.max(participationData.length - 1, 1);
                const y = 320 - (d.count / maxCount) * 300;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="white"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="3"
                      className="hover:r-7 transition-all cursor-pointer"
                    />
                    <title>
                      {timeRange === 'hourly' ? `${d.hour}:00` : d.date}: {d.count} check-ins
                    </title>
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-4 px-2">
              {participationData
                .filter((_, i) => {
                  // Show fewer labels on mobile
                  const step = participationData.length > 12 ? 3 : 2;
                  return i % step === 0 || i === participationData.length - 1;
                })
                .map((d, i) => (
                  <span key={i} className="text-xs text-gray-600">
                    {timeRange === 'hourly' ? `${d.hour}:00` : d.date.split('-').slice(1).join('/')}
                  </span>
                ))}
            </div>
          </div>

          {/* Stats below graph */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Check-ins</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {participationData.reduce((sum, d) => sum + d.count, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round(
                  participationData.reduce((sum, d) => sum + d.count, 0) /
                    Math.max(participationData.length, 1)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Peak</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{maxCount}</p>
            </div>
          </div>
        </div>

        {/* Checkpoint Completion & Zone Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checkpoint Completion */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Checkpoint Completion</h2>
            <div className="space-y-3">
              {analytics.participation.checkpointCompletion.map((cp) => (
                <div key={cp.checkpoint}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{cp.checkpoint}</span>
                    <span className="text-gray-600">
                      {cp.completions} ({cp.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${cp.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Heatmap */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Zone Heatmap</h2>
            <div className="space-y-3">
              {analytics.zoneHeatmap.slice(0, 10).map((zone) => (
                <div key={zone.zoneId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{zone.zoneName}</span>
                      <span className="text-gray-600">
                        {zone.completions} completions
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{
                          width: `${Math.min(
                            (zone.completions / analytics.zoneHeatmap[0]?.completions) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 ml-4 whitespace-nowrap">
                    {zone.avgTimeMinutes}min avg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Photographers */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Photographers</h2>
            <div className="space-y-3">
              {analytics.engagement.topPhotographers.map((photographer, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{photographer.name}</p>
                    <p className="text-sm text-gray-600">{photographer.count} photos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Story Tellers */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Story Tellers</h2>
            <div className="space-y-3">
              {analytics.engagement.topStoryTellers.map((teller, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{teller.name}</p>
                    <p className="text-sm text-gray-600">{teller.count} stories</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
