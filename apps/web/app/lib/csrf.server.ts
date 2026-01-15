import crypto from 'crypto';
import { createCookieSessionStorage } from 'react-router';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required');
}

const csrfCookieStorage = createCookieSessionStorage({
  cookie: {
    name: '__csrf-token',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production',
  },
});

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get or create CSRF token for a request
 */
export async function getCSRFToken(request: Request): Promise<string> {
  const session = await csrfCookieStorage.getSession(request.headers.get('Cookie'));
  let token = session.get('csrfToken');
  
  // Generate new token if not exists
  if (!token) {
    token = generateCSRFToken();
    session.set('csrfToken', token);
  }
  
  return token;
}

/**
 * Verify CSRF token from request
 */
export async function verifyCSRFToken(request: Request): Promise<boolean> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return true; // Safe methods don't need CSRF verification
  }

  const session = await csrfCookieStorage.getSession(request.headers.get('Cookie'));
  const storedToken = session.get('csrfToken');

  if (!storedToken) {
    return false; // No token stored
  }

  try {
    const formData = await request.clone().formData();
    const formToken = formData.get('__csrf');
    
    if (!formToken || typeof formToken !== 'string') {
      return false; // No token in form
    }

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(storedToken, formToken);
  } catch {
    return false; // Failed to read form data
  }
}

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Commit CSRF token to session (returns Set-Cookie header value)
 */
export async function commitCSRFToken(request: Request): Promise<string> {
  const session = await csrfCookieStorage.getSession(request.headers.get('Cookie'));
  let token = session.get('csrfToken');
  
  if (!token) {
    token = generateCSRFToken();
    session.set('csrfToken', token);
  }
  
  return csrfCookieStorage.commitSession(session);
}
