import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import { useEffect } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { getUser } from "~/lib/session.server";
import { requireSitePassword } from "~/lib/site-password.server";
import { getFeatureFlags } from "~/lib/feature-flags.server";
import { getSiteConfig } from "~/lib/sanity.server";
import CookieBanner from "~/components/CookieBanner";
import RallySubmissionFAB from "~/components/RallySubmissionFAB";
import { EmergencySOSButton } from "~/components/EmergencySOSButton";
import { AuthProvider } from "~/contexts/AuthContext";
import { ToastProvider } from "~/contexts/ToastContext";
import { ToastContainer } from "~/components/ToastContainer";
import { ModalProvider } from "~/contexts/ModalContext";
import { ModalContainer } from "~/components/ModalContainer";
import { AppStateProvider } from "~/contexts/AppStateContext";
import { FeatureFlagsProvider, useFeatureFlags } from "~/contexts/FeatureFlagsContext";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo.svg", type: "image/svg+xml" },
  { rel: "manifest", href: "/manifest.json" },
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

export const handle = { id: "root" };

export async function loader({ request }: Route.LoaderArgs) {
  await requireSitePassword(request);
  const user = await getUser(request);
  
  // Import server-only module inside the loader
  const { getCSRFToken } = await import("~/lib/csrf.server");
  const csrfToken = await getCSRFToken(request);
  
  // Get feature flags from Sanity
  const featureFlags = await getFeatureFlags();
  
  // Get site config for event date
  const siteConfig = await getSiteConfig();
  const eventDate = siteConfig?.eventDate || '2026-05-16';
  
  return { 
    user,
    csrfToken,
    featureFlags,
    eventDate,
  };
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
        <CookieBanner />
        <RallySubmissionFAB />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<typeof loader>('root');

  useEffect(() => {
    // Register service worker on app load - uses network-first strategy
    if ('serviceWorker' in navigator) {
      // Unregister old service workers first (cleanup)
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.info(`[sw] Found ${registrations.length} existing service worker(s)`);
        registrations.forEach((registration) => {
          console.info('[sw] Existing SW scope:', registration.scope);
        });
      });

      navigator.serviceWorker.register('/sw.js', { 
        scope: '/',
        updateViaCache: 'none' // Always fetch fresh SW
      })
        .then((registration) => {
          console.info('[sw] Service worker registered successfully', {
            scope: registration.scope,
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            active: !!registration.active
          });

          // Check for updates immediately
          registration.update().catch((err) => {
            console.warn('[sw] Update check failed:', err);
          });

          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60000);
        })
        .catch((error) => {
          console.error('[sw] Service worker registration failed:', {
            error: error.message,
            name: error.name,
            stack: error.stack
          });
        });
    } else {
      console.warn('[sw] Service workers not supported in this browser');
    }
  }, []);

  return (
    <AuthProvider>
      <FeatureFlagsProvider flags={data?.featureFlags || {}}>
        <EmergencySOSWrapper user={data?.user} />
        <ToastProvider>
          <ModalProvider>
            <AppStateProvider>
              <Outlet />
              <ToastContainer />
              <ModalContainer />
            </AppStateProvider>
          </ModalProvider>
        </ToastProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}

function EmergencySOSWrapper({ user }: { user: any }) {
  const { isEnabled } = useFeatureFlags();
  const emergencySosEnabled = isEnabled('emergency-sos-enabled');
  
  if (!user || !emergencySosEnabled) return null;
  return <EmergencySOSButton />;
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
