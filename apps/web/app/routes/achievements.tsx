import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [{ title: 'Achievements - Deur Den Bocht' }];
};

// SVG Icons for achievements
const AchievementIcon = ({ name, isUnlocked }: { name: string; isUnlocked: boolean }) => {
  const className = `w-20 h-20 ${isUnlocked ? '' : 'opacity-40 grayscale'}`;
  
  const icons: Record<string, React.ReactElement> = {
    'First Blood': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#FCD34D" stroke="#F59E0B" strokeWidth="3"/>
        <path d="M50 20 L60 45 L85 48 L65 65 L70 90 L50 75 L30 90 L35 65 L15 48 L40 45 Z" fill="#F59E0B"/>
        <text x="50" y="58" textAnchor="middle" fontSize="24" fill="#78350F" fontWeight="bold">1st</text>
      </svg>
    ),
    'Halfway Hero': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#A5F3FC" stroke="#06B6D4" strokeWidth="3"/>
        <path d="M50 15 L55 35 L75 35 L60 48 L65 68 L50 55 L35 68 L40 48 L25 35 L45 35 Z" fill="#0891B2"/>
        <text x="50" y="58" textAnchor="middle" fontSize="20" fill="#164E63" fontWeight="bold">½</text>
      </svg>
    ),
    'Zone Master': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#FDE68A" stroke="#F59E0B" strokeWidth="4"/>
        <path d="M35 25 H65 L70 35 L50 55 L30 35 Z" fill="#D97706"/>
        <path d="M30 45 H70 L65 55 H35 Z" fill="#F59E0B"/>
        <path d="M28 60 H72 L68 75 H32 Z" fill="#D97706"/>
        <circle cx="50" cy="35" r="4" fill="#FCD34D"/>
      </svg>
    ),
    'Perfect Score': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#E9D5FF" stroke="#A855F7" strokeWidth="3"/>
        <path d="M25 50 L40 65 L75 30" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="50" cy="50" r="35" stroke="#A855F7" strokeWidth="2" strokeDasharray="5 3" fill="none"/>
      </svg>
    ),
    'Early Bird': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3"/>
        <circle cx="70" cy="30" r="15" fill="#FCD34D" opacity="0.6"/>
        <path d="M35 45 Q35 35 45 35 Q50 30 55 35 Q65 35 65 45 Q65 60 50 70 Q35 60 35 45 Z" fill="#EA580C"/>
        <circle cx="42" cy="42" r="2" fill="white"/>
        <path d="M45 50 L48 52 L52 48" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    'Weather Warrior': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="3"/>
        <ellipse cx="35" cy="35" rx="15" ry="12" fill="#9CA3AF"/>
        <ellipse cx="50" cy="32" rx="18" ry="15" fill="#6B7280"/>
        <ellipse cx="65" cy="35" rx="15" ry="12" fill="#9CA3AF"/>
        <path d="M35 50 L32 60 M40 52 L37 62 M45 50 L42 60 M50 52 L47 62 M55 50 L52 60 M60 52 L57 62 M65 50 L62 60" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'Marathon Rider': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#FED7AA" stroke="#F97316" strokeWidth="3"/>
        <path d="M30 50 Q40 30 50 50 Q60 70 70 50" stroke="#EA580C" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <circle cx="30" cy="50" r="4" fill="#DC2626"/>
        <circle cx="70" cy="50" r="4" fill="#22C55E"/>
        <path d="M45 35 L48 38 L55 31" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    'Social Butterfly': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#FBCFE8" stroke="#EC4899" strokeWidth="3"/>
        <rect x="40" y="35" width="20" height="22" rx="2" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2"/>
        <circle cx="50" cy="30" r="4" fill="#6B7280"/>
        <rect x="42" y="38" width="16" height="12" fill="#E5E7EB"/>
        <path d="M30 65 L35 55 L45 60 L45 75 L30 75 Z" fill="#DB2777"/>
        <path d="M70 65 L65 55 L55 60 L55 75 L70 75 Z" fill="#DB2777"/>
        <circle cx="47" cy="44" r="1.5" fill="#3B82F6"/>
      </svg>
    ),
    'Popular': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#FECACA" stroke="#EF4444" strokeWidth="3"/>
        <path d="M50 30 C50 30 35 35 35 50 C35 65 50 75 50 75 C50 75 65 65 65 50 C65 35 50 30 50 30 Z" fill="#DC2626"/>
        <path d="M45 45 L48 50 L55 43" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    'Veteran': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#D1FAE5" stroke="#10B981" strokeWidth="3"/>
        <circle cx="50" cy="40" r="20" fill="#059669" stroke="#047857" strokeWidth="2"/>
        <rect x="35" y="55" width="30" height="25" fill="#065F46" rx="2"/>
        <path d="M25 75 L35 55 L40 55 L30 75 Z M75 75 L65 55 L60 55 L70 75 Z" fill="#047857"/>
        <text x="50" y="47" textAnchor="middle" fontSize="16" fill="white" fontWeight="bold">★</text>
        <text x="50" y="72" textAnchor="middle" fontSize="10" fill="#D1FAE5" fontWeight="bold">VET</text>
      </svg>
    ),
  };

  return icons[name] || icons['First Blood'];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Get all achievements
  const { data: allAchievements } = await supabaseAdmin
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('points', { ascending: false });

  // Get user's unlocked achievements
  const { data: unlockedAchievements } = await supabaseAdmin
    .from('participant_achievements')
    .select('achievement_id, unlocked_at')
    .eq('participant_id', userId);

  const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

  // Get participant stats for progress tracking
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*, total_achievement_points')
    .eq('id', userId)
    .single();

  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', userId)
    .single();

  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select('id')
    .eq('participant_id', userId);

  const stats = {
    zones_completed: submission ? Object.keys(submission).filter(k => k.startsWith('rz') && (submission as any)[k]).length : 0,
    photos_uploaded: photos?.length || 0,
    checked_in: participant?.checked_in || false,
    total_points: participant?.total_achievement_points || 0,
  };

  return { 
    achievements: allAchievements || [],
    unlockedIds: Array.from(unlockedIds),
    stats,
    participant,
  };
}

