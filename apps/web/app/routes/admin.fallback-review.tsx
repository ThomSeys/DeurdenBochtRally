import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { Form, useLoaderData, useNavigation } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  // Check if user is admin
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('is_admin')
    .eq('id', user!.id)
    .single();

  if (!participant?.is_admin) {
    return { error: 'Unauthorized', success: false };
  }

  const formData = await request.formData();
  const actionType = formData.get('actionType');

  try {
    switch (actionType) {
      case 'approve_fallback': {
        const submissionId = formData.get('submissionId') as string;
        
        // Mark submission as valid and update fallback event
        await supabaseAdmin
          .from('rally_zone_submissions')
          .update({ valid: true })
          .eq('id', submissionId);

        // Resolve related fallback event
        const { data: submission } = await supabaseAdmin
          .from('rally_zone_submissions')
          .select('participant_id, zone_id')
          .eq('id', submissionId)
          .single();

        if (submission) {
          await (supabaseAdmin as any)
            .from('fallback_events')
            .update({
              resolved: true,
              resolution_notes: `Goedgekeurd door admin ${user!.id}`,
              resolved_at: new Date().toISOString()
            })
            .eq('participant_id', submission.participant_id)
            .eq('zone_id', submission.zone_id)
            .eq('resolved', false);
        }

        return { success: true, message: 'Fallback submission goedgekeurd' };
      }

      case 'reject_fallback': {
        const submissionId = formData.get('submissionId') as string;
        const reason = (formData.get('reason') as string) || 'Afgewezen door admin';
        
        // Mark submission as invalid
        await (supabaseAdmin as any)
          .from('rally_zone_submissions')
          .update({ 
            valid: false,
            points_override: 0,
            override_reason: reason,
            override_by: user!.id,
            override_at: new Date().toISOString()
          })
          .eq('id', submissionId);

        // Resolve related fallback event
        const { data: submission } = await supabaseAdmin
          .from('rally_zone_submissions')
          .select('participant_id, zone_id')
          .eq('id', submissionId)
          .single();

        if (submission) {
          await (supabaseAdmin as any)
            .from('fallback_events')
            .update({
              resolved: true,
              resolution_notes: `Afgewezen: ${reason}`,
              resolved_at: new Date().toISOString()
            })
            .eq('participant_id', submission.participant_id)
            .eq('zone_id', submission.zone_id)
            .eq('resolved', false);
        }

        return { success: true, message: 'Fallback submission afgewezen' };
      }

      case 'override_points': {
        const submissionId = formData.get('submissionId') as string;
        const points = parseInt(formData.get('points') as string);
        const reason = (formData.get('reason') as string) || 'Punten aangepast door admin';
        
        await (supabaseAdmin as any)
          .from('rally_zone_submissions')
          .update({
            points_override: points,
            override_reason: reason,
            override_by: user!.id,
            override_at: new Date().toISOString()
          })
          .eq('id', submissionId);

        return { success: true, message: `Punten aangepast naar ${points}` };
      }

      case 'verify_manual_entry': {
        const entryId = formData.get('entryId') as string;
        const points = parseInt(formData.get('points') as string);
        
        await (supabaseAdmin as any)
          .from('manual_checkpoint_entries')
          .update({
            verified: true,
            verified_by: user!.id,
            verified_at: new Date().toISOString(),
            points_awarded: points
          })
          .eq('id', entryId);

        return { success: true, message: 'Manual entry geverifieerd' };
      }

      case 'reopen_zone': {
        const closureId = formData.get('closureId') as string;
        
        await (supabaseAdmin as any)
          .from('zone_closures')
          .update({
            is_closed: false,
            reopened_at: new Date().toISOString(),
            reopened_by: user!.id
          })
          .eq('id', closureId);

        return { success: true, message: 'Zone heropend' };
      }

      default:
        return { error: 'Unknown action', success: false };
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return { error: 'Er ging iets mis', success: false };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  // Check if user is admin
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('is_admin')
    .eq('id', user!.id)
    .single();

  if (!participant?.is_admin) {
    throw new Response('Unauthorized', { status: 403 });
  }

  // Get fallback submissions needing review
  const { data: fallbackSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select(`
      id,
      zone_id,
      checkpoint_number,
      fallback_reason,
      fallback_notes,
      fallback_photo_url,
      submitted_answer,
      is_correct,
      valid,
      created_at,
      participant_id,
      participants (
        first_name,
        last_name,
        license_plate
      )
    `)
    .not('fallback_reason', 'is', null)
    .order('created_at', { ascending: false });

  // Get manual entries needing verification
  const { data: manualEntries } = await (supabaseAdmin as any)
    .from('manual_checkpoint_entries')
    .select(`
      *,
      participants (
        first_name,
        last_name,
        license_plate
      )
    `)
    .eq('verified', false)
    .order('submitted_at', { ascending: false });

  // Get fallback events
  const { data: fallbackEvents } = await (supabaseAdmin as any)
    .from('fallback_events')
    .select(`
      *,
      participants (
        first_name,
        last_name,
        license_plate
      )
    `)
    .eq('resolved', false)
    .order('event_timestamp', { ascending: false });

  // Get active zone closures
  const { data: zoneClosures } = await (supabaseAdmin as any)
    .from('zone_closures')
    .select('*')
    .eq('is_closed', true)
    .order('closed_at', { ascending: false });

  return { 
    fallbackSubmissions: fallbackSubmissions || [],
    manualEntries: manualEntries || [],
    fallbackEvents: fallbackEvents || [],
    zoneClosures: zoneClosures || []
  };
}

export default function AdminFallbackReview() {
  const { fallbackSubmissions, manualEntries, fallbackEvents, zoneClosures } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';

  const fallbackReasonLabels: Record<string, string> = {
    checkpoint_missed: 'Checkpoint niet gevonden',
    qr_damaged: 'QR code beschadigd',
    tech_failure: 'Technisch probleem',
    stuck_rule: 'Vastzitregel gebruikt',
    doubt_rule: 'Twijfelregel gebruikt',
    other: 'Andere reden'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="checkSimple" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Terugval Review</h1>
          <p className="text-xl text-primary-100">Goed terugval invoeren goed</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fallback Review Dashboard</h1>
          <p className="text-gray-600 mt-2">Beoordeel fallback submissions, manual entries en events</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Icon name="camera" className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-800">Fallback Photos</p>
                <p className="text-2xl font-bold text-yellow-900">{fallbackSubmissions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Icon name="edit" className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800">Manual Entries</p>
                <p className="text-2xl font-bold text-blue-900">{manualEntries.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Icon name="alert-triangle" className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-800">Fallback Events</p>
                <p className="text-2xl font-bold text-orange-900">{fallbackEvents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Icon name="x-circle" className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-800">Zone Closures</p>
                <p className="text-2xl font-bold text-red-900">{zoneClosures.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fallback Submissions */}
        {fallbackSubmissions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="camera" className="w-6 h-6" />
              Fallback Photo Submissions
            </h2>
            <div className="space-y-4">
              {fallbackSubmissions.map((submission: any) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        {submission.participants?.first_name} {submission.participants?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{submission.participants?.license_plate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Zone {submission.zone_id} - CP {submission.checkpoint_number}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.created_at).toLocaleString('nl-BE')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded mb-3">
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      {fallbackReasonLabels[submission.fallback_reason] || submission.fallback_reason}
                    </p>
                    {submission.fallback_notes && (
                      <p className="text-sm text-gray-700 italic">"{submission.fallback_notes}"</p>
                    )}
                  </div>
                  
                  {submission.fallback_photo_url && (
                    <div className="mb-3">
                      <img 
                        src={submission.fallback_photo_url} 
                        alt="Fallback location"
                        className="max-w-md rounded border border-gray-300"
                      />
                    </div>
                  )}
                  
                  {submission.submitted_answer && (
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Ingediend antwoord:</p>
                      <p className="font-mono text-sm">{submission.submitted_answer}</p>
                      <p className="text-xs mt-1">
                        Status: {submission.is_correct ? '✅ Correct' : '❌ Incorrect'}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Form method="post">
                      <input type="hidden" name="actionType" value="approve_fallback" />
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
                      >
                        {isSubmitting ? 'Bezig...' : 'Goedkeuren'}
                      </button>
                    </Form>
                    
                    <Form method="post">
                      <input type="hidden" name="actionType" value="reject_fallback" />
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                        onClick={(e) => {
                          const reason = prompt('Reden voor afwijzing:');
                          if (!reason) {
                            e.preventDefault();
                            return;
                          }
                          const form = e.currentTarget.form;
                          const input = document.createElement('input');
                          input.type = 'hidden';
                          input.name = 'reason';
                          input.value = reason;
                          form?.appendChild(input);
                        }}
                      >
                        Afwijzen
                      </button>
                    </Form>
                    
                    <Form method="post">
                      <input type="hidden" name="actionType" value="override_points" />
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                        onClick={(e) => {
                          const points = prompt('Aantal punten:');
                          if (!points || isNaN(parseInt(points))) {
                            e.preventDefault();
                            return;
                          }
                          const reason = prompt('Reden voor aanpassing:');
                          if (!reason) {
                            e.preventDefault();
                            return;
                          }
                          const form = e.currentTarget.form;
                          const pointsInput = document.createElement('input');
                          pointsInput.type = 'hidden';
                          pointsInput.name = 'points';
                          pointsInput.value = points;
                          const reasonInput = document.createElement('input');
                          reasonInput.type = 'hidden';
                          reasonInput.name = 'reason';
                          reasonInput.value = reason;
                          form?.appendChild(pointsInput);
                          form?.appendChild(reasonInput);
                        }}
                      >
                        Punten Aanpassen
                      </button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Entries */}
        {manualEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="edit" className="w-6 h-6" />
              Manual Entries (Finish Desk)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone/CP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tijd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {manualEntries.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-sm">
                        {entry.participants?.first_name} {entry.participants?.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        Z{entry.zone_id} - CP{entry.checkpoint_number}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{entry.submitted_code}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {entry.entry_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(entry.submitted_at).toLocaleTimeString('nl-BE')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Form method="post" className="inline">
                          <input type="hidden" name="actionType" value="verify_manual_entry" />
                          <input type="hidden" name="entryId" value={entry.id} />
                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                            onClick={(e) => {
                              const points = prompt('Aantal punten toe te kennen:');
                              if (!points || isNaN(parseInt(points))) {
                                e.preventDefault();
                                return;
                              }
                              const form = e.currentTarget.form;
                              const input = document.createElement('input');
                              input.type = 'hidden';
                              input.name = 'points';
                              input.value = points;
                              form?.appendChild(input);
                            }}
                          >
                            {isSubmitting ? 'Bezig...' : 'Verify'}
                          </button>
                        </Form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback Events */}
        {fallbackEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="alert-triangle" className="w-6 h-6" />
              Fallback Events Log
            </h2>
            <div className="space-y-2">
              {fallbackEvents.map((event: any) => (
                <div key={event.id} className="border-l-4 border-orange-400 bg-orange-50 p-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {event.participants?.first_name} {event.participants?.last_name} - Zone {event.zone_id}
                      </p>
                      <p className="text-sm text-gray-700">{event.event_type}</p>
                      {event.participant_notes && (
                        <p className="text-sm text-gray-600 italic mt-1">"{event.participant_notes}"</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(event.event_timestamp).toLocaleString('nl-BE')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone Closures */}
        {zoneClosures.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="x-circle" className="w-6 h-6" />
              Active Zone Closures
            </h2>
            <div className="space-y-3">
              {zoneClosures.map((closure: any) => (
                <div key={closure.id} className="bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-900">
                        Zone {closure.zone_id}
                        {closure.checkpoint_number && ` - Checkpoint ${closure.checkpoint_number}`}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{closure.closure_reason}</p>
                      {closure.public_message && (
                        <p className="text-sm text-red-800 mt-2 italic">"{closure.public_message}"</p>
                      )}
                    </div>
                    <Form method="post">
                      <input type="hidden" name="actionType" value="reopen_zone" />
                      <input type="hidden" name="closureId" value={closure.id} />
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Bezig...' : 'Heropenen'}
                      </button>
                    </Form>
                  </div>
                  {closure.points_neutralized && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Punten geneutraliseerd</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {fallbackSubmissions.length === 0 && manualEntries.length === 0 && 
         fallbackEvents.length === 0 && zoneClosures.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Icon name="check-circle" className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Alles up to date!</h3>
            <p className="text-gray-600">Geen fallback submissions of events die aandacht nodig hebben.</p>
          </div>
        )}
      </div>
    </div>
  );
}
