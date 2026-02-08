import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, useLoaderData, useSearchParams } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import ClientOnly from '~/components/ClientOnly';
import LiveEventMap from '~/components/LiveEventMap';
import { supabaseAdmin } from '~/lib/supabase.server';

interface ParticipantSummary {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  motorcycle_brand: string | null;
  motorcycle_model: string | null;
  total_achievement_points: number | null;
  allow_location_sharing: boolean | null;
}

interface CheckInRow {
  id: string;
  zone_id: string;
  location_lat: number | null;
  location_lng: number | null;
  checked_in_at: string | null;
}

interface ChallengeRow {
  id: string;
  challenge_type: string;
  submitted_at: string | null;
  points_awarded: number | null;
  is_validated: boolean | null;
}

interface AchievementRow {
  id: string;
  achievement_id: number;
  unlocked_at: string | null;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Volg Deelnemers - Deur Den Bocht' },
    { name: 'description', content: 'Volg deelnemers live. Zoek op naam of nummerplaat en bekijk de laatste check-ins en status.' },
  ];
};

function formatZoneName(zoneId: string): string {
  return zoneId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const licensePlate = url.searchParams.get('plate')?.trim() ?? '';
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? '';

  let selected: ParticipantSummary | null = null;
  let checkIns: CheckInRow[] = [];
  let challenges: ChallengeRow[] = [];
  let achievements: AchievementRow[] = [];
  let errorMessage: string | null = null;

  // Only search if both license plate and email are provided
  if (licensePlate && email) {
    const { data: selectedParticipant } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, profile_photo_url, motorcycle_brand, motorcycle_model, total_achievement_points, allow_location_sharing')
      .eq('allow_location_sharing', true)
      .ilike('license_plate', licensePlate)
      .ilike('email', email)
      .maybeSingle();

    if (selectedParticipant) {
      selected = selectedParticipant;

      const { data: checkInRows } = await supabaseAdmin
        .from('rally_zone_checkins')
        .select('id, zone_id, location_lat, location_lng, checked_in_at')
        .eq('participant_id', selectedParticipant.id)
        .order('checked_in_at', { ascending: false })
        .limit(50);

      const { data: challengeRows } = await supabaseAdmin
        .from('route_challenge_submissions')
        .select('id, challenge_type, submitted_at, points_awarded, is_validated')
        .eq('participant_id', selectedParticipant.id)
        .order('submitted_at', { ascending: false })
        .limit(50);

      const { data: achievementRows } = await supabaseAdmin
        .from('participant_achievements')
        .select('id, achievement_id, unlocked_at')
        .eq('participant_id', selectedParticipant.id)
        .order('unlocked_at', { ascending: false });

      checkIns = checkInRows || [];
      challenges = challengeRows || [];
      achievements = achievementRows || [];
    } else {
      errorMessage = 'Geen deelnemer gevonden met deze combinatie van nummerplaat en emailadres, of locatie delen is niet ingeschakeld.';
    }
  }

  return {
    selected,
    checkIns,
    challenges,
    achievements,
    licensePlate,
    email,
    errorMessage,
  };
}

