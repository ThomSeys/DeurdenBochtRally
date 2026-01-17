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
import CookieBanner from "~/components/CookieBanner";
import RallySubmissionFAB from "~/components/RallySubmissionFAB";
import { EmergencySOSButton } from "~/components/EmergencySOSButton";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo.svg", type: "image/svg+xml" },
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
  
  // Import server-only module inside the loader
  const { getCSRFToken } = await import("~/lib/csrf.server");
  const csrfToken = await getCSRFToken(request);
  
  return { 
    user,
    csrfToken,
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
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.info('[sw] Service worker registered', registration.scope);
        })
        .catch((error) => {
          console.error('[sw] Service worker registration failed', error);
        });
    }
  }, []);

  return (
    <>
      <Outlet />
      {data?.user && <EmergencySOSButton />}
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
