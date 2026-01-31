import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [{ title: 'Achievements - Deur Den Bocht' }];
};

// SVG Icons for achievements
export const AchievementIcon = ({ name, isUnlocked }: { name: string; isUnlocked: boolean }) => {
  const className = `w-20 h-20 ${isUnlocked ? 'drop-shadow-lg' : 'opacity-40 grayscale'}`;
  
  const icons: Record<string, React.ReactElement> = {
    'first_checkin': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" stroke="#F59E0B" strokeWidth="3" filter="url(#shadow)"/>
        <circle cx="50" cy="50" r="35" fill="#D97706" opacity="0.3"/>
        <path d="M45 25 L55 25 L55 35 L60 35 L50 20 L40 35 L45 35 Z" fill="#DC2626"/>
        <rect x="40" y="35" width="20" height="4" fill="#DC2626"/>
        <text x="50" y="68" textAnchor="middle" fontSize="42" fill="#78350F" fontWeight="bold" fontFamily="Arial, sans-serif">1</text>
      </svg>
    ),
    'half_complete': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#blueGradient)" stroke="#0891B2" strokeWidth="3" filter="url(#shadow)"/>
        <path d="M 50 50 L 50 10 A 40 40 0 0 1 50 90 Z" fill="#0369A1" opacity="0.8"/>
        <circle cx="50" cy="50" r="25" fill="#164E63" opacity="0.5"/>
        <text x="50" y="63" textAnchor="middle" fontSize="38" fill="#164E63" fontWeight="bold" fontFamily="Arial, sans-serif">½</text>
      </svg>
    ),
    'zone_master': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#trophyGradient)" stroke="#F59E0B" strokeWidth="4" filter="url(#shadow)"/>
        <path d="M35 25 H65 L70 35 L50 55 L30 35 Z" fill="#B45309"/>
        <path d="M30 45 H70 L65 55 H35 Z" fill="#D97706"/>
        <path d="M28 60 H72 L68 75 H32 Z" fill="#B45309"/>
        <circle cx="50" cy="35" r="5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2"/>
      </svg>
    ),
    'perfect_score': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#purpleGradient)" stroke="#A855F7" strokeWidth="3" filter="url(#shadow)"/>
        <circle cx="50" cy="50" r="35" stroke="#9333EA" strokeWidth="2" strokeDasharray="4 2" fill="none" opacity="0.5"/>
        <path d="M25 50 L40 65 L75 30" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    'early_bird': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sunriseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#sunriseGradient)" stroke="#F59E0B" strokeWidth="3" filter="url(#shadow)"/>
        <circle cx="70" cy="30" r="16" fill="#FBBF24" opacity="0.7"/>
        <path d="M35 45 Q35 35 45 35 Q50 30 55 35 Q65 35 65 45 Q65 60 50 70 Q35 60 35 45 Z" fill="#EA580C"/>
        <circle cx="42" cy="42" r="2.5" fill="white"/>
        <path d="M45 50 L48 52 L52 48" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    'weather_warrior': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stormGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BFDBFE" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#stormGradient)" stroke="#3B82F6" strokeWidth="3" filter="url(#shadow)"/>
        <ellipse cx="35" cy="35" rx="15" ry="12" fill="#6B7280"/>
        <ellipse cx="50" cy="32" rx="18" ry="15" fill="#4B5563"/>
        <ellipse cx="65" cy="35" rx="15" ry="12" fill="#6B7280"/>
        <path d="M35 50 L32 60 M40 52 L37 62 M45 50 L42 60 M50 52 L47 62 M55 50 L52 60 M60 52 L57 62 M65 50 L62 60" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    'marathon_rider': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#orangeGradient)" stroke="#F97316" strokeWidth="3" filter="url(#shadow)"/>
        <path d="M30 50 Q40 30 50 50 Q60 70 70 50" stroke="#C2410C" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <circle cx="30" cy="50" r="5" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
        <circle cx="70" cy="50" r="5" fill="#22C55E" stroke="#15803D" strokeWidth="2"/>
        <path d="M45 35 L48 38 L55 31" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    'photo_star': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCE7F3" />
            <stop offset="100%" stopColor="#F9A8D4" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#pinkGradient)" stroke="#EC4899" strokeWidth="3" filter="url(#shadow)"/>
        <rect x="40" y="35" width="20" height="22" rx="2" fill="#6B7280" stroke="#4B5563" strokeWidth="2"/>
        <circle cx="50" cy="30" r="5" fill="#4B5563"/>
        <rect x="42" y="38" width="16" height="12" fill="#D1D5DB"/>
        <path d="M30 65 L35 55 L45 60 L45 75 L30 75 Z" fill="#DB2777"/>
        <path d="M70 65 L65 55 L55 60 L55 75 L70 75 Z" fill="#DB2777"/>
        <circle cx="47" cy="44" r="2" fill="#3B82F6"/>
      </svg>
    ),
    'story_teller': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEE2E2" />
            <stop offset="100%" stopColor="#FCA5A5" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#redGradient)" stroke="#EF4444" strokeWidth="3" filter="url(#shadow)"/>
        <path d="M50 30 C50 30 35 35 35 50 C35 65 50 75 50 75 C50 75 65 65 65 50 C65 35 50 30 50 30 Z" fill="#DC2626"/>
        <path d="M45 45 L48 50 L55 43" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    'veteran': (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D1FAE5" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#greenGradient)" stroke="#10B981" strokeWidth="3" filter="url(#shadow)"/>
        <circle cx="50" cy="40" r="20" fill="#047857" stroke="#065F46" strokeWidth="2"/>
        <rect x="35" y="55" width="30" height="25" fill="#065F46" rx="2"/>
        <path d="M25 75 L35 55 L40 55 L30 75 Z M75 75 L65 55 L60 55 L70 75 Z" fill="#047857"/>
        <text x="50" y="47" textAnchor="middle" fontSize="18" fill="#FCD34D" fontWeight="bold" fontFamily="Arial, sans-serif">★</text>
        <text x="50" y="72" textAnchor="middle" fontSize="11" fill="#D1FAE5" fontWeight="bold" fontFamily="Arial, sans-serif">VET</text>
      </svg>
    ),
  };

  return icons[name] || (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#9CA3AF" stroke="#6B7280" strokeWidth="3"/>
      <text x="50" y="58" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold" fontFamily="Arial, sans-serif">?</text>
    </svg>
  );
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
    completion: { name: 'Voltooiing', color: 'from-blue-500 to-blue-600' },
    special: { name: 'Speciaal', color: 'from-purple-500 to-purple-600' },
    social: { name: 'Sociaal', color: 'from-pink-500 to-pink-600' },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* V1: Points display hidden
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-600 mb-2">Totaal Punten</div>
            <div className="text-3xl font-bold text-yellow-600 flex items-baseline">
              {stats.total_points}
              <span className="text-sm ml-2 text-gray-500">pts</span>
            </div>
            <div className="text-xs text-gray-500 mt-4 flex gap-2 items-center"><Icon name="diamond" className="w-3 h-3" /> Verzamel meer punten!</div>
          </div>
          */}

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
        </div>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]: [string, any]) => (
          <div key={category} className="mb-12">
            <div className={`inline-block mb-6 font-bold uppercase py-3 rounded-sm text-primary-600`}>
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
                    className={`group relative rounded-sm shadow-xl overflow-hidden transition-all duration-300 ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-white via-teal-100 to-teal-200 border-2 border-teal-400' 
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gradient-to-br from-teal-400 to-teal-500 rotate-45 opacity-20"></div>
                    )}
                    
                    <div className="p-6">
                      {/* Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`transition-transform duration-300 ${isUnlocked ? '' : ''}`}>
                          <AchievementIcon name={achievement.name} isUnlocked={isUnlocked} />
                        </div>
                        {isUnlocked && (
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <span>✓</span> Unlocked
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

                      {/* Footer */}
                      <div className="flex items-center justify-end pt-4 border-t-2 border-gray-200">
                        {/* V1: Points display hidden
                        <div className={`font-bold text-lg flex items-center gap-2 ${isUnlocked ? 'text-yellow-600' : 'text-gray-400'}`}>
                          <Icon name="diamond" className="w-5 h-5" />
                          +{achievement.points}
                        </div>
                        */}
                        {isUnlocked && (
                          <div className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-100 rounded-full">
                            ✨ Voltooid
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
