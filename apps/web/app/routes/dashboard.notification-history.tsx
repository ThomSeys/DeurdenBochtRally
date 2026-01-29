import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { useState } from 'react';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [{ title: 'Notification History - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const userId = await requireUserId(request);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  // Get delivery log for this participant
  const { data: notifications, count } = await supabaseAdmin
    .from('push_delivery_log')
    .select(
      `
      id,
      notification_history_id,
      delivery_status,
      error_message,
      first_attempt_at,
      push_notifications_history (
        id,
        title,
        body,
        event_type,
        sent_at
      )
    `,
      { count: 'exact' }
    )
    .eq('participant_id', userId)
    .order('first_attempt_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    notifications: notifications || [],
    total: count || 0,
    limit,
    offset,
  };
}

export default function DashboardNotificationHistory() {
  const { notifications, total, limit, offset } = useLoaderData<typeof loader>();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams();
    params.set('offset', newOffset.toString());
    params.set('limit', (limit || 20).toString());
    window.location.search = params.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="bell" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Meldingengeschiedenis</h1>
          <p className="text-xl text-primary-100">Bekijk alle verzonden notificaties</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Icon name="bell" className="w-8 h-8" />
            Je Meldingen
          </h1>
          <p className="text-gray-600 mt-2">Bekijk de geschiedenis van meldingen die je hebt ontvangen</p>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Je hebt nog geen meldingen ontvangen.</p>
          </div>
        ) : (
          <>
            {/* Notifications Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Titel</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ontvangen</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notifications.map((notif: any) => (
                    <tr key={notif.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {notif.push_notifications_history?.title || 'Melding'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {notif.push_notifications_history?.event_type || 'custom'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {notif.delivery_status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <Icon name="check-circle" className="w-4 h-4" />
                            Bezorgd
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            <Icon name="x-circle" className="w-4 h-4" />
                            Mislukt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {notif.first_attempt_at
                          ? new Date(notif.first_attempt_at).toLocaleDateString('nl-NL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
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
                notifications.find((n: any) => n.id === expandedId) && (
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="space-y-2">
                      <p>
                        <strong>Titel:</strong>{' '}
                        {notifications.find((n: any) => n.id === expandedId)?.push_notifications_history?.title}
                      </p>
                      <p>
                        <strong>Bericht:</strong>{' '}
                        {notifications.find((n: any) => n.id === expandedId)?.push_notifications_history?.body}
                      </p>
                      {notifications.find((n: any) => n.id === expandedId)?.error_message && (
                        <p>
                          <strong>Reden:</strong> {notifications.find((n: any) => n.id === expandedId)?.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="mt-6 flex gap-2 justify-between">
                <button
                  onClick={() => handlePageChange(Math.max(0, (offset ?? 0) - (limit ?? 20)))}
                  disabled={(offset ?? 0) === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50 font-medium"
                >
                  ← Vorige
                </button>
                <span className="py-2">
                  Pagina {Math.floor((offset ?? 0) / (limit ?? 20)) + 1} van{' '}
                  {Math.ceil(total / (limit ?? 20))}
                </span>
                <button
                  onClick={() => handlePageChange((offset ?? 0) + (limit ?? 20))}
                  disabled={(offset ?? 0) + (limit ?? 20) >= total}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50 font-medium"
                >
                  Volgende →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
