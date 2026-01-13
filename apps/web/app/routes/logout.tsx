import type { ActionFunctionArgs } from 'react-router';
import { logout } from '~/lib/session.server';

export async function action({ request }: ActionFunctionArgs) {
  console.info('[logout] action start');
  try {
    const res = await logout(request);
    console.info('[logout] action success');
    return res;
  } catch (error) {
    console.error('[logout] action error', error);
    throw error;
  }
}

export async function loader({ request }: ActionFunctionArgs) {
  console.info('[logout] loader start');
  try {
    const res = await logout(request);
    console.info('[logout] loader success');
    return res;
  } catch (error) {
    console.error('[logout] loader error', error);
    throw error;
  }
}
