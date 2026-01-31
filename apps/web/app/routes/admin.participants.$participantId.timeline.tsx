import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Deelnemer Tijdlijn - Admin - Deur Den Bocht' },
  ];
};

interface TimelineEvent {
  id: string;
  type: 'registration' | 'payment' | 'check_in' | 'zone_checkin' | 'photo_submission' | 'support_ticket' | 'achievement' | 'emergency';
  timestamp: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  metadata?: any;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  const participantId = params.participantId || "";

  // Get participant info
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (!participant) {
    throw new Response('Deelnemer niet gevonden', { status: 404 });
  }

  // Collect all timeline events
  const timeline: TimelineEvent[] = [];

  // 1. Registration event
  timeline.push({
    id: `reg-${participant.id}`,
    type: 'registration',
    timestamp: participant.created_at ?? new Date().toISOString(),
    title: 'Registratie',
    description: `Ingeschreven voor ${participant.formula === 'with_meals' ? 'formule met maaltijden' : 'formule alleen ontbijt'}`,
    icon: 'user-plus',
    color: 'blue',
    metadata: {
      formula: participant.formula,
      ride_type: participant.ride_type,
    }
  });

  // 2. Payment event
  if (participant.payment_status === 'completed') {
    timeline.push({
      id: `pay-${participant.id}`,
      type: 'payment',
      timestamp: participant.created_at ?? new Date().toISOString(), // Ideally we'd have a separate payment timestamp
      title: 'Betaling ontvangen',
      description: `€${participant.amount_paid ? participant.amount_paid.toFixed(2) : (participant.formula === 'with_meals' ? '20.00' : '10.00')} betaald`,
      icon: 'check-circle',
      color: 'green',
      metadata: {
        amount: participant.amount_paid,
        status: participant.payment_status,
      }
    });
  } else if (participant.payment_status === 'pending') {
    timeline.push({
      id: `pay-${participant.id}`,
      type: 'payment',
      timestamp: participant.created_at ?? new Date().toISOString(),
      title: 'Betaling in behandeling',
      description: 'Wachtend op bevestiging',
      icon: 'clock',
      color: 'yellow',
      metadata: {
        status: participant.payment_status,
      }
    });
  }

  // 3. Main check-in event
  if (participant.checked_in && participant.checked_in_at) {
    timeline.push({
      id: `checkin-${participant.id}`,
      type: 'check_in',
      timestamp: participant.checked_in_at ?? new Date().toISOString(),
      title: 'Ingecheckt bij start',
      description: 'Deelnemer is aangekomen en ingecheckt',
      icon: 'check-square',
      color: 'green',
    });
  }

