import { createCookieSessionStorage, redirect } from 'react-router';
import { supabase } from './supabase.server';

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

  try {
    const { data } = await supabase
      .from('participants')
      .select('*, is_admin')
      .eq('id', userId)
      .single();

    return data;
  } catch (error) {
    // If offline or network error, return a default user object
    // This allows the app to work offline with cached data
    console.warn('[session] getUser failed, returning default user:', error);
    return {
      id: userId,
      is_admin: false,
      first_name: 'User',
      last_name: '',
    };
  }
}

export async function requireAdmin(request: Request) {
  const userId = await requireUserId(request);
  
  const { data: user } = await supabase
    .from('participants')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (!user?.is_admin) {
    throw redirect('/dashboard');
  }

  return userId;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
