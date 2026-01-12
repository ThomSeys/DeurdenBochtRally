import type { ActionFunctionArgs } from 'react-router';
import { recalculateAllShadowScores } from '~/lib/shadow-rally.server';
import { requireUserId } from '~/lib/session.server';

export async function action({ request }: ActionFunctionArgs) {
  // TODO: Add admin check here
  await requireUserId(request);
  
  if (request.method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }
  
  try {
    await recalculateAllShadowScores();
    return { success: true, message: 'Shadow scores recalculated successfully' };
  } catch (error) {
    console.error('Shadow score calculation error:', error);
    return { error: 'Failed to calculate shadow scores', status: 500 };
  }
}