  // 4. Rally zone check-ins
  const { data: zoneCheckIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*')
    .eq('participant_id', participantId)
    .order('checked_in_at', { ascending: true });

  zoneCheckIns?.forEach((checkin: any) => {
    timeline.push({
      id: `zone-${checkin.id}`,
      type: 'zone_checkin',
      timestamp: checkin.checked_in_at,
      title: `Rally Zone ${checkin.zone_id}`,
      description: checkin.notes || 'Zone check-in',
      icon: 'map-pin',
      color: 'purple',
      metadata: {
        zone_id: checkin.zone_id,
        odometer_reading: checkin.odometer_reading,
        location: checkin.location_lat && checkin.location_lng 
          ? { coordinates: [parseFloat(checkin.location_lng), parseFloat(checkin.location_lat)] }
          : null,
      }
    });
  });

  // 5. Photo submissions
  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select('*')
    .eq('participant_id', participantId)
    .order('created_at', { ascending: true });

  photos?.forEach((photo: any) => {
    timeline.push({
      id: `photo-${photo.id}`,
      type: 'photo_submission',
      timestamp: photo.created_at,
      title: 'Foto ingediend',
      description: photo.caption || 'Foto geüpload',
      icon: 'camera',
      color: 'pink',
      metadata: {
        photo_url: photo.photo_url,
        caption: photo.caption,
        location: photo.location,
      }
    });
  });

  // 6. Achievements earned
  const { data: achievements } = await supabaseAdmin
    .from('participant_achievements')
    .select('*, achievements(name, title, description, icon, points)')
    .eq('participant_id', participantId)
    .order('earned_at', { ascending: true });

  achievements?.forEach((achievement: any) => {
    timeline.push({
      id: `ach-${achievement.id}`,
      type: 'achievement',
      timestamp: achievement.earned_at,
      title: `Achievement: ${achievement.achievements?.title || achievement.achievements?.name}`,
      description: achievement.achievements?.description || '',
      icon: 'award',
      color: 'yellow',
      metadata: {
        achievement_name: achievement.achievements?.name,
        points: achievement.achievements?.points,
      }
    });
  });

  // 7. Emergency SOS
  const { data: sosAlerts } = await supabaseAdmin
    .from('emergency_sos')
    .select('*')
    .eq('participant_id', participantId)
    .order('created_at', { ascending: true });

  sosAlerts?.forEach((sos: any) => {
    timeline.push({
      id: `sos-${sos.id}`,
      type: 'emergency',
      timestamp: sos.created_at,
      title: `SOS Alert: ${sos.status}`,
      description: sos.message || 'Noodoproep',
      icon: 'alert-triangle',
      color: 'red',
      metadata: {
        status: sos.status,
        location: sos.location,
        message: sos.message,
      }
    });
  });

  // Sort timeline by timestamp
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { 
    participant,
    timeline,
  };
}

export default function ParticipantTimeline() {
  const { participant, timeline } = useLoaderData<typeof loader>();

  const getIconColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
              <Icon name="clock" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Deelnemer Tijdlijn</h1>
              <p className="text-xl text-indigo-100 mt-1">
                {participant.first_name} {participant.last_name}
              </p>
            </div>
          </div>
          <div className="text-indigo-100 space-y-1">
            <p>{participant.email}</p>
            <p>{participant.motorcycle_brand} {participant.motorcycle_model}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to={`/admin/participants`}
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <Icon name="arrow-left" className="w-4 h-4 mr-2" />
            Terug naar Deelnemers
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Totaal Events</div>
            <div className="text-2xl font-bold text-gray-900">{timeline.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Zone Check-ins</div>
            <div className="text-2xl font-bold text-purple-600">
              {timeline.filter(e => e.type === 'zone_checkin').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Foto's</div>
            <div className="text-2xl font-bold text-pink-600">
              {timeline.filter(e => e.type === 'photo_submission').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Achievements</div>
            <div className="text-2xl font-bold text-yellow-600">
              {timeline.filter(e => e.type === 'achievement').length}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Tijdlijn</h2>
          
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((event, index) => {
                const colorClasses = getIconColorClasses(event.color);
                
                return (
                  <div key={event.id} className="relative pl-10 pb-8 last:pb-0">
                    {/* Timeline line */}
                    {index < timeline.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-2 ${colorClasses.border} ${colorClasses.bg} flex items-center justify-center`}>
                      <Icon name={event.icon as any} className={`w-5 h-5 ${colorClasses.text}`} />
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {new Date(event.timestamp).toLocaleString('nl-BE', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{event.description}</p>
                      
                      {/* Additional metadata */}
                      {event.metadata && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {event.type === 'zone_checkin' && event.metadata.location && (
                              <div>
                                <span className="text-gray-500">Locatie:</span>
                                <span className="ml-1 text-gray-700">
                                  {event.metadata.location.coordinates[1].toFixed(4)}, 
                                  {event.metadata.location.coordinates[0].toFixed(4)}
                                </span>
                              </div>
                            )}
                            {event.type === 'payment' && event.metadata.amount && (
                              <div>
                                <span className="text-gray-500">Bedrag:</span>
                                <span className="ml-1 font-semibold text-green-600">
                                  €{(event.metadata.amount / 100).toFixed(2)}
                                </span>
                              </div>
                            )}
                            {event.type === 'achievement' && event.metadata.points && (
                              <div>
                                <span className="text-gray-500">Punten:</span>
                                <span className="ml-1 font-semibold text-yellow-600">
                                  +{event.metadata.points}
                                </span>
                              </div>
                            )}
                            {event.type === 'photo_submission' && event.metadata.photo_url && (
                              <div className="col-span-2 mt-2">
                                <img 
                                  src={event.metadata.photo_url} 
                                  alt="Submission" 
                                  className="rounded max-h-32 object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="clock" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nog geen activiteiten in de tijdlijn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
