import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { createRequestLogger } from '~/lib/logger.server';
import { checkAndUnlockAchievements } from '~/lib/achievement-checker.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [{ title: 'Achievements - Deur Den Bocht' }];
};

// Helper to get participant stats for progress tracking
async function getParticipantStats(participantId: string) {
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('checked_in, checkin_time')
    .eq('id', participantId)
    .single();

  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', participantId)
    .single();

  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select('id')
    .eq('participant_id', participantId);

  const { data: likes } = await supabaseAdmin
    .from('photo_likes')
    .select('id')
    .eq('participant_id', participantId);

  const { data: stories } = await supabaseAdmin
    .from('ride_stories')
    .select('id')
    .eq('participant_id', participantId);

  const zonesCompleted = submission 
    ? Object.keys(submission).filter(k => k.startsWith('rz') && (submission as any)[k]).length 
    : 0;

  return {
    zones_completed: zonesCompleted,
    photos_uploaded: photos?.length || 0,
    likes_received: likes?.length || 0,
    stories_shared: stories?.length || 0,
    checked_in: participant?.checked_in || false,
    checkin_time: participant?.checkin_time || null,
  };
}

// Helper to calculate achievement progress
function getAchievementProgress(achievement: any, stats: any) {
  if (!achievement.criteria || !achievement.criteria.type) {
    return { current: 0, target: 0, percentage: 0, label: 'Geen criteria' };
  }

  const { type, value, time_before, time_after } = achievement.criteria;

  switch (type) {
    case 'zones':
      return {
        current: stats.zones_completed,
        target: value || 0,
        percentage: Math.min(100, Math.round((stats.zones_completed / (value || 1)) * 100)),
        label: `${stats.zones_completed}/${value} zones`,
      };
    
    case 'photos':
      return {
        current: stats.photos_uploaded,
        target: value || 0,
        percentage: Math.min(100, Math.round((stats.photos_uploaded / (value || 1)) * 100)),
        label: `${stats.photos_uploaded}/${value} foto's`,
      };
    
    case 'likes':
      return {
        current: stats.likes_received,
        target: value || 0,
        percentage: Math.min(100, Math.round((stats.likes_received / (value || 1)) * 100)),
        label: `${stats.likes_received}/${value} likes`,
      };
    
    case 'stories':
      return {
        current: stats.stories_shared,
        target: value || 0,
        percentage: Math.min(100, Math.round((stats.stories_shared / (value || 1)) * 100)),
        label: `${stats.stories_shared}/${value} verhalen`,
      };
    
    case 'checkin_time':
      if (!stats.checked_in) {
        return {
          current: 0,
          target: 1,
          percentage: 0,
          label: time_before ? `Check in voor ${time_before}` : time_after ? `Check in na ${time_after}` : 'Check in',
        };
      }
      // Already checked in - show as complete
      return {
        current: 1,
        target: 1,
        percentage: 100,
        label: time_before ? `Checked in voor ${time_before}` : time_after ? `Checked in na ${time_after}` : 'Checked in',
      };
    
    default:
      return { current: 0, target: 0, percentage: 0, label: 'Onbekend criterium' };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Achievements page loaded');

  // Check and unlock any new achievements for this participant
  await checkAndUnlockAchievements(userId);

  // Get all achievements
  const { data: allAchievements } = await supabaseAdmin
    .from('achievements')
    .select('*')
    .order('category', { ascending: true });

  // Get user's unlocked achievements
  const { data: unlockedAchievements } = await supabaseAdmin
    .from('participant_achievements')
    .select('achievement_id, unlocked_at')
    .eq('participant_id', userId);

  const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

  // Get participant stats for progress tracking
  const stats = await getParticipantStats(userId);

  // Calculate progress for each achievement
  const achievementsWithProgress = (allAchievements || []).map((achievement: any) => ({
    ...achievement,
    isUnlocked: unlockedIds.has(achievement.id),
    progress: getAchievementProgress(achievement, stats),
  }));

  return { 
    achievements: achievementsWithProgress,
    stats,
  };
}

export default function Achievements() {
  const { achievements, stats } = useLoaderData<typeof loader>();

  const categories: Record<string, { name: string; color: string; icon: string }> = {
    progress: { name: 'Voortgang', color: 'from-blue-500 to-blue-600', icon: 'chart' },
    completion: { name: 'Voltooiing', color: 'from-green-500 to-green-600', icon: 'check-circle' },
    special: { name: 'Speciaal', color: 'from-purple-500 to-purple-600', icon: 'sparkles' },
    social: { name: 'Sociaal', color: 'from-pink-500 to-pink-600', icon: 'users' },
  };

  const groupedAchievements = achievements.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter((a: any) => a.isUnlocked).length;
  const completionPercentage = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="trophy" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Achievements</h1>
          <p className="text-xl text-primary-100">Ontgrendel achievements door deel te nemen aan de rally!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Progress */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-primary-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Voortgang</div>
            <div className="text-3xl font-bold text-primary-600 mb-2">{unlockedCount}/{totalAchievements}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">{completionPercentage}% compleet</div>
          </div>

          {/* Zones */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Zones Voltooid</div>
            <div className="text-3xl font-bold text-green-600">{stats.zones_completed}<span className="text-xl text-gray-400">/8</span></div>
            <div className="text-xs text-gray-500 mt-4 flex items-center gap-1">
              <Icon name="target" className="w-3 h-3" />
              Rally voortgang
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-pink-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Foto's Geüpload</div>
            <div className="text-3xl font-bold text-pink-600">{stats.photos_uploaded}</div>
            <div className="text-xs text-gray-500 mt-4 flex gap-2 items-center"><Icon name="camera" className="w-3 h-3" /> Deel je momenten</div>
          </div>

          {/* Stories */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-orange-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Verhalen Gedeeld</div>
            <div className="text-3xl font-bold text-orange-600">{stats.stories_shared}</div>
            <div className="text-xs text-gray-500 mt-4 flex gap-2 items-center"><Icon name="book" className="w-3 h-3" /> Deel je avontuur</div>
          </div>
        </div>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]: [string, any]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-sm bg-gradient-to-r ${categories[category]?.color || 'from-gray-500 to-gray-600'} text-white font-bold`}>
                <Icon name={categories[category]?.icon || 'award'} className="w-5 h-5" />
                <h2 className="text-2xl">{categories[category]?.name || category}</h2>
              </div>
              <div className="text-sm text-gray-500">
                {categoryAchievements.filter((a: any) => a.isUnlocked).length}/{categoryAchievements.length} ontgrendeld
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryAchievements.map((achievement: any) => {
                const { isUnlocked, progress } = achievement;
                
                return (
                  <div 
                    key={achievement.id}
                    className={`group relative rounded-sm shadow-xl overflow-hidden transition-all duration-300 ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-white via-teal-50 to-teal-100 border-2 border-teal-400 ring-2 ring-teal-200' 
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gradient-to-br from-teal-400 to-teal-500 rotate-45 opacity-20"></div>
                    )}
                    
                    <div className="p-6">
                      {/* Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`text-6xl transition-all duration-300 ${isUnlocked ? 'grayscale-0 drop-shadow-lg' : 'grayscale opacity-40'}`}>
                          {achievement.icon || '🏆'}
                        </div>
                        {isUnlocked && (
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <Icon name="check" className="w-3 h-3" />
                            Unlocked
                          </div>
                        )}
                        {!isUnlocked && (
                          <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow flex items-center gap-1">
                            <Icon name="lock" className="w-3 h-3" />
                            Locked
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? 'text-gray-900' : 'text-gray-600'}`}>
                        {achievement.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm mb-4 leading-relaxed ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                        {achievement.description}
                      </p>

                      {/* Progress Bar (only for locked achievements with valid progress) */}
                      {!isUnlocked && progress.target > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-600">{progress.label}</span>
                            <span className="text-xs font-bold text-primary-600">{progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                        {isUnlocked ? (
                          <div className="text-xs text-green-600 font-semibold px-3 py-1.5 bg-green-100 rounded-full flex items-center gap-1">
                            <Icon name="sparkles" className="w-3 h-3" />
                            Voltooid
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 font-medium">
                            {progress.label}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Glow effect for unlocked */}
                    {isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-sm shadow-2xl p-10 text-center text-white">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white opacity-5"></div>
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white opacity-5"></div>
          
          <div className="relative z-10">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold mb-4">Klaar voor meer achievements?</h2>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Neem deel aan de rally, upload foto's en deel je verhalen om meer achievements te ontgrendelen!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 px-8 py-4 rounded-sm font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <Icon name="chart" className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                to="/gallery"
                className="bg-primary-800 text-white px-8 py-4 rounded-sm font-bold hover:bg-primary-900 transition-all transform hover:scale-105 shadow-lg border-2 border-white flex items-center gap-2"
              >
                <Icon name="camera" className="w-5 h-5" />
                Upload Foto's
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
