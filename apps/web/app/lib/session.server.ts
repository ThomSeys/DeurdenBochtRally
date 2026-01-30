import { createCookieSessionStorage, redirect } from 'react-router';
import { supabaseAdmin } from './supabase.server';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required');
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return undefined;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const { data } = await supabaseAdmin
    .from('participants')
    .select('*, is_admin')
    .eq('id', userId)
    .single();

  // If user doesn't exist or payment is not completed, invalidate the session
  if (!data || data.payment_status !== 'completed') {
    const session = await getUserSession(request);
    throw redirect('/login', {
      headers: {
        'Set-Cookie': await sessionStorage.destroySession(session),
      },
    });
  }

  return data;
}

export async function requireAdmin(request: Request) {
  const userId = await requireUserId(request);
  
  const { data: user } = await supabaseAdmin
    .from('participants')
    .select('is_admin, payment_status')
    .eq('id', userId)
    .single();

  // Validate user exists and has completed payment
  if (!user || user.payment_status !== 'completed') {
    const session = await getUserSession(request);
    throw redirect('/login', {
      headers: {
        'Set-Cookie': await sessionStorage.destroySession(session),
      },
    });
  }

  if (!user.is_admin) {
    throw redirect('/dashboard');
  }

  return userId;
}

export async function logout(request: Request) {
  // Destroy the session cookie
  const session = await getUserSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
