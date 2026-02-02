import type { LoaderFunctionArgs } from 'react-router';
import { supabase } from '~/lib/supabase.server';
import { isFeatureEnabled } from '~/lib/feature-flags.server';
import { createRequestLogger } from '~/lib/logger.server';

// V1: Leaderboard disabled - focus on stories and experience, not competition
export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('api-call', 'Leaderboard API called');
  
  // Check if leaderboard is enabled
  const leaderboardEnabled = await isFeatureEnabled('leaderboard-enabled');
  
  if (!leaderboardEnabled) {
    return new Response(JSON.stringify({ error: 'Leaderboard is currently disabled' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get participant info for simple zone visit tracking
    const { data: participants } = await supabase
      .from('participants')
      .select('id, first_name, last_name, license_plate');

    // Get rally submissions (just for zone count)
    const { data: allSubmissions } = await supabase
      .from('rally_submissions')
      .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code');

    // Simple zone visit count (no points)
    const leaderboard = (allSubmissions || [])
      .map(sub => {
        let completedZones = 0;

        // Count zones visited
        for (let i = 1; i <= 8; i++) {
          const code = sub[`rz${i}_code` as keyof typeof sub] as string | null;
          if (code && code.trim()) {
            completedZones++;
          }
        }

        const participant = participants?.find(p => p.id === sub.participant_id);

        return {
          participant_id: sub.participant_id,
          first_name: participant?.first_name || 'Unknown',
          last_name: participant?.last_name || '',
          license_plate: participant?.license_plate || '',
          completedZones,
          // No points/scores in V1
          basicPoints: 0,
          shadowTotal: 0,
          totalScore: 0,
        };
      })
      .sort((a, b) => b.completedZones - a.completedZones)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return new Response(JSON.stringify(leaderboard), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
