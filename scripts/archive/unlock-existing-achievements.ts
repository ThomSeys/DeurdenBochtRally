#!/usr/bin/env node
/**
 * Retroactively unlock achievements for all existing participants
 * Run this after setting up achievements to credit existing rally submissions
 */

import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
import { dirname, join } from 'path';

dotenv.config({ path: join(__dirname, '../apps/web/.env.local') });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Copy the checkAndUnlockAchievements logic here
async function checkAndUnlockAchievements(participantId: string) {
  console.log(`\nChecking achievements for participant: ${participantId}`);

  // Get participant data
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (!participant) {
    console.log('  ❌ Participant not found');
    return [];
  }

  console.log(`  👤 ${participant.first_name} ${participant.last_name}`);

  // Get rally submission
  const { data: submission } = await supabase
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', participantId)
    .single();

  // Get rally zone submissions
  const { data: zoneSubmissions } = await supabase
    .from('rally_zone_submissions')
    .select('*')
    .eq('participant_id', participantId);

  // Get photos
  const { data: photos } = await supabase
    .from('participant_photos')
    .select('*')
    .eq('participant_id', participantId);

  // Calculate current stats
  const zonesCompleted = submission
    ? Object.keys(submission).filter(k => k.startsWith('rz') && (submission as any)[k]).length
    : 0;

  console.log(`  📊 Stats: ${zonesCompleted} zones, ${photos?.length || 0} photos, checked_in: ${participant.checked_in}`);

  const allCorrect = zoneSubmissions?.every(z => z.is_correct) && zoneSubmissions.length === 8;
  const photosUploaded = photos?.length || 0;
  const totalPhotoLikes = photos?.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0) || 0;

  // Get all achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*');

  // Get already unlocked achievements
  const { data: unlocked } = await supabase
    .from('participant_achievements')
    .select('achievement_id')
    .eq('participant_id', participantId);

  const unlockedIds = new Set(unlocked?.map((u: any) => u.achievement_id) || []);

  // Check each achievement
  const newUnlocks: any[] = [];

  for (const achievement of achievements || []) {
    if (unlockedIds.has(achievement.id)) {
      console.log(`  ✓ Already unlocked: ${achievement.name}`);
      continue;
    }

    const criteria = achievement.criteria as any;
    let shouldUnlock = false;

    // Check criteria
    if (criteria.zones_completed && zonesCompleted >= criteria.zones_completed) {
      shouldUnlock = true;
    }

    if (criteria.all_correct && allCorrect) {
      shouldUnlock = true;
    }

    if (criteria.checkin_before && participant.checked_in_at) {
      const checkInTime = new Date(participant.checked_in_at).getHours() * 60 + new Date(participant.checked_in_at).getMinutes();
      const [hours, minutes] = criteria.checkin_before.split(':').map(Number);
      const targetTime = hours * 60 + minutes;
      if (checkInTime < targetTime) {
        shouldUnlock = true;
      }
    }

    if (criteria.weather_bonus && submission?.weather_bonus) {
      shouldUnlock = true;
    }

    if (criteria.distance_over && submission?.total_distance && submission.total_distance > criteria.distance_over) {
      shouldUnlock = true;
    }

    if (criteria.photos_uploaded && photosUploaded >= criteria.photos_uploaded) {
      shouldUnlock = true;
    }

    if (criteria.photo_likes && totalPhotoLikes >= criteria.photo_likes) {
      shouldUnlock = true;
    }

    // Unlock achievement
    if (shouldUnlock) {
      const { error } = await supabase.from('participant_achievements').insert({
        participant_id: participantId,
        achievement_id: achievement.id,
      });

      if (error) {
        console.log(`  ❌ Error unlocking ${achievement.name}: ${error.message}`);
      } else {
        console.log(`  🎉 Unlocked: ${achievement.name} (+${achievement.points} pts)`);
        newUnlocks.push(achievement);
      }
    }
  }

  // Update total achievement points
  if (newUnlocks.length > 0) {
    const totalNewPoints = newUnlocks.reduce((sum, a) => sum + (a.points || 0), 0);
    await supabase
      .from('participants')
      .update({
        total_achievement_points: (participant.total_achievement_points || 0) + totalNewPoints,
      })
      .eq('id', participantId);

    console.log(`  💯 Total points updated: +${totalNewPoints} → ${(participant.total_achievement_points || 0) + totalNewPoints}`);
  }

  return newUnlocks;
}

async function main() {
  console.log('🏆 Retroactively Checking Achievements for All Participants\n');
  console.log('=' .repeat(60));

  // Get all participants with rally submissions
  const { data: submissions, error } = await supabase
    .from('rally_submissions')
    .select('participant_id');

  if (error) {
    console.error('Error fetching submissions:', error);
    process.exit(1);
  }

  if (!submissions || submissions.length === 0) {
    console.log('\n❌ No rally submissions found');
    process.exit(0);
  }

  const participantIds = [...new Set(submissions.map((s: any) => s.participant_id))];
  console.log(`\n📋 Found ${participantIds.length} participants with submissions\n`);

  let totalUnlocked = 0;

  for (const participantId of participantIds) {
    const newUnlocks = await checkAndUnlockAchievements(participantId);
    totalUnlocked += newUnlocks.length;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Complete! ${totalUnlocked} total achievements unlocked\n`);
}

main().catch(console.error);
