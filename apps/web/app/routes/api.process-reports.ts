import type { ActionFunctionArgs } from 'react-router';
import { processReportQueue } from '~/lib/report-worker.server';
import { requireAdmin } from '~/lib/session.server';

/**
 * API endpoint to process report queue
 * Can be called manually or by a cron job
 */
export async function action({ request }: ActionFunctionArgs) {
  // Verify admin or check for a secret token for cron jobs
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader === `Bearer ${cronSecret}`) {
    // Valid cron request
  } else {
    // Must be admin
    await requireAdmin(request);
  }

  try {
    const result = await processReportQueue();
    
    return Response.json({
      success: true,
      processed: result.processed,
      message: `Verwerkt ${result.processed} rapport(en)`,
    });
  } catch (error) {
    console.error('Report processing error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
