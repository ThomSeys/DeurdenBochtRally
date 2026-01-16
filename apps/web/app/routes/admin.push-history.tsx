import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher, Link } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import type { Database } from '~/lib/database.types';
import { useState } from 'react';
import { Icon } from '~/components/Icon';
import Header from '~/components/Header';

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
      <Header />

      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="clock" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Meldingen Geschiedenis</h1>
          <p className="text-xl text-primary-100">Bekijk alle verzonden push notificaties</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 hidden">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Push Notifications Center
            </h1>
            <p className="text-gray-600 mt-2">Send notifications, track history, and manage targeted messaging</p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{result.error}</p>
          </div>
        )}

        {result?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Message sent successfully! Sent: {result.sent}, Failed: {result.failed}, Expired: {result.expired}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 border-b-2 transition whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
              selectedTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            History
          </button>
          <button
            onClick={() => setSelectedTab('broadcast')}
            className={`px-4 py-2 border-b-2 transition whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
              selectedTab === 'broadcast'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Broadcast
          </button>
          <button
            onClick={() => setSelectedTab('send-targeted')}
            className={`px-4 py-2 border-b-2 transition whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
              selectedTab === 'send-targeted'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Targeted
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
                          <p className="flex items-center gap-1">
                            <Icon name="check" className="w-4 h-4 text-green-600" /> {notif.success_count}/{notif.recipient_count}
                          </p>
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
