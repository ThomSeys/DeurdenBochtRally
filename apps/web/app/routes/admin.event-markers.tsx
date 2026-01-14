import { useState } from 'react';
import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { useLoaderData, useRevalidator, Form } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { sanityClient } from '~/lib/sanity.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sendBulkPushNotifications, notificationTemplates } from '~/lib/push-notifications.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Fetch all event markers
  const eventMarkers = await sanityClient.fetch(`
    *[_type == "eventMarker"] | order(createdAt desc) {
      _id,
      title,
      description,
      type,
      location,
      severity,
      isActive,
      createdAt,
      updatedAt
    }
  `);

  // Fetch current edition
  const edition = await sanityClient.fetch(`
    *[_type == "edition" && year == "2026"][0] {
      _id
    }
  `);

  return { eventMarkers, editionId: edition?._id };
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[admin.event-markers] action start');

  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'toggle') {
      const id = formData.get('id') as string;
      const isActive = formData.get('isActive') === 'true';
      const title = formData.get('title') as string;

      await sanityClient.patch(id).set({ isActive: !isActive, updatedAt: new Date().toISOString() }).commit();

      // Send push notification when event is resolved (toggled inactive)
      if (isActive) {
        try {
          const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, keys')
            .eq('is_active', true);

          if (subscriptions && subscriptions.length > 0) {
            const notification = notificationTemplates.eventResolved(title);
            await sendBulkPushNotifications(subscriptions, notification);
            console.info('[admin.event-markers] event resolved notification sent');
          }
        } catch (pushError) {
          console.error('[admin.event-markers] error sending event resolved notification', pushError);
        }
      }

      console.info('[admin.event-markers] action success', { intent, id });
      return { success: true };
    }

    if (intent === 'delete') {
      const id = formData.get('id') as string;
      const resolutionMessage = formData.get('resolutionMessage') as string;

      // Fetch event details before deleting
      const event = await sanityClient.getDocument(id);

      // Delete from Sanity
      await sanityClient.delete(id);

      // Send notification if event was critical/high severity
      if (event && (event.severity === 'critical' || event.severity === 'high')) {
        try {
          const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, keys')
            .eq('is_active', true);

          if (subscriptions && subscriptions.length > 0) {
            const notification = notificationTemplates.eventCancelled(
              event.title,
              resolutionMessage || undefined
            );
            await sendBulkPushNotifications(subscriptions, notification);
            console.info('[admin.event-markers] event cancellation notification sent');
          }
        } catch (pushError) {
          console.error('[admin.event-markers] error sending event cancellation notification', pushError);
        }
      }

      console.info('[admin.event-markers] action success', { intent, id });
      return { success: true };
    }

    if (intent === 'create') {
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const type = formData.get('type') as string;
      const lat = parseFloat(formData.get('lat') as string);
      const lng = parseFloat(formData.get('lng') as string);
      const severity = formData.get('severity') as string;
      const editionId = formData.get('editionId') as string;

      await sanityClient.create({
        _type: 'eventMarker',
        title,
        description,
        type,
        location: { lat, lng },
        severity,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        edition: {
          _type: 'reference',
          _ref: editionId,
        },
      });

      // Send push notification for critical events
      if (severity === 'critical' || severity === 'high') {
        try {
          const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, keys')
            .eq('is_active', true);

          if (subscriptions && subscriptions.length > 0) {
            const notification = notificationTemplates.criticalEvent(title, description);
            await sendBulkPushNotifications(subscriptions, notification);
            console.info('[admin.event-markers] critical event notification sent');
          }
        } catch (pushError) {
          console.error('[admin.event-markers] error sending critical event notification', pushError);
        }
      }

      console.info('[admin.event-markers] action success', { intent });
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.error('[admin.event-markers] action error', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export default function AdminEventMarkers() {
  const { eventMarkers, editionId } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Evenementmarkeringen</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 break-words">
                Beheer live evenementmarkeringen die op de rallykaart worden weergegeven
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors font-medium text-sm whitespace-nowrap"
              >
                {showForm ? '✕ Annuleren' : '+ Markering Toevoegen'}
              </button>
              <a
                href="/live-map"
                className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition-colors font-medium text-sm whitespace-nowrap"
              >
                🗺️ Bekijk Kaart
              </a>
              <a
                href="/admin"
                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors font-medium text-sm whitespace-nowrap"
              >
                ← Terug
              </a>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-sm shadow-md p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 break-words">Evenementmarkering Aanmaken</h2>
            <Form method="post" onSubmit={() => setShowForm(false)}>
              <input type="hidden" name="intent" value="create" />
              <input type="hidden" name="editionId" value={editionId} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="bv. Wegafsluiting bij Kerkstraat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evenementtype
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="closure">🚧 Wegafsluiting</option>
                    <option value="accident">🚨 Ongeval</option>
                    <option value="stop">⛔ Stop</option>
                    <option value="flood">🌊 Overstroomde Weg</option>
                    <option value="warning">⚠️ Waarschuwing</option>
                    <option value="info">ℹ️ Informatie</option>
                    <option value="station">💧 Water/Tank Station</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Gedetailleerde informatie over het evenement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="lat"
                    required
                    step="any"
                    min="-90"
                    max="90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="51.0967"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="lng"
                    required
                    step="any"
                    min="-180"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3.4400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ernstniveau
                  </label>
                  <select
                    name="severity"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Laag</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">Hoog</option>
                    <option value="critical">Kritiek</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors font-medium"
                >
                  Evenementmarkering Aanmaken
                </button>
              </div>
            </Form>
          </div>
        )}

        {/* Markers List */}
        <div className="bg-white rounded-sm shadow-md overflow-hidden">
          {eventMarkers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nog geen evenementmarkeringen</p>
              <p className="text-sm mt-2">Klik op "Markering Toevoegen" om er een aan te maken</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evenement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Locatie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ernstniveau
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aangemaakt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventMarkers.map((marker: any) => (
                    <tr key={marker._id} className={!marker.isActive ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getEventTypeEmoji(marker.type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{marker.title}</div>
                            <div className="text-sm text-gray-500">{marker.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {marker.location.lat.toFixed(4)}, {marker.location.lng.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClass(marker.severity)}`}>
                          {marker.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="id" value={marker._id} />
                          <input type="hidden" name="isActive" value={marker.isActive.toString()} />
                          <button
                            type="submit"
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              marker.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {marker.isActive ? '✓ Actief' : '✗ Inactief'}
                          </button>
                        </Form>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(marker.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={marker._id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              const resolutionMessage = prompt(
                                'Voer een bericht in voor de deelnemers (optioneel):\n\nBijvoorbeeld: "Probleem opgelost" of "Weg is weer vrij"'
                              );
                              if (resolutionMessage === null) {
                                // User clicked cancel
                                e.preventDefault();
                                return;
                              }
                              // Add resolution message to form
                              const form = e.currentTarget.form;
                              if (form) {
                                const existingInput = form.querySelector('input[name="resolutionMessage"]');
                                if (existingInput) {
                                  existingInput.remove();
                                }
                                const input = document.createElement('input');
                                input.type = 'hidden';
                                input.name = 'resolutionMessage';
                                input.value = resolutionMessage;
                                form.appendChild(input);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Verwijderen
                          </button>
                        </Form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    closure: '🚧',
    accident: '🚨',
    stop: '⛔',
    flood: '🌊',
    warning: '⚠️',
    info: 'ℹ️',
    station: '💧',
  };
  return emojiMap[type] || '📍';
}

function getSeverityClass(severity: string): string {
  const classMap: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return classMap[severity] || 'bg-gray-100 text-gray-800';
}