export default function PublicParticipantTracker() {
  const { selected, checkIns, challenges, achievements, licensePlate, email, errorMessage } = useLoaderData<typeof loader>();

  const lastCheckIn = checkIns.find((checkIn) => checkIn.location_lat && checkIn.location_lng) || null;
  const lastLocation = lastCheckIn
    ? { lat: lastCheckIn.location_lat as number, lng: lastCheckIn.location_lng as number }
    : null;

  const challengeStats = challenges.reduce(
    (acc, challenge) => {
      acc.total += 1;
      if (challenge.challenge_type === 'photo') acc.photo += 1;
      if (challenge.challenge_type === 'text' || challenge.challenge_type === 'multiple_choice' || challenge.challenge_type === 'number') {
        acc.trivia += 1;
      }
      if (challenge.is_validated) acc.validated += 1;
      acc.points += challenge.points_awarded || 0;
      return acc;
    },
    { total: 0, photo: 0, trivia: 0, validated: 0, points: 0 }
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            Volg Deelnemers Live
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 max-w-3xl mx-auto">
            Volg vrienden en familie live tijdens het rally event. Voer de nummerplaat en het emailadres in om hun laatste locatie en voortgang te bekijken.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Zoek een deelnemer</h2>
              <p className="text-gray-600">
                Alleen zichtbaar als de deelnemer locatie delen heeft ingeschakeld in zijn profiel.
              </p>
            </div>

            <Form method="get" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-2">
                    Nummerplaat
                  </label>
                  <input
                    type="text"
                    id="plate"
                    name="plate"
                    defaultValue={licensePlate}
                    placeholder="bijv. 1-ABC-123"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Emailadres
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={email}
                    placeholder="naam@voorbeeld.be"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Deelnemer zoeken
              </button>

              {errorMessage && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}
            </Form>
          </div>

          {/* Participant Details */}
          {!selected && !errorMessage && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen deelnemer geselecteerd</h3>
                <p className="text-gray-600">
                  Voer hierboven een nummerplaat en emailadres in om een deelnemer te volgen.
                </p>
              </div>
            </div>
          )}

            {selected && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Header with participant info */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-6 border-b border-primary-200">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-white border-2 border-primary-300 overflow-hidden flex items-center justify-center shadow-md">
                      {selected.profile_photo_url ? (
                        <img src={selected.profile_photo_url} alt="Profielfoto" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-primary-600 text-xl font-bold">
                          {selected.first_name.charAt(0)}{selected.last_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selected.first_name} {selected.last_name}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {selected.motorcycle_brand || 'Motor'} {selected.motorcycle_model || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Check-ins</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{checkIns.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Laatste: {checkIns[0]?.checked_in_at ? new Date(checkIns[0].checked_in_at).toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' }) : 'n.v.t.'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Prestaties</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{achievements.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Punten: {selected.total_achievement_points || 0}
                    </p>
                  </div>
                </div>

                {/* Map Section */}
                <div className="p-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Laatste locatie
                  </h3>
                  {lastLocation ? (
                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm h-80">
                      <ClientOnly>
                        <LiveEventMap
                          rallyZones={[]}
                          eventMarkers={[]}
                          checkIns={checkIns
                            .filter((checkIn) => checkIn.checked_in_at !== null)
                            .map((checkIn) => ({
                              ...checkIn,
                              checked_in_at: checkIn.checked_in_at as string,
                              participant_id: selected.id,
                              participants: {
                                first_name: selected.first_name,
                                last_name: selected.last_name,
                                motorcycle_brand: selected.motorcycle_brand || '',
                                motorcycle_model: selected.motorcycle_model || '',
                              },
                            }))}
                          showCheckIns
                          showZoneRoutes={false}
                          showEventMarkers={false}
                          showEmergencyAlerts={false}
                          allowPublicCheckIns
                          enableUserLocation={false}
                          focusLocation={lastLocation}
                        />
                      </ClientOnly>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-gray-600">Nog geen locatie beschikbaar.</p>
                    </div>
                  )}
                </div>

                {/* History Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-t border-gray-200 bg-gray-50">
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check-in geschiedenis
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {checkIns.length === 0 && (
                        <p className="text-sm text-gray-500 py-4 text-center">Geen check-ins geregistreerd.</p>
                      )}
                      {checkIns.map((checkIn) => (
                        <div key={checkIn.id} className="flex justify-between items-center py-2 px-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                          <span className="text-sm font-medium text-gray-900">{formatZoneName(checkIn.zone_id)}</span>
                          <span className="text-xs text-gray-500">
                            {checkIn.checked_in_at ? new Date(checkIn.checked_in_at).toLocaleTimeString('nl-BE') : 'n.v.t.'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Uitdagingen
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Totaal inzendingen:</span>
                        <span className="font-semibold text-gray-900">{challengeStats.total}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Foto uitdagingen:</span>
                        <span className="font-semibold text-gray-900">{challengeStats.photo}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Trivia/vragen:</span>
                        <span className="font-semibold text-gray-900">{challengeStats.trivia}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Goedgekeurd:</span>
                        <span className="font-semibold text-gray-900">{challengeStats.validated}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-200 pt-2">
                        <span className="text-gray-900 font-medium">Punten via uitdagingen:</span>
                        <span className="font-bold text-primary-600">{challengeStats.points}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-xs text-blue-900">
                      <strong>Privacy:</strong> Alleen deelnemers die locatie delen hebben ingeschakeld in hun profiel zijn zichtbaar. 
                      Challenge-antwoorden worden nooit publiek getoond.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
