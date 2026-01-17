/**
 * 🧮 SHADOW RALLY — Score Engine
 * 
 * Calculates rhythm and vision scores for each Rally Zone submission
 * based on the technical specification.
 */

import { supabaseAdmin } from './supabase.server';

/**
 * Normalize text for comparison
 * - lowercase
 * - remove accents
 * - remove punctuation
 * - trim whitespace
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate correctness score based on string similarity
 * 
 * ≥ 90% → 1.0
 * 75-90% → 0.7
 * 50-75% → 0.5
 * < 50% → 0
 */
function calculateCorrectness(normalizedAnswer: string, validAnswers: string[]): number {
  let maxSimilarity = 0;
  
  for (const validAnswer of validAnswers) {
    const similarity = stringSimilarity(normalizedAnswer, normalizeAnswer(validAnswer));
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  if (maxSimilarity >= 0.9) return 1.0;
  if (maxSimilarity >= 0.75) return 0.7;
  if (maxSimilarity >= 0.5) return 0.5;
  return 0;
}

/**
 * Calculate rarity score based on answer frequency
 * 
 * 1-2 times → 1.0
 * 3-5 times → 0.8
 * 6-15 times → 0.5
 * 16-40 times → 0.2
 * >40 times → 0
 */
function calculateRarity(frequency: number): number {
  if (frequency <= 2) return 1.0;
  if (frequency <= 5) return 0.8;
  if (frequency <= 15) return 0.5;
  if (frequency <= 40) return 0.2;
  return 0;
}

/**
 * Calculate rhythm score for a zone submission
 * 
 * ritme = max(0, 100 - straf)
 * straf = Δ × (Δ + 1) / 2
 * Δ = |zone_time - mediaan|
 */
function calculateRhythmScore(zoneTime: number, medianTime: number): number {
  const delta = Math.abs(zoneTime - medianTime);
  const penalty = (delta * (delta + 1)) / 2;
  return Math.max(0, 100 - penalty);
}

/**
 * Calculate median from array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Get valid answers for a Rally Zone by zone number (1-8) or _id
 */
async function getValidAnswers(zoneIdentifier: string): Promise<string[]> {
  const { sanityClient } = await import('./sanity.server');
  
  // Try to parse as zone number first (1-8)
  const zoneNum = parseInt(zoneIdentifier, 10);
  
  let zone;
  if (!isNaN(zoneNum) && zoneNum >= 1 && zoneNum <= 8) {
    // Look up by zone number (order field is 1-indexed: 1, 2, 3... 8)
    zone = await sanityClient.fetch(
      `*[_type == "rallyZone" && order == $order][0] {
        _id,
        title,
        checkpoints[] {
          solution,
          validAnswers
        }
      }`,
      { order: zoneNum }
    );
    
    console.info(`[getValidAnswers] Zone lookup for order ${zoneNum}:`, JSON.stringify(zone, null, 2));
    
    if (zone?.checkpoints) {
      // Collect all valid answers from all checkpoints
      const allValidAnswers: string[] = [];
      for (const checkpoint of zone.checkpoints) {
        if (checkpoint.validAnswers && checkpoint.validAnswers.length > 0) {
          allValidAnswers.push(...checkpoint.validAnswers);
        }
        if (checkpoint.solution) {
          allValidAnswers.push(checkpoint.solution);
        }
      }
      console.info(`[getValidAnswers] Zone ${zoneNum}: found ${allValidAnswers.length} valid answers`);
      return allValidAnswers;
    }
  } else {
    // Look up by _id (legacy)
    zone = await sanityClient.fetch(
      `*[_type == "rallyZone" && _id == $zoneId][0] {
        validAnswers,
        solution
      }`,
      { zoneId: zoneIdentifier }
    );
    
    if (zone) {
      return zone.validAnswers || [zone.solution];
    }
  }
  
  console.warn(`[getValidAnswers] No valid answers found for zone ${zoneIdentifier}`);
  return [];
}

/**
 * Calculate shadow scores for all submissions in a specific Rally Zone
 */
export async function calculateZoneShadowScores(zoneId: string): Promise<void> {
  // 1. Get all submissions for this zone
  const { data: submissions, error } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('*')
    .eq('zone_id', zoneId)
    .not('answer_timestamp', 'is', null); // Only submissions with answers
  
  if (error || !submissions || submissions.length === 0) {
    return;
  }
  
  // Separate manual and regular submissions
  const manualSubmissions = submissions.filter(s => s.is_manual === true);
  const regularSubmissions = submissions.filter(s => s.is_manual !== true);
  
  // 2. Calculate zone times for regular submissions only (exclude manual entries)
  const zoneTimes = regularSubmissions.map(sub => {
    const entryTime = new Date(sub.entry_timestamp).getTime();
    const answerTime = new Date(sub.answer_timestamp!).getTime();
    const minutes = Math.round((answerTime - entryTime) / 60000);
    return { id: sub.id, minutes };
  });
  
  // 3. Calculate median zone time (from regular submissions only)
  const medianTime = zoneTimes.length > 0 
    ? calculateMedian(zoneTimes.map(zt => zt.minutes))
    : 0;
  
  // 4. Get valid answers for this zone
  const validAnswers = await getValidAnswers(zoneId);
  console.info(`[shadow-scores] Zone ${zoneId}: Found ${validAnswers.length} valid answers:`, validAnswers);
  
  // 5. Count answer frequencies (only correct answers)
  const answerFrequency = new Map<string, number>();
  
  for (const sub of submissions) {
    if (!sub.submitted_answer) continue;
    
    const normalized = normalizeAnswer(sub.submitted_answer);
    const correctness = calculateCorrectness(normalized, validAnswers);
    
    console.info(`[shadow-scores] Zone ${zoneId}, submission ${sub.id}: answer="${sub.submitted_answer}", normalized="${normalized}", correctness=${correctness}`);
    
    if (correctness > 0) {
      answerFrequency.set(normalized, (answerFrequency.get(normalized) || 0) + 1);
    }
  }
  
  console.info(`[shadow-scores] Zone ${zoneId}: Answer frequency map:`, Array.from(answerFrequency.entries()));
  
  // 6. Calculate scores for each submission
  for (const sub of submissions) {
    // Manual entries get rhythm_score = 0 (no timing advantage)
    const isManual = sub.is_manual === true;
    const zoneTime = zoneTimes.find(zt => zt.id === sub.id)?.minutes || 0;
    
    // Rhythm score (0 for manual entries)
    const rhythmScore = isManual ? 0 : calculateRhythmScore(zoneTime, medianTime);
    
    // View score (Blik)
    let viewScore = 0;
    if (sub.submitted_answer) {
      const normalized = normalizeAnswer(sub.submitted_answer);
      const correctness = calculateCorrectness(normalized, validAnswers);
      
      if (correctness > 0) {
        const frequency = answerFrequency.get(normalized) || 0;
        const rarity = calculateRarity(frequency);
        viewScore = 100 * correctness * rarity;
        
        console.info(`[shadow-scores] Zone ${zoneId}, submission ${sub.id}: correctness=${correctness}, frequency=${frequency}, rarity=${rarity}, viewScore=${viewScore}`);
      } else {
        console.info(`[shadow-scores] Zone ${zoneId}, submission ${sub.id}: correctness=0, no view score`);
      }
    }
    
    // Shadow score (0-200, sum of rhythm 0-100 and view 0-100)
    const shadowScore = rhythmScore + viewScore;
    
    console.info(`[shadow-scores] Zone ${zoneId}, submission ${sub.id}: rhythmScore=${rhythmScore}, viewScore=${viewScore}, shadowScore=${shadowScore}`);
    
    // Update submission
    await supabaseAdmin
      .from('rally_zone_submissions')
      .update({
        zone_time_minutes: zoneTime,
        rhythm_score: Math.round(rhythmScore * 10) / 10,
        view_score: Math.round(viewScore * 10) / 10,
        shadow_score: Math.round(shadowScore * 10) / 10,
        correctness_score: sub.submitted_answer 
          ? calculateCorrectness(normalizeAnswer(sub.submitted_answer), validAnswers)
          : 0,
        normalized_answer: sub.submitted_answer ? normalizeAnswer(sub.submitted_answer) : null,
        is_correct: sub.submitted_answer 
          ? calculateCorrectness(normalizeAnswer(sub.submitted_answer), validAnswers) > 0
          : false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);
  }
}

/**
 * Calculate final scores for a participant
 * Combines visible rally points with shadow scores
 * 
 * final_score = visible_score × 10 + shadow_total
 */
export async function calculateFinalScore(participantId: string): Promise<void> {
  // 1. Get main rally submission
  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', participantId)
    .single();
  
  if (!submission) return;
  
  // 2. Get all zone submissions for this participant
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('shadow_score')
    .eq('participant_id', participantId);
  
  // 3. Calculate shadow total
  const shadowTotal = zoneSubmissions?.reduce((sum, sub) => sum + (sub.shadow_score || 0), 0) || 0;
  
  // 4. Calculate final score
  const visibleScore = submission.total_points || 0;
  const finalScore = visibleScore * 10 + shadowTotal;
  
  // 5. Update submission
  await supabaseAdmin
    .from('rally_submissions')
    .update({
      shadow_total: Math.round(shadowTotal * 10) / 10,
      final_score: Math.round(finalScore * 10) / 10,
    })
    .eq('participant_id', participantId);
}

/**
 * Recalculate all shadow scores for all zones
 * Run this after all submissions are in
 */
export async function recalculateAllShadowScores(): Promise<void> {
  // Get all unique zone IDs
  const { data: zones } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('zone_id')
    .not('answer_timestamp', 'is', null);
  
  if (!zones) return;
  
  const uniqueZoneIds = [...new Set(zones.map(z => z.zone_id))];
  
  // Calculate scores for each zone
  for (const zoneId of uniqueZoneIds) {
    await calculateZoneShadowScores(zoneId);
  }
  
  // Get all participants who submitted
  const { data: participants } = await supabaseAdmin
    .from('rally_submissions')
    .select('participant_id');
  
  if (!participants) return;
  
  // Calculate final scores for each participant
  for (const { participant_id } of participants) {
    await calculateFinalScore(participant_id);
  }
}

/**
 * Get leaderboard with shadow scores
 */
export async function getShadowLeaderboard() {
  const { data, error } = await supabaseAdmin
    .from('rally_submissions')
    .select(`
      *,
      participants!inner (
        first_name,
        last_name,
        motorcycle_brand,
        motorcycle_model
      )
    `)
    .not('final_score', 'is', null)
    .order('final_score', { ascending: false });
  
  if (error) throw error;
  
  return data;
}
