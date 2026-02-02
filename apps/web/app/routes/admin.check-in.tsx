import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useActionData, Form, Link } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Check-in - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get unchecked participants for main check-in
  const { data: uncheckedParticipants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, motorcycle_brand, motorcycle_model, license_plate, formula, ride_type')
    .eq('payment_status', 'completed')
    .eq('checked_in', false)
    .order('first_name', { ascending: true });

  // Get checked-in participants for zone check-in
  const { data: checkedInParticipants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, motorcycle_brand, motorcycle_model')
    .eq('payment_status', 'completed')
    .eq('checked_in', true)
    .order('first_name', { ascending: true });

  // Get today's check-ins
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayCheckIns, count } = await supabaseAdmin
    .from('participants')
    .select('first_name, last_name, checked_in, created_at', { count: 'exact' })
    .eq('checked_in', true)
    .gte('checked_in_at', today.toISOString())
    .order('created_at', { ascending: false });

  return { 
    uncheckedParticipants: uncheckedParticipants || [],
    checkedInParticipants: checkedInParticipants || [],
    todayCheckIns: todayCheckIns || [], 
    checkInCount: count || 0 
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const requestLogger = createRequestLogger(request);

  try {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;
    const participantId = formData.get('participant_id') as string;

    await requestLogger.info('check-in', 'Admin check-in action initiated', { intent, participantId });

    if (!participantId) {
      await requestLogger.warn('check-in', 'Check-in failed: no participant selected');
      return { error: 'Selecteer een deelnemer', success: false };
    }

    const { data: participant, error: fetchError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (fetchError || !participant) {
      await requestLogger.error('check-in', 'Participant not found', fetchError as Error, { participantId });
      return { error: 'Deelnemer niet gevonden', success: false };
    }

    if (participant.payment_status !== 'completed') {
      await requestLogger.warn('check-in', 'Check-in rejected: payment not completed', { 
        participantId,
        paymentStatus: participant.payment_status 
      });
      return { 
        error: 'Betaling niet voltooid.',
        success: false,
        participant 
      };
    }

    if (intent === 'zone-checkin') {
      const zoneNumber = formData.get('zone_number') as string;
      
      if (!zoneNumber) {
        return { error: 'Selecteer een zone', success: false };
      }

      if (!participant.checked_in) {
        return { error: 'Deze deelnemer is nog niet ingecheckt', success: false };
      }

      const zoneOrder = parseInt(zoneNumber) - 1;
      const zone = await sanityClient.fetch(
        `*[_type == "rallyZone" && order == $order][0] { _id }`,
        { order: zoneOrder }
      );

      if (!zone || !zone._id) {
        return { error: 'Zone niet gevonden', success: false };
      }

      const { data: existing } = await supabaseAdmin
        .from('rally_zone_submissions')
        .select('id, entry_timestamp')
        .eq('participant_id', participantId)
        .eq('zone_id', zone._id)
        .single();

      if (existing) {
        return { 
          warning: `Zone ${zoneNumber} is al geregistreerd voor ${participant.first_name} ${participant.last_name}`,
          success: true,
          participant 
        };
      }

      const { error: insertError } = await supabaseAdmin
        .from('rally_zone_submissions')
        .insert({
          participant_id: participantId,
          zone_id: zone._id,
          entry_timestamp: new Date().toISOString(),
        });

      if (insertError) {
        return { 
          error: 'Fout bij het registreren van de zone',
          success: false 
        };
      }

      console.info('[admin.check-in] action success', { intent, participantId, zoneNumber });
      return { 
        success: true,
        message: `Zone ${zoneNumber} geregistreerd voor ${participant.first_name} ${participant.last_name}!`,
        participant 
      };
    }

    if (participant.checked_in) {
      return { 
        warning: 'Deze deelnemer is al ingecheckt.',
        success: true,
        participant 
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from('participants')
      .update({ checked_in: true })
      .eq('id', participant.id);

    if (updateError) {
      return { error: 'Er ging iets mis bij het inchecken', success: false };
    }

    console.info('[admin.check-in] action success', { intent: 'check-in', participantId });
    return { 
      success: true, 
      message: `${participant.first_name} ${participant.last_name} succesvol ingecheckt!`,
      participant 
    };
  } catch (error) {
    console.error('[admin.check-in] action error', error);
    return { error: 'Onverwachte fout', success: false };
  }
}

export default function AdminCheckIn() {
  const { uncheckedParticipants, checkedInParticipants, todayCheckIns, checkInCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [selectedZoneParticipant, setSelectedZoneParticipant] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [availableZones, setAvailableZones] = useState<number[]>([]);

  // Find selected participant details
  const selectedParticipantData = uncheckedParticipants.find((p: any) => p.id === selectedParticipant);

  // When zone participant changes, fetch their submitted zones
  const handleZoneParticipantChange = async (participantId: string) => {
    setSelectedZoneParticipant(participantId);
    setSelectedZone('');
    
    if (!participantId) {
      setAvailableZones([]);
      return;
    }

    // Fetch rally zone submissions for this participant
    const response = await fetch(`/api/rally-zone-submissions?participant_id=${participantId}`);
    if (response.ok) {
      const data = await response.json();
      
      // Find zones (1-8) that DON'T have submissions yet
      const submittedZoneIds = new Set(data.map((s: any) => parseInt(s.zone_id)));
      const zones: number[] = [];
      for (let i = 1; i <= 8; i++) {
        if (!submittedZoneIds.has(i)) {
          zones.push(i);
        }
      }
      setAvailableZones(zones);
    } else {
      // If no submissions exist yet, all zones are available
      setAvailableZones([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="checkSimple" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Check-in</h1>
          <p className="text-xl text-primary-100">Deelnemers inschrijven voor de rally</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Check-in Scanner</h1>
            <p className="text-gray-600 mt-2">Selecteer deelnemers om in te checken</p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Check-in Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-sm shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Deelnemer Check-in</h2>

              {actionData?.error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {actionData.error}
                </div>
              )}

              {actionData?.warning && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                  {actionData.warning}
                </div>
              )}

              {actionData?.success && actionData?.message && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {actionData.message}
                </div>
              )}

              {actionData?.participant && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Deelnemer Informatie</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Naam</label>
                      <p className="text-gray-900 font-medium">
                        {actionData.participant.first_name} {actionData.participant.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{actionData.participant.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Motor</label>
                      <p className="text-gray-900">
                        {actionData.participant.motorcycle_brand} {actionData.participant.motorcycle_model}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Kenteken</label>
                      <p className="text-gray-900">{actionData.participant.license_plate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Formule</label>
                      <p className="text-gray-900">
                        {actionData.participant.formula === 'with_meals' ? 'Met maaltijden' : 'Alleen ontbijt'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Rit Type</label>
                      <p className="text-gray-900">
                        {actionData.participant.ride_type === 'guided' ? 'Begeleide rit' : 'Vrije rit'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Form method="post" className="space-y-6" onSubmit={() => setSelectedParticipant('')}>
                <input type="hidden" name="intent" value="main-checkin" />
                <div>
                  <label htmlFor="participant_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecteer Deelnemer
                  </label>
                  <select
                    id="participant_id"
                    name="participant_id"
                    value={selectedParticipant}
                    onChange={(e) => setSelectedParticipant(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  >
                    <option value="">-- Kies een deelnemer --</option>
                    {uncheckedParticipants.map((participant: any) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.first_name} {participant.last_name} - {participant.motorcycle_brand} {participant.motorcycle_model}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-gray-600">
                    {uncheckedParticipants.length === 0 
                      ? 'Alle deelnemers zijn al ingecheckt!'
                      : `${uncheckedParticipants.length} deelnemer${uncheckedParticipants.length !== 1 ? 's' : ''} nog niet ingecheckt`
                    }
                  </p>
                </div>

                {selectedParticipantData && (
                  <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                    <p className="text-sm text-gray-600">Geselecteerde deelnemer:</p>
                    <p className="font-medium text-gray-900 text-lg">
                      {selectedParticipantData.first_name} {selectedParticipantData.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedParticipantData.motorcycle_brand} {selectedParticipantData.motorcycle_model}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedParticipant}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-sm font-bold text-lg transition-colors"
                >
                  Check In
                </button>
              </Form>
            </div>

            {/* Manual Zone Check-in */}
            <div className="bg-white rounded-sm shadow-lg p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Handmatige Rally Zone Check-in</h2>
              <p className="text-gray-600 mb-6">
                Vul rally zone codes in voor deelnemers die een zone bezocht hebben maar de code niet zelf hebben ingevoerd.
              </p>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="zone-checkin" />
                
                <div>
                  <label htmlFor="zone_participant_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecteer Deelnemer
                  </label>
                  <select
                    id="zone_participant_id"
                    name="participant_id"
                    value={selectedZoneParticipant}
                    onChange={(e) => handleZoneParticipantChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">-- Kies een deelnemer --</option>
                    {checkedInParticipants.map((participant: any) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.first_name} {participant.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="zone_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecteer Zone
                  </label>
                  <select
                    id="zone_number"
                    name="zone_number"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    required
                    disabled={!selectedZoneParticipant}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">-- Kies een zone --</option>
                    {availableZones.map((zone) => (
                      <option key={zone} value={zone}>
                        Rally Zone {zone}
                      </option>
                    ))}
                  </select>
                  {selectedZoneParticipant && availableZones.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      Deze deelnemer heeft alle zones al ingevuld of heeft nog geen rally inzending.
                    </p>
                  )}
                  {!selectedZoneParticipant && (
                    <p className="mt-2 text-sm text-gray-500">
                      Selecteer eerst een deelnemer
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedZoneParticipant || !selectedZone}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-sm font-bold text-lg transition-colors"
                >
                  Registreer Zone Check-in
                </button>
              </Form>
            </div>
          </div>

          {/* Today's Check-ins */}
          <div>
            <div className="bg-white rounded-sm shadow-lg p-6 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Vandaag Ingecheckt</p>
                <p className="text-5xl font-bold text-primary-600 mt-2">{checkInCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-sm shadow-lg p-6 mb-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Totaal Ingecheckt</p>
                  <p className="text-5xl font-bold text-primary-600 mt-2">{checkedInParticipants.length}</p>
                </div>
            </div>
            <div className="bg-white rounded-sm shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Recente Check-ins</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {todayCheckIns.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nog geen check-ins vandaag
                  </div>
                ) : (
                  todayCheckIns.map((checkIn: any, index: number) => (
                    <div key={index} className="p-3">
                      <p className="font-medium text-gray-900 text-sm">
                        {checkIn.first_name} {checkIn.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(checkIn.created_at).toLocaleTimeString('nl-BE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
