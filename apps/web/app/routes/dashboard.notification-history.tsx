import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { useState } from 'react';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [{ title: 'Notification History - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Dashboard notification history loaded');

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
        sent_at,
        event_data
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
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

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
            <div className="flex justify-center mb-4">
              <Icon name="bell" className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen notificaties</h3>
            <p className="text-gray-600">Je hebt nog geen meldingen ontvangen.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="bg-white rounded-lg shadow p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 break-words">
                        {notif.push_notifications_history?.title || 'Melding'}
                      </h3>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium whitespace-nowrap">
                          {notif.push_notifications_history?.event_type || 'custom'}
                        </span>
                        {notif.delivery_status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold whitespace-nowrap">
                            <Icon name="check" className="w-3 h-3" />
                            Bezorgd
                          </span>
                        ) : notif.delivery_status === 'expired' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold whitespace-nowrap">
                            <Icon name="clock" className="w-3 h-3" />
                            Verlopen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold whitespace-nowrap">
                            <Icon name="x" className="w-3 h-3" />
                            Mislukt
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      {notif.first_attempt_at
                        ? new Date(notif.first_attempt_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>

                    <button
                      onClick={() => setSelectedNotification(notif)}
                      className="w-full px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded transition-colors"
                    >
                      Toon Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
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
                        {notif.delivery_status === 'sent' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <Icon name="check" className="w-4 h-4" />
                            Bezorgd
                          </span>
                        ) : notif.delivery_status === 'expired' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                            <Icon name="clock" className="w-4 h-4" />
                            Verlopen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            <Icon name="x" className="w-4 h-4" />
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
                          onClick={() => setSelectedNotification(notif)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-2 justify-between items-center">
                <button
                  onClick={() => handlePageChange(Math.max(0, (offset ?? 0) - (limit ?? 20)))}
                  disabled={(offset ?? 0) === 0}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50 font-medium text-sm"
                >
                  ← Vorige
                </button>
                <span className="text-sm text-gray-600">
                  Pagina {Math.floor((offset ?? 0) / (limit ?? 20)) + 1} van{' '}
                  {Math.ceil(total / (limit ?? 20))}
                </span>
                <button
                  onClick={() => handlePageChange((offset ?? 0) + (limit ?? 20))}
                  disabled={(offset ?? 0) + (limit ?? 20) >= total}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-900 rounded disabled:opacity-50 font-medium text-sm"
                >
                  Volgende →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1100]"
          onClick={() => setSelectedNotification(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b sticky top-0 bg-white">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedNotification.push_notifications_history?.title || 'Melding'}
                </h2>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {selectedNotification.push_notifications_history?.event_type || 'custom'}
                  </span>
                  {selectedNotification.delivery_status === 'sent' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      <Icon name="check" className="w-3 h-3" />
                      Bezorgd
                    </span>
                  ) : selectedNotification.delivery_status === 'expired' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                      <Icon name="clock" className="w-3 h-3" />
                      Verlopen
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                      <Icon name="x" className="w-3 h-3" />
                      Mislukt
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="x" className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bericht</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedNotification.push_notifications_history?.body}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Ontvangen</h3>
                <p className="text-gray-900">
                  {selectedNotification.first_attempt_at
                    ? new Date(selectedNotification.first_attempt_at).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </p>
              </div>

              {selectedNotification.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Foutmelding</h3>
                  <p className="text-red-900 text-sm">{selectedNotification.error_message}</p>
                </div>
              )}

              {selectedNotification.push_notifications_history?.event_data?.actionUrl && (
                <div className="pt-2">
                  <a
                    href={selectedNotification.push_notifications_history.event_data.actionUrl}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors w-full justify-center"
                    onClick={() => setSelectedNotification(null)}
                  >
                    {selectedNotification.push_notifications_history.event_data.actionLabel || 'Bekijk Details'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
