import React from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { getUser } from "~/lib/session.server";
import { requireSitePassword } from "~/lib/site-password.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
    crossOrigin: "anonymous",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireSitePassword(request);
  const user = await getUser(request);
  return { user };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
  
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify({
              VITE_VAPID_PUBLIC_KEY: vapidPublicKey,
            })};`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = React.useState(false);

  React.useEffect(() => {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'PUSH_RECEIVED') {
          // Add to notifications list
          setNotifications((prev) => [event.data.notification, ...prev].slice(0, 10));
        } else if (event.data.type === 'NOTIFICATION_CLICKED') {
          // Show clicked notification
          setShowNotificationPanel(false);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell Icon in Header */}
      <div className="fixed top-4 right-4 z-40">
        <div className="relative">
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            title="Notificaties"
          >
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {showNotificationPanel && (
            <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Notificaties</h3>
                  <button
                    onClick={() => setShowNotificationPanel(false)}
                    className="text-white hover:opacity-80"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">Geen notificaties</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-primary-600"
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n, i) => (i === idx ? { ...n, read: true } : n))
                        );
                      }}
                    >
                      <div className="flex gap-2">
                        <span className="text-lg flex-shrink-0">📬</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {notif.title}
                          </h4>
                          <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                            {notif.body}
                          </p>
                          <p className="text-gray-400 text-xs mt-2">
                            {new Date(notif.timestamp).toLocaleTimeString('nl-NL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oeps!";
  let details = "Er is een onverwachte fout opgetreden.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
