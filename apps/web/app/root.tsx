import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import { getUser, getSession } from './lib/session.server';
import styles from './styles/global.css?url';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: styles },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Skip password check for the password page itself and API routes
  if (!pathname.startsWith('/site-password') && !pathname.startsWith('/api')) {
    const session = await getSession(request.headers.get('Cookie'));
    const sitePassword = process.env.SITE_PASSWORD;
    
    // Only enforce password if SITE_PASSWORD is set
    if (sitePassword && !session.get('siteAccessGranted')) {
      return redirect('/site-password');
    }
  }
  
  const user = await getUser(request);
  return json({ user });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  
  return <Outlet context={{ user }} />;
}
