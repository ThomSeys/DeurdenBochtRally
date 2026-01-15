import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';

export interface ParticipantRank {
  participantId: string;
  rank: number;
  basicPoints: number;
  shadowTotal: number;
  totalScore: number;
}

/**
 * Calculate the current leaderboard with rankings
 * Returns map of participantId -> ParticipantRank
 */
export async function calculateLeaderboard(): Promise<Map<string, ParticipantRank>> {
  // Get rally zones with points from Sanity
  const rallyZones = await sanityClient.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      order,
      points,
      validAnswers
    }`
  );

  // Get all rally submissions with codes
  const { data: submissions } = await supabaseAdmin
    .from('rally_submissions')
    .select(`
      participant_id,
      rz1_code, rz2_code, rz3_code, rz4_code,
      rz5_code, rz6_code, rz7_code, rz8_code
    `);

  // Get shadow scores for all participants
  const { data: shadowScores } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('participant_id, zone_id, shadow_score');

  // Calculate leaderboard
  const scores: Array<{
    participantId: string;
    basicPoints: number;
    shadowTotal: number;
    totalScore: number;
  }> = (submissions || []).map(submission => {
    let basicPoints = 0;
    let shadowTotal = 0;

    // Calculate basic points (correct answers)
    for (let i = 1; i <= 8; i++) {
      const code = submission[`rz${i}_code` as keyof typeof submission] as string | null;
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

    // Calculate shadow score total
    const participantShadowScores = shadowScores?.filter(
      s => s.participant_id === submission.participant_id
    ) || [];
    shadowTotal = participantShadowScores.reduce((sum, s) => sum + (s.shadow_score || 0), 0);

    return {
      participantId: submission.participant_id,
      basicPoints,
      shadowTotal,
      totalScore: basicPoints + shadowTotal
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  // Create map with rankings
  const rankMap = new Map<string, ParticipantRank>();
  scores.forEach((score, index) => {
    rankMap.set(score.participantId, {
      participantId: score.participantId,
      rank: index + 1,
      basicPoints: score.basicPoints,
      shadowTotal: score.shadowTotal,
      totalScore: score.totalScore,
    });
  });

  return rankMap;
}

/**
 * Get a participant's rank (position in leaderboard)
 */
export async function getParticipantRank(participantId: string): Promise<number | null> {
  const leaderboard = await calculateLeaderboard();
  const rank = leaderboard.get(participantId);
  return rank?.rank || null;
}

/**
 * Get ranks for multiple participants
 */
export async function getParticipantRanks(participantIds: string[]): Promise<Map<string, number>> {
  const leaderboard = await calculateLeaderboard();
  const ranks = new Map<string, number>();
  
  participantIds.forEach(id => {
    const rank = leaderboard.get(id);
    if (rank) {
      ranks.set(id, rank.rank);
    }
  });
  
  return ranks;
}
