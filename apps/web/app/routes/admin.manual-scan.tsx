import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get all active participants
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, license_plate')
    .eq('status', 'active')
    .order('last_name', { ascending: true });

  // Get rally zones (Concept B)
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZoneV2"] | order(order asc) {
      _id,
      title,
      "zoneNumber": order + 1,
      is_active
    }
  `);

  return { participants: participants || [], rallyZones };
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
    const rallyZoneId = formData.get('zoneId') as string; // Sanity _id
    const action = formData.get('action') as string || 'CHECKIN';
    const timestamp = formData.get('timestamp') as string;
    const notes = formData.get('notes') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    if (!participantId || !rallyZoneId || !timestamp) {
      return { error: 'Vul alstublieft alle verplichte velden in' };
    }

    // Concept B: Create manual check-in
    const { data, error } = await supabaseAdmin
      .from('rally_zone_checkins')
      .insert({
        participant_id: participantId,
        rally_zone_id: rallyZoneId,
        action: action,
        qr_code: `MANUAL-${action}-${Date.now()}`,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        checked_at: timestamp,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Aanmaken handmatige invoer mislukt: ' + error.message);
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

      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="search" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Handmatig Scannen</h1>
          <p className="text-xl text-primary-100">Verwerk codes zonder QR scanner</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Handmatige Scan Invoer</h1>
            <p className="mt-2 text-gray-600">
              Maak een handmatige scaninvoer voor rijders met telefoonproblemen (Scenario 5: Telefoon Dood)
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
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
                Voeg Ander In
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-sm p-4">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Icon name="info" className="w-5 h-5" /> Handmatige Invoer Regels
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Handmatige invoer krijgt <strong>rhythm_score = 0</strong> (geen timing voordeel)</li>
            <li>• Geen GPS coördinaten opgenomen (niet gestraft voor locatie)</li>
            <li>• Invoer wordt automatisch goedgekeurd door de aanmakende beheerder</li>
            <li>• Gebruik alleen wanneer de telefoon van de rijder defect of leeg is</li>
            <li>• Veiligheidsteam moet noteren: naam, tijd, zone, en foto nemen indien mogelijk</li>
          </ul>
        </div>

        {/* Form */}
        <div className="bg-white rounded-sm shadow-lg p-8">
          <Form method="post" className="space-y-6">
            {/* Participant Selection */}
            <div>
              <label htmlFor="participantId" className="block text-sm font-medium text-gray-700 mb-2">
                Rijder <span className="text-red-600">*</span>
              </label>
              <select
                id="participantId"
                name="participantId"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Selecteer een rijder...</option>
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
                <option value="">Selecteer een zone...</option>
                {rallyZones.map((zone: any) => (
                  <option 
                    key={zone._id} 
                    value={zone.zoneNumber}
                    disabled={zone.is_open === false}
                  >
                    RZ{zone.zoneNumber} – {zone.title}
                    {zone.is_open === false && ' (GESLOTEN)'}
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
                Wanneer bereikte de rijder dit controlepunt?
              </p>
            </div>

            {/* Photo URL (optional) */}
            <div>
              <label htmlFor="proofPhotoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Bewijs Foto URL <span className="text-gray-500">(optioneel)</span>
              </label>
              <input
                type="url"
                id="proofPhotoUrl"
                name="proofPhotoUrl"
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Als het veiligheidsteam een foto nam, plak hier de URL
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notities <span className="text-gray-500">(optioneel)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="bijv. Telefoon batterij leeg, bevestigd door veiligheidsteam om 14:30"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Voeg relevante context toe over waarom deze handmatige invoer nodig was
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
              <p className="text-sm text-yellow-800">
                <strong className="flex items-center gap-1">
                  <Icon name="warning" className="w-5 h-5 inline" /> Waarschuwing:
                </strong> Handmatige invoer omzeilt GPS validatie en krijgt nul ritme score. 
                Gebruik dit alleen voor legitieme telefoon defecten bevestigd door het veiligheidsteam.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Handmatige Invoer Aanmaken...' : 'Handmatige Scan Invoer Aanmaken'}
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-sm font-semibold hover:bg-gray-300"
              >
                Annuleren
              </button>
            </div>
          </Form>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-white rounded-sm shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Snelle Statistieken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Actieve Rijders</p>
              <p className="text-2xl font-bold text-primary-600">{participants.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Totaal Zones</p>
              <p className="text-2xl font-bold text-primary-600">{rallyZones.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Zones</p>
              <p className="text-2xl font-bold text-green-600">
                {rallyZones.filter((z: any) => z.is_open !== false).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesloten Zones</p>
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
