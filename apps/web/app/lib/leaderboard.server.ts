import { supabase } from '~/lib/supabase.server';

/**
 * V1: Competition disabled - no rankings based on points
 * This returns empty rankings for now
 * @param participantIds - Array of participant IDs to get ranks for
 * @returns Empty map (no competition in V1)
 */
export async function getParticipantRanks(participantIds: string[]): Promise<Map<string, number>> {
  // V1: No competition/rankings - return empty map
  // Focus is on stories and experience, not points
  return new Map();
  
  /* DISABLED CODE - kept for potential future competition mode
  try {
    if (participantIds.length === 0) {
      return new Map();
    }

    // Get rally zones with points
    const rallyZones = await sanityClient.fetch(
      `*[_type == "rallyZone"] | order(order asc) {
        order,
        points,
        validAnswers
      }`
    );

    // Get all rally submissions (need all to calculate proper ranks)
    const { data: allSubmissions } = await supabase
      .from('rally_submissions')
      .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code');

    // Get shadow scores
    const { data: shadowScores } = await supabase
      .from('rally_zone_submissions')
      .select('participant_id, shadow_score');

    // Calculate scores for all participants
    const scores = (allSubmissions || []).map(sub => {
      let basicPoints = 0;
      let shadowTotal = 0;

      // Basic points
      for (let i = 1; i <= 8; i++) {
        const code = sub[`rz${i}_code` as keyof typeof sub] as string | null;
        if (code) {
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

      return {
        participant_id: sub.participant_id,
        totalScore: basicPoints + shadowTotal,
      };
    });

    // Sort by total score (descending) and create rank map
    const sorted = scores.sort((a, b) => b.totalScore - a.totalScore);
    const rankMap = new Map<string, number>();
    
    sorted.forEach((entry, index) => {
      rankMap.set(entry.participant_id, index + 1);
    });

    // Return only the requested participants
    const result = new Map<string, number>();
    participantIds.forEach(id => {
      const rank = rankMap.get(id);
      if (rank !== undefined) {
        result.set(id, rank);
      }
    });

    return result;
  } catch (error) {
    console.error('[leaderboard.server] Error calculating participant ranks:', error);
    return new Map();
  }
  */
}
