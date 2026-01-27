import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixTimestamps() {
  // Get all zone submissions
  const { data, error } = await supabase
    .from('rally_zone_submissions')
    .select('*')
    .order('participant_id', { ascending: true })
    .order('zone_id', { ascending: true })
    .order('checkpoint_number', { ascending: true });

  if (error) {
    console.error('Error fetching submissions:', error);
    return;
  }

  // Start time for the rally (same day, 8:00 AM)
  const rallyStart = new Date();
  rallyStart.setHours(8, 0, 0, 0);

  let currentTime = new Date(rallyStart);

  // Group by participant
  const byParticipant = data.reduce((acc, row) => {
    if (!acc[row.participant_id]) acc[row.participant_id] = [];
    acc[row.participant_id].push(row);
    return {};
  }, {} as Record<string, typeof data>);

  const updates = [];

  for (const row of data) {
    // Realistic zone times based on type:
    // Short zones (1 checkpoint): 20-30 minutes
    // Medium zones (2 checkpoints): 35-45 minutes
    // Long zones (3 checkpoints): 50-65 minutes
    
    let zoneTimeMins;
    const checkpointCount = row.total_checkpoints || 1;
    
    if (checkpointCount === 1) {
      // Short zone: 20-30 minutes
      zoneTimeMins = 20 + Math.floor(Math.random() * 11);
    } else if (checkpointCount === 2) {
      // Medium zone: 35-45 minutes
      zoneTimeMins = 35 + Math.floor(Math.random() * 11);
    } else {
      // Long zone: 50-65 minutes
      zoneTimeMins = 50 + Math.floor(Math.random() * 16);
    }

    const entryTime = new Date(currentTime);
    const answerTime = new Date(currentTime.getTime() + zoneTimeMins * 60 * 1000);
    
    // Add some variation (±5 minutes) around median for diversity
    const variation = Math.floor((Math.random() - 0.5) * 10 * 60 * 1000);
    answerTime.setTime(answerTime.getTime() + variation);

    updates.push({
      id: row.id,
      entry_timestamp: entryTime.toISOString(),
      answer_timestamp: answerTime.toISOString(),
      zone_time_minutes: Math.round((answerTime.getTime() - entryTime.getTime()) / 60000)
    });

    // Move to next zone (add transition time between zones: 5-10 minutes)
    currentTime = new Date(answerTime.getTime() + (5 + Math.random() * 5) * 60 * 1000);
  }

  // Apply updates
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('rally_zone_submissions')
      .update({
        entry_timestamp: update.entry_timestamp,
        answer_timestamp: update.answer_timestamp,
        zone_time_minutes: update.zone_time_minutes
      })
      .eq('id', update.id);

    if (updateError) {
      console.error(`Failed to update ${update.id}:`, updateError);
    }
  }

  console.log(`✅ Updated ${updates.length} timestamps`);
}

fixTimestamps().catch(console.error);
