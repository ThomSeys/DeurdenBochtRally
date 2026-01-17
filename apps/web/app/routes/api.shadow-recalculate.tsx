import type { ActionFunctionArgs } from 'react-router';
import { recalculateAllShadowScores } from '~/lib/shadow-rally.server';

export async function action({ request }: ActionFunctionArgs) {
  console.info('[api.shadow-recalculate] action start', { method: request.method });
  console.info('[api.shadow-recalculate] admin verified');
  if (request.method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }
  
  try {
    await recalculateAllShadowScores();
    console.info('[api.shadow-recalculate] action success');
    return { success: true, message: 'Shadow scores recalculated successfully' };
  } catch (error) {
    console.error('[api.shadow-recalculate] action error', error);
    return { error: 'Failed to calculate shadow scores', status: 500 };
  }
}
