import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get pending scans (valid = null)
  const { data: pendingScans } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select(`
      *,
      participants!inner (
        id,
        first_name,
        last_name,
        license_plate
      )
    `)
    .is('valid', null)
    .order('created_at', { ascending: true });

  // Get rally zones for reference
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      "zoneNumber": order + 1,
      "referencePhotoUrl": reference_photo.asset->url
    }
  `);

  // Create map for quick lookup
  const zoneMap = new Map();
  rallyZones.forEach((zone: any) => {
    zoneMap.set(zone.zoneNumber.toString(), zone);
  });

  return { pendingScans: pendingScans || [], zoneMap: Object.fromEntries(zoneMap) };
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[admin.pending-scans] action start');

  try {
    await requireAdmin(request);
    const admin = await getUser(request);
    
    if (!admin) {
      return { error: 'Not authorized' };
    }

    const formData = await request.formData();
    const intent = formData.get('intent');
    const submissionId = formData.get('submissionId') as string;

    if (intent === 'approve') {
      const { error } = await supabaseAdmin
        .from('rally_zone_submissions')
        .update({
          valid: true,
          approved_by: admin.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) {
        throw new Error('Failed to approve scan: ' + error.message);
      }

      console.info('[admin.pending-scans] action success', { intent, submissionId });
      return { success: 'Scan approved successfully!' };
    } 
    
    if (intent === 'reject') {
      const reason = formData.get('reason') as string;
      
      if (!reason || reason.trim() === '') {
        return { error: 'Please provide a reason for rejection' };
      }

      const { error } = await supabaseAdmin
        .from('rally_zone_submissions')
        .update({
          valid: false,
          reason_if_invalid: reason,
          approved_by: admin.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) {
        throw new Error('Failed to reject scan: ' + error.message);
      }

      console.info('[admin.pending-scans] action success', { intent, submissionId });
      return { success: 'Scan rejected successfully!' };
    }

    return { error: 'Invalid action' };
  } catch (error) {
    console.error('[admin.pending-scans] action error', error);
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export default function AdminPendingScans() {
  const { pendingScans, zoneMap } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manual Scan Validation</h1>
          <p className="mt-2 text-gray-600">
            Review and approve/reject scans that require manual validation
          </p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {actionData.success}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Validations</p>
              <p className="text-3xl font-bold text-primary-600">{pendingScans.length}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        {/* Pending Scans List */}
        {pendingScans.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h2>
            <p className="text-gray-600">No scans pending manual validation</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingScans.map((scan: any) => {
              const zone = zoneMap[scan.zone_id];
              const participant = scan.participants;

              return (
                <div key={scan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Rally Zone {scan.zone_id}
                          {zone && <span className="text-gray-600"> – {zone.title}</span>}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Rider: <span className="font-semibold">{participant?.first_name} {participant?.last_name}</span>
                          <span className="ml-3 text-sm text-gray-500">{participant?.license_plate}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {scan.gps_accuracy_low && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            ⚠️ Low GPS
                          </span>
                        )}
                        {scan.is_manual && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            📝 Manual Entry
                          </span>
                        )}
                        {scan.submitted_offline && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            📡 Offline Sync
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Left Column - Scan Info */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Submitted Answer:</label>
                          <p className="mt-1 text-lg font-mono bg-gray-50 px-3 py-2 rounded">
                            {scan.submitted_answer || <span className="text-gray-400 italic">No answer</span>}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">GPS Accuracy:</label>
                          <p className="mt-1">
                            {scan.answer_accuracy ? (
                              <span className={`font-semibold ${scan.answer_accuracy > 50 ? 'text-red-600' : 'text-green-600'}`}>
                                ±{Math.round(scan.answer_accuracy)}m
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Location:</label>
                          <p className="mt-1 text-sm text-gray-600">
                            {scan.answer_latitude && scan.answer_longitude ? (
                              <>
                                {scan.answer_latitude.toFixed(6)}, {scan.answer_longitude.toFixed(6)}
                                <a 
                                  href={`https://www.google.com/maps?q=${scan.answer_latitude},${scan.answer_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-primary-600 hover:text-primary-700"
                                >
                                  View on map →
                                </a>
                              </>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Timestamp:</label>
                          <p className="mt-1 text-sm text-gray-600">
                            {new Date(scan.created_at).toLocaleString('nl-BE', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Right Column - Photos */}
                      <div className="space-y-3">
                        {/* Proof Photo */}
                        {scan.proof_photo_url ? (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Proof Photo:</label>
                            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={scan.proof_photo_url} 
                                alt="Proof" 
                                className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                                onClick={() => window.open(scan.proof_photo_url, '_blank')}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Click to enlarge</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <p className="text-gray-400">No proof photo uploaded</p>
                          </div>
                        )}

                        {/* Reference Photo */}
                        {zone?.referencePhotoUrl && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Reference Photo:</label>
                            <div className="border-2 border-primary-200 rounded-lg overflow-hidden">
                              <img 
                                src={zone.referencePhotoUrl} 
                                alt="Reference" 
                                className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                                onClick={() => window.open(zone.referencePhotoUrl, '_blank')}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Expected checkpoint</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-4">
                      {rejectingId === scan.id ? (
                        <Form method="post" className="space-y-3">
                          <input type="hidden" name="intent" value="reject" />
                          <input type="hidden" name="submissionId" value={scan.id} />
                          
                          <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                              Reason for Rejection:
                            </label>
                            <textarea
                              id="reason"
                              name="reason"
                              rows={3}
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                              placeholder="e.g., Wrong location, photo unclear, incorrect code..."
                              required
                            />
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </Form>
                      ) : (
                        <div className="flex gap-3">
                          <Form method="post" className="flex-1">
                            <input type="hidden" name="intent" value="approve" />
                            <input type="hidden" name="submissionId" value={scan.id} />
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              ✓ Approve Scan
                            </button>
                          </Form>
                          
                          <button
                            type="button"
                            onClick={() => setRejectingId(scan.id)}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            ✗ Reject Scan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
