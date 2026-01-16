import { createClient } from '@supabase/supabase-js';

require('dotenv').config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function calculateRhythmScore(zoneTime: number, medianTime: number): number {
  const delta = Math.abs(zoneTime - medianTime);
  const penalty = (delta * (delta + 1)) / 2;
  return Math.max(0, 100 - penalty);
}

async function recalculateAllRhythmScores() {
  const { data: allSubmissions, error } = await supabase
    .from('rally_zone_submissions')
    .select('*')
    .not('answer_timestamp', 'is', null);

  if (error || !allSubmissions) {
    console.error('Error fetching submissions:', error);
    return;
  }

  // Group by zone_id
  const byZone = allSubmissions.reduce((acc, sub) => {
    if (!acc[sub.zone_id]) acc[sub.zone_id] = [];
    acc[sub.zone_id].push(sub);
    return acc;
  }, {} as Record<string, typeof allSubmissions>);

  const updates: Array<{ id: string; rhythmScore: number; viewScore: number; shadowScore: number; medianTime: number; delta: number }> = [];

  // Process each zone
  for (const [zoneId, submissions] of Object.entries(byZone)) {
    // Filter out manual submissions for median calculation
    const regularSubmissions = submissions.filter(s => s.is_manual !== true);
    
    if (regularSubmissions.length === 0) continue;

    // Get zone times
    const zoneTimes = regularSubmissions.map(s => s.zone_time_minutes).filter(t => t != null);
    
    if (zoneTimes.length === 0) continue;

    // Calculate median
    const medianTime = calculateMedian(zoneTimes);

    // Calculate rhythm score for each submission
    for (const sub of submissions) {
      const isManual = sub.is_manual === true;
      const zoneTime = sub.zone_time_minutes || 0;
      const viewScore = sub.view_score || 0;
      
      if (isManual) {
        // Manual entries get rhythm_score = 0
        const shadowScore = 0 + viewScore;
        updates.push({
          id: sub.id,
          rhythmScore: 0,
          viewScore,
          shadowScore,
          medianTime,
          delta: 0
        });
      } else {
        const rhythmScore = calculateRhythmScore(zoneTime, medianTime);
        const delta = Math.abs(zoneTime - medianTime);
        const shadowScore = rhythmScore + viewScore;
        
        updates.push({
          id: sub.id,
          rhythmScore,
          viewScore,
          shadowScore,
          medianTime,
          delta
        });
      }
    }
  }

  // Apply updates
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('rally_zone_submissions')
      .update({
        rhythm_score: Math.round(update.rhythmScore * 10) / 10,
        shadow_score: Math.round(update.shadowScore * 10) / 10
      })
      .eq('id', update.id);

    if (updateError) {
      console.error(`Failed ${update.id}:`, updateError);
    }
  }

  console.log(`✅ Recalculated ${updates.length} rhythm scores`);
}

recalculateAllRhythmScores().catch(console.error);
