import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link, useParams } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { AchievementIcon } from './achievements';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Deelnemer Detail - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin participant submissions loaded', { participantId: params.participantId });
  
  const participantId = params.participantId || "";

  // Get participant info
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (!participant) {
    throw new Response('Participant not found', { status: 404 });
  }

  // Get rally zone check-ins
  const { data: checkIns, error: checkInsError } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*')
    .eq('participant_id', participantId)
    .order('checked_in_at', { ascending: false });

  console.log('CheckIns query result:', { checkIns, checkInsError, count: checkIns?.length });

  // Get photo submissions count
  const { count: photoCount, error: photoError } = await supabaseAdmin
    .from('participant_photos')
    .select('*', { count: 'exact', head: true })
    .eq('participant_id', participantId);

  console.log('Photo submissions count:', { photoCount, photoError });

  // Get achievements earned
  const { data: achievements, error: achievementsError } = await supabaseAdmin
    .from('participant_achievements')
    .select('*')
    .eq('participant_id', participantId);

  console.log('Achievements query result:', { achievements, achievementsError, count: achievements?.length });

  // Get achievement details separately
  const achievementIds = achievements?.map(pa => pa.achievement_id).filter(Boolean) || [];
  const { data: achievementDetails } = await supabaseAdmin
    .from('achievements')
    .select('id, name, title, description, icon, points')
    .in('id', achievementIds.length > 0 ? achievementIds : [0]);

  // Map achievement details to participant achievements
  const achievementsWithDetails = achievements?.map(pa => ({
    ...pa,
    achievements: achievementDetails?.find(a => a.id === pa.achievement_id)
  })) || [];

  // Calculate total achievement points
  const totalAchievementPoints = achievementsWithDetails.reduce((sum, pa) => {
    return sum + (pa.achievements?.points || 0);
  }, 0);

  return { 
    participant,
    checkIns: checkIns || [],
    photoCount: photoCount || 0,
    achievements: achievementsWithDetails,
    totalAchievementPoints
  };
}

export default function ParticipantSubmissions() {
  const { participant, checkIns, photoCount, achievements, totalAchievementPoints } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                {participant.first_name} {participant.last_name}
              </h1>
              <div className="space-y-1 text-xl text-primary-100">
                <p>{participant.email}</p>
                <p>{participant.motorcycle_brand} {participant.motorcycle_model} • {participant.license_plate}</p>
              </div>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
              <div className="text-sm text-primary-100 mb-1">Achievements</div>
              <div className="text-5xl font-bold text-white">
                {achievements.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/admin/participants" 
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            ← Terug naar deelnemers
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Zones Bezocht</div>
              <Icon name="marker" className="w-6 h-6 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {checkIns.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Rally zone check-ins
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Foto's Ingediend</div>
              <Icon name="camera" className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {photoCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Goedgekeurde foto's
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Achievements</div>
              <Icon name="trophy" className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {achievements.length}
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements Verdiend</h2>
          {achievements.length === 0 ? (
            <div className="bg-white rounded-sm shadow p-12 text-center text-gray-500">
              <Icon name="trophy" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p>Nog geen achievements verdiend</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((pa: any) => (
                <div 
                  key={pa.id}
                  className="group relative rounded-sm shadow-xl overflow-hidden transition-all duration-300 bg-gradient-to-br from-white via-teal-100 to-teal-200 border-2 border-teal-400"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gradient-to-br from-teal-400 to-teal-500 rotate-45 opacity-20"></div>
                  
                  <div className="p-6">
                    {/* Icon and Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-shrink-0">
                        <AchievementIcon name={pa.achievements?.name || ''} isUnlocked={true} />
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <span>✓</span> Unlocked
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {pa.achievements?.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm mb-4 leading-relaxed text-gray-700">
                      {pa.achievements?.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-end pt-4 border-t-2 border-gray-200">
                      <div className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-100 rounded-full">
                        ✨ Voltooid
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone Check-ins Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rally Zone Check-ins</h2>
          {checkIns.length === 0 ? (
            <div className="bg-white rounded-sm shadow p-12 text-center text-gray-500">
              <Icon name="marker" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p>Nog geen zones bezocht</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkIns.map((checkIn: any) => {
                return <div key={checkIn.id} className="bg-white rounded-sm shadow overflow-hidden">
                  <div className="bg-primary-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        Zone #{checkIn.zone_id}
                      </h3>
                      <div className="text-sm text-gray-600">
                        {new Date(checkIn.checked_in_at).toLocaleString('nl-BE')}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {checkIn.location_lat && checkIn.location_lng && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Locatie</div>
                          <div className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                            {checkIn.location_lat.toFixed(6)}, {checkIn.location_lng.toFixed(6)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