export default function Achievements() {
  const { achievements, unlockedIds, stats } = useLoaderData<typeof loader>();

  const categories: Record<string, { name: string; color: string }> = {
    completion: { name: '🎯 Voltooiing', color: 'from-blue-500 to-blue-600' },
    special: { name: '⭐ Speciaal', color: 'from-purple-500 to-purple-600' },
    social: { name: '👥 Sociaal', color: 'from-pink-500 to-pink-600' },
  };

  const groupedAchievements = achievements.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  const totalAchievements = achievements.length;
  const unlockedCount = unlockedIds.length;
  const completionPercentage = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8 overflow-hidden rounded-sm bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white opacity-10"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white opacity-10"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <span className="text-5xl">🏆</span>
              Achievements
            </h1>
            <p className="text-primary-100 text-lg">Ontgrendel achievements en verzamel punten!</p>
          </div>
        </div>

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

          {/* Points */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Totaal Punten</div>
            <div className="text-3xl font-bold text-yellow-600 flex items-baseline">
              {stats.total_points}
              <span className="text-sm ml-2 text-gray-500">pts</span>
            </div>
            <div className="text-xs text-gray-500 mt-4">💎 Verzamel meer punten!</div>
          </div>

          {/* Zones */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Zones Voltooid</div>
            <div className="text-3xl font-bold text-green-600">{stats.zones_completed}<span className="text-xl text-gray-400">/8</span></div>
            <div className="text-xs text-gray-500 mt-4">🎯 Rally voortgang</div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-pink-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Foto's Geüpload</div>
            <div className="text-3xl font-bold text-pink-600">{stats.photos_uploaded}</div>
            <div className="text-xs text-gray-500 mt-4">📸 Deel je momenten</div>
          </div>
        </div>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]: [string, any]) => (
          <div key={category} className="mb-12">
            <div className={`inline-block mb-6 px-6 py-3 rounded-sm bg-gradient-to-r ${categories[category]?.color || 'from-gray-500 to-gray-600'} text-white shadow-lg`}>
              <h2 className="text-2xl font-bold">
                {categories[category]?.name || category}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryAchievements.map((achievement: any) => {
                const isUnlocked = unlockedIds.includes(achievement.id);
                
                return (
                  <div 
                    key={achievement.id}
                    className={`group relative rounded-sm shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-white via-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-yellow-200' 
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rotate-45 opacity-20"></div>
                    )}
                    
                    <div className="p-6">
                      {/* Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110' : ''}`}>
                          <AchievementIcon name={achievement.name} isUnlocked={isUnlocked} />
                        </div>
                        {isUnlocked && (
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <span>✓</span> Unlocked
                          </div>
                        )}
                        {!isUnlocked && (
                          <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow flex items-center gap-1">
                            <span>🔒</span> Locked
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

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                        <div className={`font-bold text-lg flex items-center gap-2 ${isUnlocked ? 'text-yellow-600' : 'text-gray-400'}`}>
                          <span className="text-xl">💎</span>
                          +{achievement.points}
                        </div>
                        {isUnlocked && (
                          <div className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-100 rounded-full">
                            ✨ Voltooid
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Glow effect for unlocked */}
                    {isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-transparent to-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
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
              Neem deel aan de rally, upload foto's en behaal nog meer achievements om je positie op het leaderboard te verbeteren!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 px-8 py-4 rounded-sm font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                📊 Dashboard
              </Link>
              <Link
                to="/gallery"
                className="bg-primary-800 text-white px-8 py-4 rounded-sm font-bold hover:bg-primary-900 transition-all transform hover:scale-105 shadow-lg border-2 border-white"
              >
                📸 Upload Foto's
              </Link>
              <Link
                to="/dashboard/rally-submission"
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-8 py-4 rounded-sm font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 shadow-lg"
              >
                🏁 Rally Starten
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
