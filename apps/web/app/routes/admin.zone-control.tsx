import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation, useRevalidator } from 'react-router';
import React from 'react';
import { requireAdmin } from '~/lib/session.server';
import { getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import { createClient as createSanityClient } from '@sanity/client';
import { sendBulkPushNotifications, notificationTemplates } from '~/lib/push-notifications.server';
import Header from '~/components/Header';

// Create writable Sanity client
const sanityWriteClient = createSanityClient({
  projectId: process.env.SANITY_PROJECT_ID || 'tp2nrvnd',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  // Get all rally zones with their open/close status
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      "zoneNumber": order + 1,
      location,
      "is_open": coalesce(is_open, true),
      radius_m,
      color
    }
  `);

  // Get closure log from database
  const { data: closureLog } = await supabaseAdmin
    .from('zone_closure_log')
    .select(`
      *,
      closed_by_user:participants!zone_closure_log_closed_by_fkey(first_name, last_name),
      reopened_by_user:participants!zone_closure_log_reopened_by_fkey(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  return { rallyZones, closureLog: closureLog || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[admin.zone-control] action start');

  try {
    await requireAdmin(request);
    const admin = await getUser(request);
    
    if (!admin) {
      return { error: 'Not authorized' };
    }

    const formData = await request.formData();
    const intent = formData.get('intent');
    const zoneId = formData.get('zoneId') as string;
    const zoneNumber = formData.get('zoneNumber') as string;

    console.info('[admin.zone-control] received form data', { intent, zoneId, zoneNumber });

    if (intent === 'close') {
      const reason = formData.get('reason') as string;

      console.info('[admin.zone-control] attempting to close zone', { zoneId, zoneNumber, reason });

      const patchResult = await sanityWriteClient
        .patch(zoneId)
        .set({ is_open: false })
        .commit();

      console.info('[admin.zone-control] patch result', { patchResult });

      await supabaseAdmin
        .from('zone_closure_log')
        .insert({
          zone_id: zoneNumber,
          closed_at: new Date().toISOString(),
          closed_by: admin.id,
          reason: reason || 'Road closure or safety issue',
        });

      // Send push notification about zone closure
      try {
        const { data: subscriptions } = await supabaseAdmin
          .from('push_subscriptions')
          .select('endpoint, keys')
          .eq('is_active', true);

        if (subscriptions && subscriptions.length > 0) {
          const zoneName = rallyZones.find((z: any) => z.zoneNumber === parseInt(zoneNumber))?.title || `Zone ${zoneNumber}`;
          const notification = notificationTemplates.zoneClosed(parseInt(zoneNumber), zoneName);
          
          await sendBulkPushNotifications(subscriptions, notification);
          console.info('[admin.zone-control] zone closure notification sent');
        }
      } catch (pushError) {
        console.error('[admin.zone-control] error sending zone closure notification', pushError);
      }

      console.info('[admin.zone-control] action success', { intent, zoneNumber });
      return { success: `Zone ${zoneNumber} has been closed` };
    }

    if (intent === 'open') {
      console.info('[admin.zone-control] attempting to open zone', { zoneId, zoneNumber });

      const patchResult = await sanityWriteClient
        .patch(zoneId)
        .set({ is_open: true })
        .commit();

      console.info('[admin.zone-control] patch result', { patchResult });

      const { data: latestClosure } = await supabaseAdmin
        .from('zone_closure_log')
        .select('id')
        .eq('zone_id', zoneNumber)
        .is('reopened_at', null)
        .order('closed_at', { ascending: false })
        .limit(1)
        .single();

      if (latestClosure) {
        await supabaseAdmin
          .from('zone_closure_log')
          .update({
            reopened_at: new Date().toISOString(),
            reopened_by: admin.id,
          })
          .eq('id', latestClosure.id);
      }

      // Send push notification about zone opening
      try {
        const { data: subscriptions } = await supabaseAdmin
          .from('push_subscriptions')
          .select('endpoint, keys')
          .eq('is_active', true);

        if (subscriptions && subscriptions.length > 0) {
          const zoneName = rallyZones.find((z: any) => z.zoneNumber === parseInt(zoneNumber))?.title || `Zone ${zoneNumber}`;
          const notification = notificationTemplates.zoneOpened(parseInt(zoneNumber), zoneName);
          
          await sendBulkPushNotifications(subscriptions, notification);
          console.info('[admin.zone-control] zone opening notification sent');
        }
      } catch (pushError) {
        console.error('[admin.zone-control] error sending zone opening notification', pushError);
      }

      console.info('[admin.zone-control] action success', { intent, zoneNumber });
      return { success: `Zone ${zoneNumber} has been reopened` };
    }

    return { error: 'Invalid action' };
  } catch (error) {
    console.error('[admin.zone-control] action error', error);
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export default function AdminZoneControl() {
  const { rallyZones, closureLog } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const isSubmitting = navigation.state === 'submitting';
  const openZones = rallyZones.filter((z: any) => z.is_open !== false);
  const closedZones = rallyZones.filter((z: any) => z.is_open === false);

  // Revalidate data when action succeeds
  React.useEffect(() => {
    if (actionData?.success) {
      revalidator.revalidate();
    }
  }, [actionData, revalidator]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Zonebeheerpaneel</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 break-words">
            Open of sluit rallyzones in geval van wegafsluitingen, veiligheidskwesties of andere problemen
          </p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm break-words">
            Fout: {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded text-sm break-words">
            Succes: {actionData.success}
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Open Zones</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{openZones.length}</p>
              </div>
              <div className="text-3xl sm:text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Gesloten Zones</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{closedZones.length}</p>
              </div>
              <div className="text-3xl sm:text-4xl">🚫</div>
            </div>
          </div>
        </div>

        {/* Zone List */}
        <div className="bg-white rounded-sm shadow overflow-hidden mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">Rallyzones</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {rallyZones.map((zone: any) => (
              <div key={zone._id} className="p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                        RZ{zone.zoneNumber} – {zone.title}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                        zone.is_open !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.is_open !== false ? '✓ Open' : '✗ Gesloten'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        zone.color === 'green' ? 'bg-green-100 text-green-800' :
                        zone.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        zone.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {zone.color}
                      </span>
                    </div>
                    <p className="text-gray-600">{zone.location}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Geofence: {zone.radius_m || 30}m straal
                    </p>
                  </div>

                  <div>
                    {zone.is_open !== false ? (
                      <Form method="post">
                        <input type="hidden" name="intent" value="close" />
                        <input type="hidden" name="zoneId" value={zone._id} />
                        <input type="hidden" name="zoneNumber" value={zone.zoneNumber} />
                        <input 
                          type="hidden" 
                          name="reason" 
                          value="Wegafsluiting of veiligheidsprobleem" 
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-red-400 text-white rounded-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors"
                        >
                          Zone Sluiten
                        </button>
                      </Form>
                    ) : (
                      <Form method="post">
                        <input type="hidden" name="intent" value="open" />
                        <input type="hidden" name="zoneId" value={zone._id} />
                        <input type="hidden" name="zoneNumber" value={zone.zoneNumber} />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-green-400 text-white rounded-sm font-semibold hover:bg-green-500 disabled:opacity-50 transition-colors"
                        >
                          Zone Heropenen
                        </button>
                      </Form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closure Log */}
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recente Activiteit</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {closureLog.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nog geen zonesluitingen geregistreerd
              </div>
            ) : (
              closureLog.map((log: any) => (
                <div key={log.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Zone {log.zone_id} 
                        {log.reopened_at ? (
                          <span className="text-green-600"> heropend</span>
                        ) : (
                          <span className="text-red-600"> gesloten</span>
                        )}
                      </p>
                      {log.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reden: {log.reason}
                        </p>
                      )}
                      <div className="text-sm text-gray-500 mt-2 space-y-1">
                        {log.closed_at && (
                          <p>
                            Gesloten: {new Date(log.closed_at).toLocaleString('nl-BE', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                            {log.closed_by_user && (
                              <span className="ml-2">
                                door {log.closed_by_user.first_name} {log.closed_by_user.last_name}
                              </span>
                            )}
                          </p>
                        )}
                        {log.reopened_at && (
                          <p>
                            Heropend: {new Date(log.reopened_at).toLocaleString('nl-BE', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                            {log.reopened_by_user && (
                              <span className="ml-2">
                                door {log.reopened_by_user.first_name} {log.reopened_by_user.last_name}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      log.reopened_at
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.reopened_at ? 'Opgelost' : 'Actief'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-sm p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Hoe Zonesluitingen Werken</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Wanneer een zone gesloten is, kunnen rijders geen nieuwe scans voor die zone indienen</li>
            <li>• Gesloten zones ontvangen automatisch gemiddelde shadow scores</li>
            <li>• De sluiting wordt gelogd met tijdstempel en reden</li>
            <li>• Zones kunnen heropend worden wanneer het probleem is opgelost</li>
            <li>• Gebruik dit voor wegafsluitingen, veiligheidskwesties of evenementstremomingen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
