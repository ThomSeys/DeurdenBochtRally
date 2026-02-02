import type { ActionFunctionArgs } from 'react-router';
import { logout } from '~/lib/session.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  await requestLogger.info('auth', 'Logout initiated via action');
  try {
    const res = await logout(request);
    await requestLogger.info('auth', 'Logout successful');
    return res;
  } catch (error) {
    await requestLogger.error('auth', 'Logout failed', error as Error);
    throw error;
  }
}

export async function loader({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  await requestLogger.info('auth', 'Logout initiated via loader');
  try {
    const res = await logout(request);
    await requestLogger.info('auth', 'Logout successful');
    return res;
  } catch (error) {
    await requestLogger.error('auth', 'Logout failed', error as Error);
    throw error;
  }
}
