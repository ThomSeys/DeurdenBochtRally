import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import type { Database } from '~/lib/database.types';
import { useState } from 'react';

export const handle = { title: 'Push Notifications History - Admin' };

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAdmin } = await import('~/lib/session.server');
  await requireAdmin(request);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const eventTypeFilter = url.searchParams.get('eventType');

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
    console.error('[admin.push-history] Error:', error);
    return { history: [], total: 0, error: error.message };
  }

  // Get all event types for filter
  const { data: allHistory } = await supabaseAdmin
    .from('push_notifications_history')
    .select('event_type')
    .limit(1000);

  const eventTypes = Array.from(new Set((allHistory || []).map((h: any) => h.event_type)));

  const participants = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email')
    .limit(100);

  return {
    history: history || [],
    total: count || 0,
    limit,
    offset,
    eventTypeFilter,
    eventTypes,
    participants: participants.data || [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAdmin } = await import('~/lib/session.server');
  await requireAdmin(request);

  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const formData = await request.formData();
  const action = formData.get('_action');

  if (action === 'send-broadcast') {
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
      console.error('[admin.push-history] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    const result = await response.json();
    return result;
  }

  if (action === 'send-targeted') {
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const zones = formData.getAll('zones');
    const userIds = formData.getAll('userIds');
    const eventType = formData.get('eventType') as string;

    if (!title || !body) {
      return { error: 'Title and body are required' };
    }

    const criteria: any = {};
    if (zones.length > 0) criteria.zones = zones;
    if (userIds.length > 0) criteria.user_ids = userIds;

    if (Object.keys(criteria).length === 0) {
      return { error: 'Please select at least one target criteria' };
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
      console.error('[admin.push-history] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    const result = await response.json();
    return result;
  }

  if (action === 'retry-failed') {
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
      console.error('[admin.push-history] API error:', response.status, text);
      return { error: `API error: ${response.statusText}` };
    }

    const result = await response.json();
    return result;
  }

  return { error: 'Unknown action' };
}

export default function AdminPushHistory() {
  const loaderData = useLoaderData<typeof loader>();
  const { history, total, limit, offset, eventTypeFilter, eventTypes, participants } = loaderData;
  const fetcher = useFetcher();
  const [selectedTab, setSelectedTab] = useState<'history' | 'send-targeted' | 'broadcast'>('history');
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
    params.set('eventType', newEventType);
    window.location.search = params.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔔 Push Notifications Center</h1>
          <p className="text-gray-600 mt-2">Send notifications, track history, and manage targeted messaging</p>
        </div>

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{result.error}</p>
          </div>
        )}

        {result?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">
              ✅ Message sent successfully! Sent: {result.sent}, Failed: {result.failed}, Expired: {result.expired}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
              selectedTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 History
          </button>
          <button
            onClick={() => setSelectedTab('broadcast')}
            className={`px-4 py-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
              selectedTab === 'broadcast'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📢 Broadcast
          </button>
          <button
            onClick={() => setSelectedTab('send-targeted')}
            className={`px-4 py-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
              selectedTab === 'send-targeted'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Targeted
          </button>
        </div>

        {/* History Tab */}
        {selectedTab === 'history' && (
          <div>
            {/* Filter */}
            <div className="mb-6 flex gap-2">
              <select
                value={eventTypeFilter || ''}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">All Events</option>
                {eventTypes?.map((type: string) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Results</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sent At</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
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
                          {notif.status}
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
                        {notif.sent_at && new Date(notif.sent_at).toLocaleDateString('nl-NL', {
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
                          className="text-primary-600 hover:text-primary-800"
                        >
                          {expandedId === notif.id ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Expanded Details */}
              {expandedId && history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId) && (
                <div className="bg-gray-50 px-6 py-4 border-t">
                  <div className="space-y-2">
                    <p><strong>Message:</strong> {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.body}</p>
                    <p><strong>Target Type:</strong> {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.target_type}</p>
                    {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.target_criteria && (
                      <p><strong>Target Criteria:</strong> {JSON.stringify(history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.target_criteria)}</p>
                    )}
                  </div>

                  {history.find((h: Database['public']['Tables']['push_notifications_history']['Row']) => h.id === expandedId)?.failed_count! > 0 && (
                    <fetcher.Form method="POST" className="mt-4">
                      <input type="hidden" name="_action" value="retry-failed" />
                      <input type="hidden" name="historyId" value={expandedId} />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                      >
                        🔄 Retry Failed
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
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="py-2">
                Page {Math.floor((offset ?? 0) / (limit ?? 20)) + 1} of {Math.ceil(total / (limit ?? 20))}
              </span>
              <button
                onClick={() => handlePageChange((offset ?? 0) + (limit ?? 20))}
                disabled={(offset ?? 0) + (limit ?? 20) >= total}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Broadcast Tab */}
        {selectedTab === 'broadcast' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Send Broadcast Message</h2>
            <fetcher.Form method="POST" className="space-y-4">
              <input type="hidden" name="_action" value="send-broadcast" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., 🏁 Rally Gestart!"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="e.g., Het evenement is officieel begonnen..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type (optional)</label>
                <select name="eventType" className="w-full px-4 py-2 border rounded-lg">
                  <option value="custom">Custom</option>
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
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send to All'}
              </button>
            </fetcher.Form>
          </div>
        )}

        {/* Targeted Tab */}
        {selectedTab === 'send-targeted' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Send Targeted Message</h2>
            <fetcher.Form method="POST" className="space-y-4">
              <input type="hidden" name="_action" value="send-targeted" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., 🎯 Special Message"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="e.g., This message is for..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Participants</label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {(participants || []).map((p: any) => (
                    <label key={p.id} className="flex items-center">
                      <input type="checkbox" name="userIds" value={p.id} className="mr-2" />
                      <span>{`${p.first_name} ${p.last_name}` || p.email}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type (optional)</label>
                <select name="eventType" className="w-full px-4 py-2 border rounded-lg">
                  <option value="custom">Custom</option>
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
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Targeted Message'}
              </button>
            </fetcher.Form>
          </div>
        )}
      </div>
    </div>
  );
}
