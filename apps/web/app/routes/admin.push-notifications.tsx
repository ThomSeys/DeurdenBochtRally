import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useFetcher, Link } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import type { Database } from '~/lib/database.types';
import { useState } from 'react';
import Header from '~/components/Header';
import { notificationTemplates } from '~/lib/push-notifications.server';

export const meta: MetaFunction = () => {
  return [{ title: 'Push Meldingen - Admin - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAdmin } = await import('~/lib/session.server');
  await requireAdmin(request);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const eventTypeFilter = url.searchParams.get('eventType');

  // Fetch history
  let query = supabaseAdmin
    .from('push_notifications_history')
    .select('*', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventTypeFilter) {
    query = query.eq('event_type', eventTypeFilter);
  }

  const { data: history, count, error } = await query;

  if (error) {
    console.error('[admin.push-notifications] Error fetching history:', error);
    return { history: [], total: 0, error: error.message, limit, offset, eventTypeFilter, eventTypes: [], participants: [], participantZones: {}, activeSubscriptions: 0 };
  }

  // Get all event types for filter
  const { data: allHistory } = await supabaseAdmin
    .from('push_notifications_history')
    .select('event_type')
    .limit(1000);

  const eventTypes = Array.from(new Set((allHistory || []).map((h: any) => h.event_type)));

  // Get participants with their current zone progress
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select(`
      id,
      first_name,
      last_name,
      email,
      formula,
      checked_in,
      ride_type
    `)
    .limit(200);

  // Fetch rally zones to check which zones are beyond RZ2
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('participant_id, zone_id')
    .order('created_at', { ascending: false });

  // Group by participant to find their highest zone
  const participantZones = new Map<string, string>();
  (zoneSubmissions || []).forEach((sub: any) => {
    if (!participantZones.has(sub.participant_id)) {
      participantZones.set(sub.participant_id, sub.zone_id);
    }
  });

  // Get active subscriptions count
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return {
    history: history || [],
    total: count || 0,
    limit,
    offset,
    eventTypeFilter,
    eventTypes,
    participants: participants || [],
    participantZones: Object.fromEntries(participantZones),
    activeSubscriptions: activeSubscriptions || 0,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAdmin, requireUserId } = await import('~/lib/session.server');
  await requireAdmin(request);
  const userId = await requireUserId(request);

  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const formData = await request.formData();
  const actionType = formData.get('_action') as string;

  // Handle quick template actions (broadcast to all)
  if (actionType?.startsWith('template-')) {
    const templateType = actionType.replace('template-', '') as keyof typeof notificationTemplates;
    
    const templateNotif = (notificationTemplates as any)[templateType];
    if (!templateNotif) {
      return { error: 'Template not found' };
    }

    // Get current template notification
    const notification = typeof templateNotif === 'function' ? templateNotif(1) : templateNotif;

    const response = await fetch(new URL('/api/push-send', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        action: 'broadcast',
        title: notification.title,
        body: notification.body,
        eventType: templateType,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[admin.push-notifications] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    return await response.json();
  }

  // Handle custom broadcast
  if (actionType === 'send-broadcast') {
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const eventType = formData.get('eventType') as string;

    if (!title || !body) {
      return { error: 'Title and body are required' };
    }

    const response = await fetch(new URL('/api/push-send', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        action: 'broadcast',
        title,
        body,
        eventType: eventType || 'custom',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[admin.push-notifications] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    return await response.json();
  }

  // Handle targeted message with advanced filters
  if (actionType === 'send-targeted') {
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const eventType = formData.get('eventType') as string;

    // Advanced filters
    const filterFormula = formData.get('filterFormula') as string;
    const filterBeyondZone = formData.get('filterBeyondZone') as string;
    const filterCheckedIn = formData.get('filterCheckedIn') as string;
    const filterRideType = formData.get('filterRideType') as string;
    const manualUserIds = formData.getAll('manualUserIds') as string[];

    if (!title || !body) {
      return { error: 'Title and body are required' };
    }

    // Build filter criteria
    const criteria: any = {};

    if (filterFormula) criteria.formula = filterFormula;
    if (filterBeyondZone) criteria.min_zone = filterBeyondZone;
    if (filterCheckedIn !== 'all') criteria.checked_in = filterCheckedIn === 'true';
    if (filterRideType) criteria.ride_type = filterRideType;
    if (manualUserIds.length > 0) criteria.user_ids = manualUserIds;

    if (Object.keys(criteria).length === 0) {
      return { error: 'Please select at least one filter criteria' };
    }

    const response = await fetch(new URL('/api/push-send', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        action: 'targeted',
        title,
        body,
        eventType: eventType || 'custom',
        criteria,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[admin.push-notifications] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    return await response.json();
  }

  // Handle retry failed
  if (actionType === 'retry-failed') {
    const historyId = formData.get('historyId');

    const response = await fetch(new URL('/api/push-send', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        action: 'retry-failed',
        historyId: parseInt(historyId as string),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[admin.push-notifications] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    return await response.json();
  }

  return { error: 'Unknown action' };
}


export default function AdminPushNotifications() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    history,
    total,
    limit,
    offset,
    eventTypeFilter,
    eventTypes,
    participants,
    participantZones,
    activeSubscriptions,
  } = loaderData;

  const fetcher = useFetcher();
  const [selectedTab, setSelectedTab] = useState<'quick' | 'broadcast' | 'targeted' | 'history'>('quick');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showManualSelection, setShowManualSelection] = useState(false);

  const isLoading = fetcher.state === 'submitting';
  const result = fetcher.data;

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams();
    params.set('offset', newOffset.toString());
    params.set('limit', (limit || 20).toString());
    if (eventTypeFilter) params.set('eventType', eventTypeFilter);
    window.location.search = params.toString();
  };

  const handleFilterChange = (newEventType: string) => {
    const params = new URLSearchParams();
    if (newEventType) params.set('eventType', newEventType);
    window.location.search = params.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔔 Push Meldingen Centrum</h1>
            <p className="text-gray-600 mt-2">
              {activeSubscriptions} actieve abonnementen • Stuur templates, aangepaste of gerichte berichten
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Terug
          </Link>
        </div>

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{result.error}</p>
          </div>
        )}

        {result?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">
              ✅ Bericht succesvol verzonden! Verzonden: {result.sent}, Mislukt: {result.failed}, Verlopen: {result.expired}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b bg-white px-6 rounded-t-lg">
          <button
            onClick={() => setSelectedTab('quick')}
            className={`px-4 py-3 border-b-2 transition font-medium ${
              selectedTab === 'quick'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚡ Snelle Templates
          </button>
          <button
            onClick={() => setSelectedTab('broadcast')}
            className={`px-4 py-3 border-b-2 transition font-medium ${
              selectedTab === 'broadcast'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📢 Aangepaste Uitzending
          </button>
          <button
            onClick={() => setSelectedTab('targeted')}
            className={`px-4 py-3 border-b-2 transition font-medium ${
              selectedTab === 'targeted'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Gericht Bericht
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-3 border-b-2 transition font-medium ${
              selectedTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Geschiedenis
          </button>
        </div>

        {/* Quick Templates Tab */}
        {selectedTab === 'quick' && (
          <div className="bg-white rounded-b-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Snelle Sjabloonberichten</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fetcher.Form method="post" className="contents">
                <input type="hidden" name="_action" value="template-rallyStart" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  🏁 Rally Gestart
                </button>
              </fetcher.Form>

              <fetcher.Form method="post" className="contents">
                <input type="hidden" name="_action" value="template-rallyEnd" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  🏁 Rally Beëindigd
                </button>
              </fetcher.Form>

              <fetcher.Form method="post" className="contents">
                <input type="hidden" name="_action" value="template-weatherWarning" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  ⛈️ Weersmelding
                </button>
              </fetcher.Form>

              <fetcher.Form method="post" className="contents">
                <input type="hidden" name="_action" value="template-leaderboardUpdate" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  🏆 Ranglijst Update
                </button>
              </fetcher.Form>

              <fetcher.Form method="post" className="contents">
                <input type="hidden" name="_action" value="template-reminder24h" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  ⏰ 24u Herinnering
                </button>
              </fetcher.Form>

              <fetcher.Form method="post" className="contents">
                <input type="hidden" name="_action" value="template-reminder1h" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  ⏰ 1u Herinnering
                </button>
              </fetcher.Form>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Templates zijn voorgedefinieerde berichten verzonden naar alle actieve abonnees</li>
                <li>• Gebruik voor kritieke aankondigingen en standaard rally-evenementen</li>
                <li>• Gebruik "Aangepaste Uitzending" voor unieke berichten</li>
                <li>• Gebruik "Gericht Bericht" om specifieke deelnemergroepen te bereiken</li>
              </ul>
            </div>
          </div>
        )}

        {/* Custom Broadcast Tab */}
        {selectedTab === 'broadcast' && (
          <div className="bg-white rounded-b-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Aangepaste Uitzending Versturen</h2>
            <fetcher.Form method="POST" className="space-y-4">
              <input type="hidden" name="_action" value="send-broadcast" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="bijv. 🔔 Belangrijk Update"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bericht</label>
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Uw bericht hier..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type Evenement (optioneel)</label>
                <select name="eventType" className="w-full px-4 py-2 border rounded-lg">
                  <option value="custom">Aangepast</option>
                  {(eventTypes || []).map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Verzenden...' : `Verzenden naar Alle ${activeSubscriptions} Abonnees`}
              </button>
            </fetcher.Form>
          </div>
        )}

        {/* Targeted Message Tab */}
        {selectedTab === 'targeted' && (
          <div className="bg-white rounded-b-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Gericht Bericht Versturen</h2>
            <fetcher.Form method="POST" className="space-y-6">
              <input type="hidden" name="_action" value="send-targeted" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="bijv. 🎯 Speciaal Bericht"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type Evenement (optioneel)</label>
                  <select name="eventType" className="w-full px-4 py-2 border rounded-lg">
                    <option value="custom">Custom</option>
                    {(eventTypes || []).map((type: string) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bericht</label>
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Uw gericht bericht..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Advanced Filters */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">🎯 Geavanceerde Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maaltijdpakket</label>
                    <select name="filterFormula" className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Alle deelnemers</option>
                      <option value="with_meals">Met Maaltijden</option>
                      <option value="breakfast_only">Alleen Ontbijt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voorbij Rally Zone</label>
                    <select name="filterBeyondZone" className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Alle zones</option>
                      <option value="rz1">Voorbij RZ1</option>
                      <option value="rz2">Voorbij RZ2</option>
                      <option value="rz3">Voorbij RZ3</option>
                      <option value="rz4">Voorbij RZ4</option>
                      <option value="rz5">Voorbij RZ5</option>
                      <option value="rz6">Voorbij RZ6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">In Check-in Status</label>
                    <select name="filterCheckedIn" className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="all">Alle deelnemers</option>
                      <option value="true">Alleen ingecheckt</option>
                      <option value="false">Niet ingecheckt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type Rit</label>
                    <select name="filterRideType" className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Alle rijders</option>
                      <option value="free">Vrije Rit</option>
                      <option value="guided">Begeleide Tour</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Manual Selection Toggle */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualSelection(!showManualSelection)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {showManualSelection ? '▼ Verbergen' : '▶ Tonen'} Handmatige Deelnemersselectie
                </button>

                {showManualSelection && (
                  <div className="mt-4 border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                    {(participants || []).map((p: any) => (
                      <label key={p.id} className="flex items-center">
                        <input type="checkbox" name="manualUserIds" value={p.id} className="mr-2" />
                        <span className="text-sm">
                          {`${p.first_name} ${p.last_name}`} ({p.email})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Verzenden...' : 'Gericht Bericht Versturen'}
              </button>
            </fetcher.Form>
          </div>
        )}

        {/* History Tab */}
        {selectedTab === 'history' && (
          <div className="bg-white rounded-b-lg shadow p-6">
            {/* Filter */}
            <div className="mb-6 flex gap-2">
              <select
                value={eventTypeFilter || ''}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
              >
                <option value="">Alle Evenementen</option>
                {eventTypes?.map((type: string) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* History Table */}
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Titel</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Resultaten</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verzonden Op</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((notif: Database['public']['Tables']['push_notifications_history']['Row']) => (
                    <tr key={notif.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{notif.title}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {notif.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            notif.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : notif.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {notif.status === 'completed' ? 'Voltooid' : notif.status === 'failed' ? 'Mislukt' : 'In behandeling'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-xs">
                          <p>✅ {notif.success_count}/{notif.recipient_count}</p>
                          {(notif.failed_count ?? 0) > 0 && <p className="text-red-600">❌ {notif.failed_count}</p>}
                          {(notif.expired_count ?? 0) > 0 && <p className="text-gray-600">⏱️ {notif.expired_count}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {notif.sent_at &&
                          new Date(notif.sent_at).toLocaleDateString('nl-NL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {expandedId === notif.id ? 'Verbergen' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Expanded Details */}
              {expandedId &&
                history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId) && (
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="space-y-2">
                      <p>
                        <strong>Bericht:</strong> {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.body}
                      </p>
                      <p>
                        <strong>Doeltype:</strong>{' '}
                        {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.target_type}
                      </p>
                      {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.target_criteria && (
                        <p>
                          <strong>Doelcriteria:</strong>{' '}
                          {JSON.stringify(history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.target_criteria)}
                        </p>
                      )}
                    </div>

                    {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.failed_count! > 0 && (
                      <fetcher.Form method="POST" className="mt-4">
                        <input type="hidden" name="_action" value="retry-failed" />
                        <input type="hidden" name="historyId" value={expandedId} />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50 font-medium"
                        >
                          🔄 Mislukte Opnieuw Proberen
                        </button>
                      </fetcher.Form>
                    )}
                  </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex gap-2 justify-between">
              <button
                onClick={() => handlePageChange(Math.max(0, (offset ?? 0) - (limit ?? 20)))}
                disabled={(offset ?? 0) === 0}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50 font-medium"
              >
                ← Vorige
              </button>
              <span className="py-2">
                Pagina {Math.floor((offset ?? 0) / (limit ?? 20)) + 1} van {Math.ceil(total / (limit ?? 20))}
              </span>
              <button
                onClick={() => handlePageChange((offset ?? 0) + (limit ?? 20))}
                disabled={(offset ?? 0) + (limit ?? 20) >= total}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50 font-medium"
              >
                Volgende →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
