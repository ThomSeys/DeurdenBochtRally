import { useState, useEffect } from 'react';

export function NotificationBell({ isTransparent }: { isTransparent?: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  useEffect(() => {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'PUSH_RECEIVED') {
          setNotifications((prev) => [event.data.notification, ...prev].slice(0, 10));
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`relative p-2 transition-all ${
          isTransparent
            ? 'text-white/90 hover:text-white drop-shadow-md'
            : 'text-white hover:text-primary-100'
        }`}
        title="Notificaties"
      >
        {/* Custom Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowPanel(false)}
          />

          {/* Popover - Responsive positioning */}
          <div className="fixed sm:absolute sm:top-full sm:right-0 sm:mt-2 left-2 right-2 sm:left-auto sm:right-0 sm:w-96 z-40 w-auto max-w-[calc(80vw-1rem)] bg-white rounded-sm shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Notificaties</h3>
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm font-medium">Geen notificaties</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                      notif.read ? 'border-gray-300 opacity-75' : 'border-primary-600'
                    }`}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n, i) => (i === idx ? { ...n, read: true } : n))
                      );
                      setSelectedNotification(notif);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg
                          className="w-5 h-5 text-primary-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-gray-900 text-sm truncate ${!notif.read ? 'font-bold' : ''}`}>
                          {notif.title}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                          {notif.body}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {new Date(notif.timestamp).toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedNotification(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 border-b flex justify-between items-start gap-4">
                <h2 className="font-bold text-lg pr-4">{selectedNotification.title}</h2>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-white hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                  {selectedNotification.body}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedNotification.timestamp).toLocaleString('nl-NL')}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="border-t p-4 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-sm transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
