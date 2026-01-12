import { createCookieSessionStorage, redirect } from 'react-router';

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'deurdenbochtchange2026';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__site_access',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'fallback-secret-change-in-production'],
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function getSiteAccessSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'));
}

export async function requireSitePassword(request: Request) {
  // Skip password check if SITE_PASSWORD is not set (for development)
  if (!process.env.SITE_PASSWORD) {
    return null;
  }

  const url = new URL(request.url);
  
  // Allow access to the password page itself
  if (url.pathname === '/site-access') {
    return null;
  }

  const session = await getSiteAccessSession(request);
  const hasAccess = session.get('hasAccess');

  if (!hasAccess) {
    throw redirect('/site-access?redirect=' + encodeURIComponent(url.pathname + url.search));
  }

  return null;
}

export async function verifySitePassword(password: string) {
  return password === SITE_PASSWORD;
}

export async function createSiteAccessSession(request: Request, redirectTo: string) {
  const session = await getSiteAccessSession(request);
  session.set('hasAccess', true);
  
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}
