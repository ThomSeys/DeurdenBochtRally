import type { LoaderFunctionArgs } from 'react-router';
import { supabase } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get rally zones with points
    const rallyZones = await sanityClient.fetch(
      `*[_type == "rallyZone"] | order(order asc) {
        order,
        points,
        validAnswers
      }`
    );

    // Get all rally submissions
    const { data: allSubmissions } = await supabase
      .from('rally_submissions')
      .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code');

    // Get participant info
    const { data: participants } = await supabase
      .from('participants')
      .select('id, first_name, last_name, license_plate');

    // Get shadow scores
    const { data: shadowScores } = await supabase
      .from('rally_zone_submissions')
      .select('participant_id, shadow_score');

    // Calculate scores for all participants
    const leaderboard = (allSubmissions || [])
      .map(sub => {
        let basicPoints = 0;
        let shadowTotal = 0;
        let completedZones = 0;

        // Basic points
        for (let i = 1; i <= 8; i++) {
          const code = sub[`rz${i}_code` as keyof typeof sub] as string | null;
          if (code) {
            completedZones++;
            const zone = rallyZones[i - 1];
            const isCorrect = zone?.validAnswers?.some((answer: string) =>
              answer.toLowerCase() === code.toLowerCase()
            );
            if (isCorrect && zone?.points) {
              basicPoints += zone.points;
            }
          }
        }

        // Shadow points
        const participantShadowScores = shadowScores?.filter(
          s => s.participant_id === sub.participant_id
        ) || [];
        shadowTotal = participantShadowScores.reduce((sum, s) => sum + (s.shadow_score || 0), 0);

        // Get participant info
        const participant = participants?.find(p => p.id === sub.participant_id);

        return {
          participant_id: sub.participant_id,
          first_name: participant?.first_name || 'Unknown',
          last_name: participant?.last_name || '',
          license_plate: participant?.license_plate || '',
          basicPoints,
          shadowTotal,
          totalScore: basicPoints + shadowTotal,
          completedZones,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
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
