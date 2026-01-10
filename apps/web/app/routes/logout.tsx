import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { destroySession, getSession } from '~/lib/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
}

export default function Logout() {
  return null;
}
