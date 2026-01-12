import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useActionData, Form, Link } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Check-in - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get all participants for manual check-in dropdown
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email')
    .eq('payment_status', 'completed')
    .order('first_name', { ascending: true });

  // Get today's check-ins
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayCheckIns, count } = await supabaseAdmin
    .from('participants')
    .select('first_name, last_name, checked_in, created_at', { count: 'exact' })
    .eq('checked_in', true)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  return { 
    participants: participants || [],
    todayCheckIns: todayCheckIns || [], 
    checkInCount: count || 0 
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;

  // QR Code check-in
  if (!action || action === 'qr') {
    const qrCode = formData.get('qr_code') as string;

    if (!qrCode || !qrCode.trim()) {
      return { error: 'Vul een QR code in', success: false };
    }

    // Find participant by QR code
    const { data: participant, error: fetchError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('qr_code', qrCode.trim())
      .single();

    if (fetchError || !participant) {
      return { error: 'QR code niet gevonden', success: false };
    }

    if (participant.payment_status !== 'completed') {
      return { 
        error: 'Betaling niet voltooid. Deze deelnemer kan niet ingecheckt worden.',
        success: false,
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

    // Check in the participant
    const { error: updateError } = await supabaseAdmin
      .from('participants')
      .update({ checked_in: true })
      .eq('id', participant.id);

    if (updateError) {
      return { error: 'Er ging iets mis bij het inchecken', success: false };
    }

    return { 
      success: true, 
      message: `${participant.first_name} ${participant.last_name} succesvol ingecheckt!`,
      participant 
    };
  }

  // Manual zone check-in
  if (action === 'manual_zone') {
    const participantId = formData.get('participant_id') as string;
    const zoneId = formData.get('zone_id') as string;

    if (!participantId || !zoneId) {
      return { error: 'Selecteer een deelnemer en zone', success: false };
    }

    // Get participant info
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('first_name, last_name')
      .eq('id', participantId)
      .single();

    // Check if already checked in for this zone
    const { data: existing } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('id, entry_timestamp')
      .eq('participant_id', participantId)
      .eq('zone_id', zoneId)
      .single();

    if (existing?.entry_timestamp) {
      return {
        warning: `${participant?.first_name} ${participant?.last_name} is al ingecheckt bij zone ${zoneId}`,
        success: true
      };
    }

    // Update or insert check-in
    const { error: updateError } = await supabaseAdmin
      .from('rally_zone_submissions')
      .update({ entry_timestamp: new Date().toISOString() })
      .eq('participant_id', participantId)
      .eq('zone_id', zoneId);

    if (updateError) {
      return { error: 'Er ging iets mis bij het inchecken', success: false };
    }

    return {
      success: true,
      message: `${participant?.first_name} ${participant?.last_name} succesvol ingecheckt bij zone ${zoneId}!`
    };
  }

  return { error: 'Ongeldige actie', success: false };
}

export default function AdminCheckIn() {
  const { participants, todayCheckIns, checkInCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [qrCode, setQrCode] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [availableZones, setAvailableZones] = useState<number[]>([]);

  // When participant changes, fetch their submitted zones
  const handleParticipantChange = async (participantId: string) => {
    setSelectedParticipant(participantId);
    setSelectedZone('');
    
    if (!participantId) {
      setAvailableZones([]);
      return;
    }

    // Fetch rally submission for this participant
    const response = await fetch(`/api/rally-submission?participant_id=${participantId}`);
    if (response.ok) {
      const data = await response.json();
      
      // Find zones that DON'T have codes entered (unfilled zones)
      const zones: number[] = [];
      for (let i = 1; i <= 8; i++) {
        const code = data[`rz${i}_code`];
        if (!code || !code.trim()) {
          zones.push(i);
        }
      }
      setAvailableZones(zones);
    } else {
      setAvailableZones([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Check-in Scanner</h1>
            <p className="text-gray-600 mt-2">Scan QR codes om deelnemers in te checken</p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">QR Code Scanner</h2>

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
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
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

              <Form method="post" className="space-y-6" onSubmit={() => setQrCode('')}>
                <div>
                  <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code
                  </label>
                  <input
                    id="qr_code"
                    name="qr_code"
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    autoFocus
                    placeholder="Scan of typ de QR code..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Gebruik een QR scanner of typ de code handmatig in
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  Check In
                </button>
              </Form>
            </div>

            {/* Manual Zone Check-in */}
            <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Handmatige Zone Check-in</h2>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="action" value="manual_zone" />
                
                <div>
                  <label htmlFor="participant_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Deelnemer
                  </label>
                  <select
                    id="participant_id"
                    name="participant_id"
                    value={selectedParticipant}
                    onChange={(e) => handleParticipantChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecteer een deelnemer...</option>
                    {participants.map((participant: any) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.first_name} {participant.last_name} ({participant.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="zone_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Zone
                  </label>
                  <select
                    id="zone_id"
                    name="zone_id"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={availableZones.length === 0}
                    required
                  >
                    <option value="">
                      {selectedParticipant ? 'Selecteer een zone...' : 'Selecteer eerst een deelnemer'}
                    </option>
                    {availableZones.map((zoneId) => (
                      <option key={zoneId} value={zoneId}>
                        Zone {zoneId}
                      </option>
                    ))}
                  </select>
                  {selectedParticipant && availableZones.length === 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Deze deelnemer heeft nog geen zones ingevuld
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={availableZones.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  Check In bij Zone
                </button>
              </Form>
            </div>
          </div>

          {/* Today's Check-ins */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Vandaag Ingecheckt</p>
                <p className="text-5xl font-bold text-primary-600 mt-2">{checkInCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
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
