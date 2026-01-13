import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  try {
    // Get all active participants
    const { data: participants } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, license_plate')
      .eq('status', 'active')
      .order('last_name', { ascending: true });

    // Get rally zones
    const rallyZones = await sanityClient.fetch(`
      *[_type == "rallyZone"] | order(order asc) {
        _id,
        title,
        "zoneNumber": order + 1,
        is_open
      }
    `);

    return { participants: participants || [], rallyZones };
  } catch (error) {
    console.log('[AdminManualScan] Offline:', error);
    return { participants: [], rallyZones: [] };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[admin.manual-scan] action start');

  try {
    await requireAdmin(request);
    const admin = await getUser(request);
    
    if (!admin) {
      return { error: 'Not authorized' };
    }

    const formData = await request.formData();
    const participantId = formData.get('participantId') as string;
    const zoneId = formData.get('zoneId') as string;
    const timestamp = formData.get('timestamp') as string;
    const notes = formData.get('notes') as string;
    const proofPhotoUrl = formData.get('proofPhotoUrl') as string;

    if (!participantId || !zoneId || !timestamp) {
      return { error: 'Please fill in all required fields' };
    }

    const { data: existing } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('id')
      .eq('participant_id', participantId)
      .eq('zone_id', zoneId)
      .single();

    if (existing) {
      return { error: `This participant already has a submission for Zone ${zoneId}` };
    }

    const { data, error } = await supabaseAdmin
      .from('rally_zone_submissions')
      .insert({
        participant_id: participantId,
        zone_id: zoneId,
        entry_timestamp: timestamp,
        answer_timestamp: timestamp,
        is_manual: true,
        valid: true,
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
        rhythm_score: 0,
        submitted_answer: 'MANUAL_ENTRY',
        proof_photo_url: proofPhotoUrl || null,
        entry_accuracy: null,
        entry_latitude: null,
        entry_longitude: null,
        answer_accuracy: null,
        answer_latitude: null,
        answer_longitude: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create manual entry: ' + error.message);
    }

    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('first_name, last_name')
      .eq('id', participantId)
      .single();

    console.info('[admin.manual-scan] action success', { participantId, zoneId });

    return { 
      success: `Manual scan created for ${participant?.first_name} ${participant?.last_name} - Zone ${zoneId}`,
      submissionId: data.id
    };
  } catch (error) {
    console.error('[admin.manual-scan] action error', error);
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export default function AdminManualScan() {
  const { participants, rallyZones } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  // Get current time in proper format for datetime-local input
  const now = new Date();
  const defaultTimestamp = now.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manual Scan Entry</h1>
          <p className="mt-2 text-gray-600">
            Create a manual scan entry for riders with phone issues (Scenario 5: Telefoon Dood)
          </p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <span>{actionData.success}</span>
              <button
                onClick={() => window.location.reload()}
                className="text-sm underline hover:no-underline"
              >
                Add Another
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Manual Entry Rules</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Manual entries receive <strong>rhythm_score = 0</strong> (no timing advantage)</li>
            <li>• No GPS coordinates recorded (not penalized for location)</li>
            <li>• Entry is automatically approved by the creating admin</li>
            <li>• Use only when rider's phone has failed or battery is dead</li>
            <li>• Safety crew should note: name, time, zone, and take photo if possible</li>
          </ul>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Form method="post" className="space-y-6">
            {/* Participant Selection */}
            <div>
              <label htmlFor="participantId" className="block text-sm font-medium text-gray-700 mb-2">
                Rider <span className="text-red-600">*</span>
              </label>
              <select
                id="participantId"
                name="participantId"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select a rider...</option>
                {participants.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.license_plate})
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Selection */}
            <div>
              <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700 mb-2">
                Rally Zone <span className="text-red-600">*</span>
              </label>
              <select
                id="zoneId"
                name="zoneId"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select a zone...</option>
                {rallyZones.map((zone: any) => (
                  <option 
                    key={zone._id} 
                    value={zone.zoneNumber}
                    disabled={zone.is_open === false}
                  >
                    RZ{zone.zoneNumber} – {zone.title}
                    {zone.is_open === false && ' (CLOSED)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Timestamp */}
            <div>
              <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-2">
                Timestamp <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                id="timestamp"
                name="timestamp"
                defaultValue={defaultTimestamp}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                When did the rider reach this checkpoint?
              </p>
            </div>

            {/* Photo URL (optional) */}
            <div>
              <label htmlFor="proofPhotoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Proof Photo URL <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="url"
                id="proofPhotoUrl"
                name="proofPhotoUrl"
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                If safety crew took a photo, paste the URL here
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="e.g., Phone battery dead, confirmed by safety crew at 14:30"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add any relevant context about why this manual entry was needed
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> Manual entries bypass GPS validation and receive zero rhythm score. 
                Only use this for legitimate phone failures confirmed by safety crew.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Creating Manual Entry...' : 'Create Manual Scan Entry'}
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </Form>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Active Riders</p>
              <p className="text-2xl font-bold text-primary-600">{participants.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Zones</p>
              <p className="text-2xl font-bold text-primary-600">{rallyZones.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Zones</p>
              <p className="text-2xl font-bold text-green-600">
                {rallyZones.filter((z: any) => z.is_open !== false).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Closed Zones</p>
              <p className="text-2xl font-bold text-red-600">
                {rallyZones.filter((z: any) => z.is_open === false).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
