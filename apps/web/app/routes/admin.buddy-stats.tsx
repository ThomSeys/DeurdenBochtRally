import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [{ title: 'Naftgenoten Statistieken - Admin - Deur Den Bocht' }];
};

interface BuddyGroup {
  participant_id: string;
  buddy_count: number;
  participant_name: string;
  profile_photo_url: string | null;
  buddies: Array<{
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
    route_preference: string | null;
  }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get total buddy connections
  const { count: totalConnections } = await supabaseAdmin
    .from('riding_buddies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted');

  // Get all participants with buddy counts
  const { data: allParticipants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, profile_photo_url, route_preference');

  // Get all buddy relationships
  const { data: allBuddies } = await supabaseAdmin
    .from('riding_buddies')
    .select('participant_id, buddy_id')
    .eq('status', 'accepted');

  // Build buddy groups
  const buddyMap = new Map<string, Set<string>>();
  allBuddies?.forEach((buddy) => {
    if (!buddyMap.has(buddy.participant_id)) {
      buddyMap.set(buddy.participant_id, new Set());
    }
    buddyMap.get(buddy.participant_id)!.add(buddy.buddy_id);
  });

  const buddyGroups: BuddyGroup[] = [];
  allParticipants?.forEach((participant) => {
    const buddyIds = buddyMap.get(participant.id);
    if (buddyIds && buddyIds.size > 0) {
      const buddies = Array.from(buddyIds)
        .map((buddyId) => allParticipants.find((p) => p.id === buddyId))
        .filter(Boolean) as any[];

      buddyGroups.push({
        participant_id: participant.id,
        buddy_count: buddyIds.size,
        participant_name: `${participant.first_name} ${participant.last_name}`,
        profile_photo_url: participant.profile_photo_url,
        buddies,
      });
    }
  });

  // Sort by buddy count (descending)
  buddyGroups.sort((a, b) => b.buddy_count - a.buddy_count);

  // Calculate statistics
  const participantsWithBuddies = buddyGroups.length;
  const totalParticipants = allParticipants?.length || 0;
  const averageBuddiesPerPerson = participantsWithBuddies > 0
    ? buddyGroups.reduce((sum, g) => sum + g.buddy_count, 0) / participantsWithBuddies
    : 0;
  const largestGroup = buddyGroups[0]?.buddy_count || 0;
  
  // Group sizes distribution
  const groupSizes = {
    solo: totalParticipants - participantsWithBuddies,
    small: buddyGroups.filter((g) => g.buddy_count >= 1 && g.buddy_count <= 2).length,
    medium: buddyGroups.filter((g) => g.buddy_count >= 3 && g.buddy_count <= 5).length,
    large: buddyGroups.filter((g) => g.buddy_count > 5).length,
  };

  // Get buddy achievements stats
  const { data: achievements } = await supabaseAdmin
    .from('buddy_group_achievements')
    .select('*, achievement:buddy_achievements(name, icon, badge_color)')
    .eq('is_unlocked', true);

  const achievementStats = achievements?.reduce((acc: any, achievement: any) => {
    const key = achievement.achievement.name;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        count: 0,
        icon: achievement.achievement.icon,
        color: achievement.achievement.badge_color,
      };
    }
    acc[key].count++;
    return acc;
  }, {});

  return {
    totalConnections: totalConnections || 0,
    totalParticipants,
    participantsWithBuddies,
    averageBuddiesPerPerson: averageBuddiesPerPerson.toFixed(1),
    largestGroup,
    groupSizes,
    buddyGroups: buddyGroups.slice(0, 20), // Top 20 groups
    achievementStats: Object.values(achievementStats || {}),
  };
}

export default function AdminBuddyStats() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Naftgenoten Statistieken</h1>
          <p className="text-gray-600">
            Overzicht van groepsformatie en naftgenoten statistieken
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Totaal Deelnemers</h3>
              <Icon name="users" className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.totalParticipants}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Met Buddies</h3>
              <Icon name="user-check" className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.participantsWithBuddies}</p>
            <p className="text-sm text-gray-500 mt-1">
              {((data.participantsWithBuddies / data.totalParticipants) * 100).toFixed(1)}% van totaal
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Gemiddeld Buddies</h3>
              <Icon name="activity" className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.averageBuddiesPerPerson}</p>
            <p className="text-sm text-gray-500 mt-1">per persoon met buddies</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Grootste Groep</h3>
              <Icon name="trophy" className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.largestGroup}</p>
            <p className="text-sm text-gray-500 mt-1">buddies</p>
          </div>
        </div>

        {/* Group Size Distribution */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Icon name="bar-chart" className="w-5 h-5" />
              Groepsgrootte Verdeling
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Icon name="user" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.groupSizes.solo}</p>
                <p className="text-sm text-gray-600">Solo rijders</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Icon name="users" className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{data.groupSizes.small}</p>
                <p className="text-sm text-blue-600">Klein (1-2 buddies)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Icon name="users" className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{data.groupSizes.medium}</p>
                <p className="text-sm text-green-600">Middel (3-5 buddies)</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Icon name="users" className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{data.groupSizes.large}</p>
                <p className="text-sm text-purple-600">Groot (6+ buddies)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Stats */}
        {data.achievementStats.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="award" className="w-5 h-5" />
                Buddy Achievements Behaald
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.achievementStats.map((achievement: any) => (
                  <div
                    key={achievement.name}
                    className={`p-4 rounded-lg border-2 border-${achievement.color}-200 bg-${achievement.color}-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${achievement.color}-200 rounded-lg flex items-center justify-center`}>
                        <Icon name={achievement.icon} className={`w-5 h-5 text-${achievement.color}-700`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{achievement.name}</p>
                        <p className="text-2xl font-bold text-gray-900">{achievement.count}</p>
                        <p className="text-xs text-gray-600">groepen</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Buddy Groups */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Icon name="users" className="w-5 h-5" />
              Top 20 Buddy Groepen
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {data.buddyGroups.map((group, index) => (
              <div key={group.participant_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-600 flex-shrink-0">
                    {index + 1}
                  </div>
                  {group.profile_photo_url ? (
                    <img
                      src={group.profile_photo_url}
                      alt={group.participant_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon name="user" className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{group.participant_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {group.buddy_count} buddy{group.buddy_count !== 1 ? "'s" : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.buddies.map((buddy) => (
                        <div
                          key={buddy.id}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {buddy.profile_photo_url ? (
                            <img
                              src={buddy.profile_photo_url}
                              alt={buddy.first_name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                              <Icon name="user" className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                          <span className="text-gray-700">
                            {buddy.first_name} {buddy.last_name}
                          </span>
                          {buddy.route_preference && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              buddy.route_preference === 'rally'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {buddy.route_preference === 'rally' ? 'Rally' : 'Scenic'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
