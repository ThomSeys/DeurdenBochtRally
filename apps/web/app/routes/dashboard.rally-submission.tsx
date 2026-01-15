import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';

import { redirect } from 'react-router';
import { Form, useActionData, useLoaderData, Link } from 'react-router';
import { useState, useRef } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { calculateRallyPoints } from '~/lib/utils';
import Header from '~/components/Header';
import { sanityClient } from '~/lib/sanity.server';
import PortableText from '~/components/PortableText';
import MapView from '~/components/MapView';
import { sendEmail, rallySubmissionEmail } from '~/lib/email.server';
import { checkAndUnlockAchievements } from '~/lib/achievements.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Codes Indienen - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get existing submission
  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', userId)
    .single();

  // Get zone-level submissions with shadow scores
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('zone_id, rhythm_score, view_score, shadow_score, zone_time_minutes')
    .eq('participant_id', userId)
    .order('zone_id', { ascending: true });

  // Get scoreboard - all participants with their scores (including achievements)
  const { data: allParticipants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, motorcycle_brand, motorcycle_model, total_achievement_points');

  const { data: rallySubmissions } = await supabaseAdmin
    .from('rally_submissions')
    .select('participant_id, total_points, shadow_total, final_score')
    .not('final_score', 'is', null);

  // Combine rally scores with achievement points
  const scoreboard = (allParticipants || [])
    .map((participant: any) => {
      const submission = rallySubmissions?.find(s => s.participant_id === participant.id);
      return {
        participant_id: participant.id,
        final_score: (submission?.final_score || 0) + (participant.total_achievement_points || 0),
        total_points: submission?.total_points || 0,
        shadow_total: submission?.shadow_total || 0,
        achievement_points: participant.total_achievement_points || 0,
        participants: {
          first_name: participant.first_name,
          last_name: participant.last_name,
          motorcycle_brand: participant.motorcycle_brand,
          motorcycle_model: participant.motorcycle_model,
        }
      };
    })
    .filter(p => p.final_score > 0 || p.total_points > 0)
    .sort((a: any, b: any) => b.final_score - a.final_score);

  // Get shadow score explanation from Sanity
  const shadowScoreExplanation = await sanityClient.fetch(
    `*[_type == "pageContent" && page == "rally" && section == "shadow-score-explanation"][0]{
      title,
      content
    }`
  );

  // Get rally zones with coordinates
  const rallyZones = await sanityClient.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      title,
      order,
      startLocation,
      endLocation
    }`
  );

  return { user, submission, zoneSubmissions: zoneSubmissions || [], scoreboard: scoreboard || [], shadowScoreExplanation, rallyZones: rallyZones || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[dashboard.rally-submission] action start');

  try {
    const userId = await requireUserId(request);
    const formData = await request.formData();

    const action = formData.get('action');

  // Handle immediate odometer updates
  if (action === 'update_odometer') {
    const startKm = formData.get('start_km');
    const endKm = formData.get('end_km');
    const startKmLocked = formData.get('start_km_locked') === 'true';
    const endKmLocked = formData.get('end_km_locked') === 'true';
    const totalDistance = formData.get('total_distance');

    // Check if existing submission exists
    const { data: existing } = await supabaseAdmin
      .from('rally_submissions')
      .select('id')
      .eq('participant_id', userId)
      .single();

    const updateData: any = {};
    if (startKm) {
      updateData.start_km = parseFloat(startKm as string);
      updateData.start_km_locked = startKmLocked;
    }
    if (endKm) {
      updateData.end_km = parseFloat(endKm as string);
      updateData.end_km_locked = endKmLocked;
    }
    if (totalDistance) {
      updateData.total_distance = parseFloat(totalDistance as string);
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from('rally_submissions')
        .update(updateData)
        .eq('participant_id', userId);

      if (error) {
        console.error('Update odometer error:', error);
        return { error: 'Er ging iets mis bij het opslaan.', status: 500 };
      }
    } else {
      const { error } = await supabaseAdmin
        .from('rally_submissions')
        .insert({
          participant_id: userId,
          ...updateData,
        });

      if (error) {
        console.error('Insert odometer error:', error);
        return { error: 'Er ging iets mis bij het opslaan.', status: 500 };
      }
    }

    return { success: true };
  }

  const submissionData = {
    rz1_code: formData.get('rz1_code') as string | null,
    rz2_code: formData.get('rz2_code') as string | null,
    rz3_code: formData.get('rz3_code') as string | null,
    rz4_code: formData.get('rz4_code') as string | null,
    rz5_code: formData.get('rz5_code') as string | null,
    rz6_code: formData.get('rz6_code') as string | null,
    rz7_code: formData.get('rz7_code') as string | null,
    rz8_code: formData.get('rz8_code') as string | null,
  };

  // Collect GPS data for each zone
  const zoneGpsData: Record<number, { lat: number; lng: number; accuracy: number } | null> = {};
  for (let i = 1; i <= 8; i++) {
    const lat = formData.get(`rz${i}_answer_lat`);
    const lng = formData.get(`rz${i}_answer_lng`);
    const accuracy = formData.get(`rz${i}_answer_accuracy`);
    
    if (lat && lng && accuracy) {
      zoneGpsData[i] = {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
        accuracy: parseFloat(accuracy as string),
      };
    } else {
      zoneGpsData[i] = null;
    }
  }

  // Guard check: Verify that user has started each zone before allowing submission
    const { data: zoneEntries } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('zone_id')
      .eq('participant_id', userId);

  // Map zone_id to a normalized format for comparison
  // zone_id could be numeric (1, 2, 3...) or string format (rz1, rz2...)
  const startedZones = new Set(
    (zoneEntries || []).map((entry) => {
      const zoneId = entry.zone_id;
      // Normalize to just the number for comparison
      if (typeof zoneId === 'string') {
        // Extract number from formats like "rz1", "zone1", or just "1"
        const match = zoneId.match(/\d+/);
        return match ? parseInt(match[0], 10) : zoneId;
      }
      return zoneId;
    })
  );

    console.info('[dashboard.rally-submission] started zones', { started: Array.from(startedZones) });

  // Check each zone code that's being submitted
  for (let i = 1; i <= 8; i++) {
    const code = submissionData[`rz${i}_code` as keyof typeof submissionData];
    if (code && code.trim()) {
      // User is trying to submit a code for this zone
      // Check against normalized zone number
      if (!startedZones.has(i) && !startedZones.has(`rz${i}`) && !startedZones.has(`${i}`)) {
        return {
          error: `Je kunt geen code indienen voor Rally Zone ${i} zonder de zone eerst te hebben gestart. Start de zone door naar de start locatie te rijden.`,
          status: 403
        };
      }

      // Update the zone submission with answer GPS data if available
      const gpsData = zoneGpsData[i];
      if (gpsData) {
        const { error: updateError } = await supabaseAdmin
          .from('rally_zone_submissions')
          .update({
            answer_latitude: gpsData.lat,
            answer_longitude: gpsData.lng,
            answer_accuracy: gpsData.accuracy,
            answer_timestamp: new Date().toISOString(),
          })
          .eq('participant_id', userId)
          .eq('zone_id', i.toString());

        if (updateError) {
          console.warn(`[dashboard.rally-submission] failed to update GPS for zone ${i}:`, updateError);
        } else {
          console.info(`[dashboard.rally-submission] updated answer GPS for zone ${i}`, { 
            lat: gpsData.lat, 
            lng: gpsData.lng, 
            accuracy: gpsData.accuracy 
          });
        }
      }
    }
  }

  // Get distance values and locked states
  const startKm = formData.get('start_km');
  const endKm = formData.get('end_km');
  const startKmLocked = formData.get('start_km_locked') === 'true';
  const endKmLocked = formData.get('end_km_locked') === 'true';
  
  // Calculate total distance if both values provided
  let totalDistance = null;
  if (startKm && endKm) {
    const start = parseFloat(startKm as string);
    const end = parseFloat(endKm as string);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      totalDistance = end - start;
    }
  }

  // Calculate points
  const totalPoints = calculateRallyPoints(submissionData);

  // Count completed zones
  const completedZones = [
    submissionData.rz1_code,
    submissionData.rz2_code,
    submissionData.rz3_code,
    submissionData.rz4_code,
    submissionData.rz5_code,
    submissionData.rz6_code,
    submissionData.rz7_code,
    submissionData.rz8_code,
  ].filter((code) => code && code.trim()).length;

  // Check if at least one zone is completed
  if (completedZones === 0) {
    return {  error: 'Vul minstens één rally zone code in', status: 400 };
  }

  // Check if existing submission exists
  const { data: existing } = await supabaseAdmin
    .from('rally_submissions')
    .select('id')
    .eq('participant_id', userId)
    .single();

  const dataToSave = {
    ...submissionData,
    total_points: totalPoints,
    total_distance: totalDistance,
    start_km: startKm ? parseFloat(startKm as string) : null,
    end_km: endKm ? parseFloat(endKm as string) : null,
    start_km_locked: startKmLocked,
    end_km_locked: endKmLocked,
    submitted_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing submission
      const { error } = await supabaseAdmin
        .from('rally_submissions')
        .update(dataToSave)
        .eq('participant_id', userId);

      if (error) {
        console.error('[dashboard.rally-submission] update error', error);
        return {  error: 'Er ging iets mis bij het bijwerken. Probeer opnieuw.', status: 500 };
      }
  } else {
    // Create new submission
      const { error } = await supabaseAdmin
        .from('rally_submissions')
        .insert({
          participant_id: userId,
          ...dataToSave,
        });

      if (error) {
        console.error('[dashboard.rally-submission] insert error', error);
        return {  error: 'Er ging iets mis bij het opslaan. Probeer opnieuw.', status: 500 };
      }
  }

    // Get participant details for email
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', userId)
      .single();

    if (participant) {
      // Get leaderboard rank
      const { data: leaderboard } = await supabaseAdmin
        .rpc('get_leaderboard');
      
      const rank = leaderboard?.findIndex((entry: any) => entry.participant_id === userId) + 1;

      // Send rally submission confirmation email
      const email = rallySubmissionEmail({
        ...participant,
        total_points: totalPoints,
        zones_completed: completedZones,
        total_distance: totalDistance || 0,
        rank: rank > 0 ? rank : undefined,
      });

      await sendEmail({
        to: participant.email,
        ...email,
      });

      // Log email
      await supabaseAdmin.from('email_logs').insert({
        participant_id: userId,
        email_type: 'rally_submission',
        recipient_email: participant.email,
        subject: email.subject,
      });

      // Check and unlock achievements
      await checkAndUnlockAchievements(userId);
    }

    console.info('[dashboard.rally-submission] action success', { action });
    return redirect('/dashboard?success=rally');
  } catch (error) {
    console.error('[dashboard.rally-submission] action error', error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function RallySubmission() {
  const { user, submission, zoneSubmissions, scoreboard, shadowScoreExplanation, rallyZones } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [activeZone, setActiveZone] = useState(1);
  const [startKm, setStartKm] = useState(submission?.start_km?.toString() || '');
  const [endKm, setEndKm] = useState(submission?.end_km?.toString() || '');
  const [startKmLocked, setStartKmLocked] = useState(submission?.start_km_locked || false);
  const [endKmLocked, setEndKmLocked] = useState(submission?.end_km_locked || false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [zoneGpsData, setZoneGpsData] = useState<Record<number, { lat: number; lng: number; accuracy: number } | null>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Calculate total distance when both values are available
  const calculateDistance = () => {
    if (startKm && endKm) {
      const start = parseFloat(startKm);
      const end = parseFloat(endKm);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        return end - start;
      }
    }
    return submission?.total_distance || null;
  };

  const totalDistance = calculateDistance();

  const handleStartKmBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !startKmLocked && value !== submission?.start_km?.toString()) {
      const confirmed = window.confirm(
        'Let op: De start kilometerstand kan na bevestiging niet meer worden aangepast. Wil je deze waarde opslaan?'
      );
      if (confirmed) {
        // Submit immediately to database
        const formData = new FormData();
        formData.append('action', 'update_odometer');
        formData.append('start_km', value);
        formData.append('start_km_locked', 'true');
        
        const response = await fetch(window.location.pathname, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          setStartKm(value);
          setStartKmLocked(true);
        } else {
          alert('Er ging iets mis bij het opslaan. Probeer opnieuw.');
          e.target.value = startKm;
        }
      } else {
        e.target.value = startKm;
      }
    }
  };

  const handleEndKmBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !endKmLocked && value !== submission?.end_km?.toString()) {
      // Validate that end is higher than start
      const start = parseFloat(startKm);
      const end = parseFloat(value);
      
      if (!startKm || isNaN(start)) {
        alert('Vul eerst de start kilometerstand in.');
        e.target.value = endKm;
        return;
      }
      
      if (isNaN(end) || end <= start) {
        alert('De eind kilometerstand moet hoger zijn dan de start kilometerstand.');
        e.target.value = endKm;
        return;
      }
      
      const confirmed = window.confirm(
        'Let op: De eind kilometerstand kan na bevestiging niet meer worden aangepast. Wil je deze waarde opslaan?'
      );
      if (confirmed) {
        // Calculate total distance
        const distance = end - start;

        // Submit immediately to database
        const formData = new FormData();
        formData.append('action', 'update_odometer');
        formData.append('end_km', value);
        formData.append('end_km_locked', 'true');
        if (distance !== null) {
          formData.append('total_distance', distance.toString());
        }
        
        const response = await fetch(window.location.pathname, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          setEndKm(value);
          setEndKmLocked(true);
        } else {
          alert('Er ging iets mis bij het opslaan. Probeer opnieuw.');
          e.target.value = endKm;
        }
      } else {
        e.target.value = endKm;
      }
    }
  };

  const zones = [
    { id: 1, name: 'RZ1', color: 'green' },
    { id: 2, name: 'RZ2', color: 'yellow' },
    { id: 3, name: 'RZ3', color: 'orange' },
    { id: 4, name: 'RZ4', color: 'red' },
    { id: 5, name: 'RZ5', color: 'green' },
    { id: 6, name: 'RZ6', color: 'yellow' },
    { id: 7, name: 'RZ7', color: 'orange' },
    { id: 8, name: 'RZ8', color: 'red' },
  ];

  const getZoneSubmission = (zoneNum: number) => {
    return zoneSubmissions.find((_, idx) => idx + 1 === zoneNum);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area - Left/Center */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-sm shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Rally Codes Indienen
              </h1>
              <p className="text-gray-600 mb-8">
                Vul de codes in die je gevonden hebt bij de Rally Zone checkpunten
              </p>

              {actionData?.error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {actionData.error}
                </div>
              )}

              {/* Zone Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-2 overflow-x-auto">
                  {zones.map((zone) => {
                    const hasCode = submission?.[`rz${zone.id}_code` as keyof typeof submission];
                    const zoneScore = getZoneSubmission(zone.id);
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setActiveZone(zone.id)}
                        className={`
                          whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                          ${activeZone === zone.id
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{zone.name}</span>
                          {hasCode && <span className="text-green-600">✓</span>}
                          {zoneScore?.shadow_score && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                              {zoneScore.shadow_score.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <form 
                ref={formRef}
                method="post" 
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Capture GPS for all zones that have codes
                  let pendingRequests = 0;
                  let completedRequests = 0;
                  
                  for (let i = 1; i <= 8; i++) {
                    const codeInput = formRef.current?.querySelector(`input[name="rz${i}_code"]`) as HTMLInputElement;
                    if (codeInput && codeInput.value.trim()) {
                      pendingRequests++;
                    }
                  }
                  
                  if (pendingRequests > 0 && 'geolocation' in navigator) {
                    // Capture GPS location
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        // Add GPS data to all zone code inputs
                        for (let i = 1; i <= 8; i++) {
                          const codeInput = formRef.current?.querySelector(`input[name="rz${i}_code"]`) as HTMLInputElement;
                          if (codeInput && codeInput.value.trim()) {
                            const latInput = formRef.current?.querySelector(`input[name="rz${i}_answer_lat"]`) as HTMLInputElement;
                            const lngInput = formRef.current?.querySelector(`input[name="rz${i}_answer_lng"]`) as HTMLInputElement;
                            const accuracyInput = formRef.current?.querySelector(`input[name="rz${i}_answer_accuracy"]`) as HTMLInputElement;
                            
                            if (latInput) latInput.value = position.coords.latitude.toString();
                            if (lngInput) lngInput.value = position.coords.longitude.toString();
                            if (accuracyInput) accuracyInput.value = position.coords.accuracy.toString();
                          }
                        }
                        // Submit the form
                        formRef.current?.submit();
                      },
                      (error) => {
                        console.warn('Location error:', error);
                        // Submit without GPS if geolocation fails
                        formRef.current?.submit();
                      }
                    );
                  } else {
                    // No codes submitted or geolocation not available, submit as-is
                    formRef.current?.submit();
                  }
                }}
              >
                {/* Zone Input Cards */}
                {zones.map((zone) => {
                  const zoneScore = getZoneSubmission(zone.id);
                  return (
                    <div
                      key={zone.id}
                      className={activeZone === zone.id ? 'block' : 'hidden'}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold text-gray-900">Rally Zone {zone.id}</h2>
                          {zoneScore?.zone_time_minutes && (
                            <span className="text-sm text-gray-600">
                              {zoneScore.zone_time_minutes} minuten
                            </span>
                          )}
                        </div>

                        {/* Map View */}
                        {rallyZones[zone.id - 1]?.startLocation && rallyZones[zone.id - 1]?.endLocation && (
                          <div className="rounded-sm overflow-hidden shadow-md border border-gray-200">
                            <MapView
                              key={`map-${zone.id}-${activeZone}`}
                              startPoint={rallyZones[zone.id - 1].startLocation}
                              endPoint={rallyZones[zone.id - 1].endLocation}
                              className="h-64 w-full"
                            />
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor={`rz${zone.id}_code`}
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Code
                          </label>
                          <input
                            id={`rz${zone.id}_code`}
                            name={`rz${zone.id}_code`}
                            type="text"
                            defaultValue={submission?.[`rz${zone.id}_code` as keyof typeof submission] as string || ''}
                            className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg uppercase"
                            placeholder="Vul hier de code in..."
                          />
                        </div>

                        {/* Zone Shadow Score Display */}
                        {zoneScore?.shadow_score !== null && zoneScore?.shadow_score !== undefined && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-sm p-5 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                                <span className="text-lg mr-2">🎯</span>
                                Zone Score
                              </h3>
                              <span className="text-2xl font-bold text-primary-600">
                                {zoneScore.shadow_score?.toFixed(0) || '0'}
                                <span className="text-sm text-gray-500">/100</span>
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-600 flex items-center">
                                    <span className="mr-1">⏱️</span>
                                    Ritme
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {zoneScore.rhythm_score?.toFixed(1) || '0.0'}/50
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(zoneScore.rhythm_score || 0)}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-600 flex items-center">
                                    <span className="mr-1">👁️</span>
                                    Blik
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {zoneScore.view_score?.toFixed(1) || '0.0'}/50
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(zoneScore.view_score || 0)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setActiveZone(Math.max(1, activeZone - 1))}
                            disabled={activeZone === 1}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ← Vorige
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveZone(Math.min(8, activeZone + 1))}
                            disabled={activeZone === 8}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Volgende →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Hidden inputs for all zones */}
                {zones.map((zone) => {
                  if (activeZone !== zone.id) {
                    return (
                      <input
                        key={zone.id}
                        type="hidden"
                        name={`rz${zone.id}_code`}
                        value={submission?.[`rz${zone.id}_code` as keyof typeof submission] as string || ''}
                      />
                    );
                  }
                  return null;
                })}

                {/* Distance Calculation Section */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Totale Afstand</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_km" className="block text-sm font-medium text-gray-700 mb-2">
                        Start kilometerstand
                        {startKmLocked && <span className="ml-2 text-xs text-green-600">✓ Vergrendeld</span>}
                      </label>
                      <input
                        id="start_km"
                        name="start_km"
                        type="number"
                        step="0.1"
                        defaultValue={startKm}
                        onBlur={handleStartKmBlur}
                        disabled={startKmLocked}
                        className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Bijv. 12345.6"
                      />
                      {!startKmLocked && (
                        <p className="mt-1 text-xs text-amber-600">
                          ⚠️ Na invullen kan deze waarde niet meer worden aangepast
                        </p>
                      )}
                      <input type="hidden" name="start_km_locked" value={startKmLocked.toString()} />
                    </div>
                    <div>
                      <label htmlFor="end_km" className="block text-sm font-medium text-gray-700 mb-2">
                        Eind kilometerstand
                        {endKmLocked && <span className="ml-2 text-xs text-green-600">✓ Vergrendeld</span>}
                      </label>
                      <input
                        id="end_km"
                        name="end_km"
                        type="number"
                        step="0.1"
                        defaultValue={endKm}
                        onBlur={handleEndKmBlur}
                        disabled={endKmLocked}
                        className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Bijv. 12845.3"
                      />
                      {!endKmLocked && (
                        <p className="mt-1 text-xs text-amber-600">
                          ⚠️ Na invullen kan deze waarde niet meer worden aangepast
                        </p>
                      )}
                      <input type="hidden" name="end_km_locked" value={endKmLocked.toString()} />
                    </div>
                  </div>
                  {totalDistance !== null && totalDistance !== undefined && (
                    <p className="mt-3 text-sm text-gray-600">
                      Gereden afstand: <strong>{totalDistance.toFixed(1)} km</strong>
                      {totalDistance >= 500 && (
                        <span className="ml-2 text-green-600">✓ Meer dan 500 km (+10 punten)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t">
                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-sm text-lg transition-colors"
                  >
                    Codes opslaan
                  </button>
                </div>
                
                {/* Hidden GPS inputs for each zone */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((zoneId) => (
                  <div key={`gps-${zoneId}`} style={{ display: 'none' }}>
                    <input type="hidden" name={`rz${zoneId}_answer_lat`} />
                    <input type="hidden" name={`rz${zoneId}_answer_lng`} />
                    <input type="hidden" name={`rz${zoneId}_answer_accuracy`} />
                  </div>
                ))}
              </form>
            </div>
          </div>

          {/* Scoreboard Sidebar - Right */}
          <div className="lg:col-span-1">
            {/* Total Shadow Score Card */}
            {submission?.shadow_total !== null && submission?.shadow_total !== undefined && (
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-sm shadow-lg p-6 mb-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 text-9xl">🏆</div>
                <div className="relative z-10">
                  <div className="text-sm font-semibold mb-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">⚡</span>
                      Je Schaduwscore
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExplanationModal(true)}
                      className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      title="Uitleg schaduwscore"
                    >
                      <span className="text-sm">ℹ️</span>
                    </button>
                  </div>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <div className="text-5xl font-bold">{submission.shadow_total.toFixed(0)}</div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${(submission.shadow_total / 800) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-primary-100 mt-2">
                    {submission.shadow_total >= 600 ? '🔥 Uitstekend!' : 
                     submission.shadow_total >= 400 ? '👍 Goed bezig!' : 
                     submission.shadow_total >= 200 ? '💪 Blijf doorgaan!' : 
                     '🎯 Eerste stappen'}
                  </div>
                </div>
              </div>
            )}

            {/* Scoreboard */}
            <div className="bg-white rounded-sm shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Klassement</h2>
              
              {scoreboard.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nog geen scores beschikbaar
                </p>
              ) : (
                <div className="space-y-2">
                  {scoreboard.slice(0, 10).map((entry: any, index: number) => {
                    const isCurrentUser = entry.participants.first_name === user.first_name && 
                                         entry.participants.last_name === user.last_name;
                    return (
                      <div
                        key={index}
                        className={`
                          p-3 rounded-sm transition-colors
                          ${index === 0 ? 'bg-yellow-50' : ''}
                          ${index === 1 ? 'bg-gray-50' : ''}
                          ${index === 2 ? 'bg-orange-50' : ''}
                          ${isCurrentUser ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              {index === 0 && <span className="text-lg">🏆</span>}
                              {index === 1 && <span className="text-lg">🥈</span>}
                              {index === 2 && <span className="text-lg">🥉</span>}
                              <span className="text-sm font-bold text-gray-900">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary-700' : 'text-gray-900'}`}>
                                {entry.participants.first_name} {entry.participants.last_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {entry.participants.motorcycle_brand} {entry.participants.motorcycle_model}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-sm font-bold text-gray-900">
                              {entry.total_points || 0}
                            </div>
                            <div className="text-xs text-gray-500">pts</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {scoreboard.length > 10 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{scoreboard.length - 10} meer deelnemers
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shadow Score Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {shadowScoreExplanation?.title || 'Hoe werkt de Schaduwscore?'}
              </h2>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6">
              {shadowScoreExplanation?.content ? (
                <PortableText value={shadowScoreExplanation.content} />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p>
                    De Schaduwscore is een verborgen score die je prestaties tijdens de rally meet.
                    Deze score wordt berekend op basis van twee factoren:
                  </p>
                  <h3>⏱️ Ritme (0-50 punten)</h3>
                  <p>
                    Meet hoe consistent je bent in je timing. Hoe dichter je bij de mediaan tijd van alle deelnemers zit,
                    hoe hoger je ritme score.
                  </p>
                  <h3>👁️ Blik (0-50 punten)</h3>
                  <p>
                    Meet hoe nauwkeurig en uniek je antwoorden zijn. Correcte antwoorden leveren punten op,
                    en unieke observaties worden extra beloond.
                  </p>
                  <p className="mt-4">
                    <strong>Totaal:</strong> Je Schaduwscore is de som van Ritme en Blik per zone (max 100 punten per zone, 800 punten totaal).
                  </p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-sm transition-colors"
              >
                Begrepen!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
