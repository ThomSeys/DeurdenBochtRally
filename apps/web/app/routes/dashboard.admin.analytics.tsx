import { useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { Icon } from '~/components/Icon';

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
    .select('role')
    .eq('user_id', userId)
    .single();

  if (!participant || participant.role !== 'admin') {
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
    supabase.from('participants').select('*', { count: 'exact', head: true }),
    supabase
      .from('checkins')
      .select('participant_id', { count: 'exact', head: true })
      .gte('checked_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('checkins').select('*', { count: 'exact', head: true }),
    supabase.from('rally_photo_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('ride_stories').select('*', { count: 'exact', head: true }).catch(() => ({ data: [], count: 0 })),
    supabase.from('achievements').select('participants').catch(() => ({ data: [] })),
  ]);

  // Calculate total achievements unlocked
  const totalAchievements = achievements?.reduce((sum, achievement) => {
    return sum + (achievement.participants?.length || 0);
  }, 0) || 0;

  // Get hourly participation pattern (last 24 hours)
  const { data: hourlyData } = await supabase
    .from('checkins')
    .select('checked_in_at')
    .gte('checked_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('checked_in_at', { ascending: true });

  const hourlyMap = new Map<number, number>();
  hourlyData?.forEach((checkin) => {
    const hour = new Date(checkin.checked_in_at).getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  });

  const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: hourlyMap.get(i) || 0,
  }));

  // Get daily participation (last 7 days)
  const { data: dailyData } = await supabase
    .from('checkins')
    .select('checked_in_at')
    .gte('checked_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('checked_in_at', { ascending: true });

  const dailyMap = new Map<string, number>();
  dailyData?.forEach((checkin) => {
    const date = new Date(checkin.checked_in_at).toISOString().split('T')[0];
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
  const { data: checkpointData } = await supabase
    .from('checkins')
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
  const { data: zoneData } = await supabase
    .from('rally_submissions')
    .select('zone_id, completion_time_seconds, rally_zones(name)')
    .not('completion_time_seconds', 'is', null);

  const zoneMap = new Map<number, { name: string; completions: number; totalTime: number }>();
  zoneData?.forEach((submission: any) => {
    const existing = zoneMap.get(submission.zone_id) || {
      name: submission.rally_zones?.name || `Zone ${submission.zone_id}`,
      completions: 0,
      totalTime: 0,
    };
    existing.completions++;
    existing.totalTime += submission.completion_time_seconds || 0;
    zoneMap.set(submission.zone_id, existing);
  });

  const zoneHeatmap = Array.from(zoneMap.entries())
    .map(([zoneId, data]) => ({
      zoneId,
      zoneName: data.name,
      completions: data.completions,
      avgTimeMinutes: Math.round(data.totalTime / data.completions / 60),
    }))
    .sort((a, b) => b.completions - a.completions);

  // Get engagement metrics
  const { data: photoStats } = await supabase
    .from('rally_photo_submissions')
    .select('participant_id, participants(name)')
    .order('participant_id');

  const photoCountMap = new Map<number, { name: string; count: number }>();
  photoStats?.forEach((photo: any) => {
    const existing = photoCountMap.get(photo.participant_id) || {
      name: photo.participants?.name || 'Unknown',
      count: 0,
    };
    existing.count++;
    photoCountMap.set(photo.participant_id, existing);
  });

  const topPhotographers = Array.from(photoCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const { data: storyStats } = await supabase
    .from('ride_stories')
    .select('participant_id, participants(name)')
    .order('participant_id')
    .catch(() => ({ data: [] }));

  const storyCountMap = new Map<number, { name: string; count: number }>();
  storyStats?.forEach((story: any) => {
    const existing = storyCountMap.get(story.participant_id) || {
      name: story.participants?.name || 'Unknown',
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time event performance metrics</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Participation Pattern</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('hourly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'hourly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setTimeRange('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                7 Days
              </button>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2">
            {participationData.map((data, index) => {
              const height = (data.count / maxCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full group">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {data.count} check-ins
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 transform -rotate-45 origin-top-left mt-4">
                    {timeRange === 'hourly' ? data.hour : data.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
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
