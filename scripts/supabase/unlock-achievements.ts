/**
 * Check and Unlock Achievements
 * Retroactively checks all participants and unlocks achievements they've earned
 */

import { supabase } from './00-config';

interface Achievement {
  id: number;
  name: string;
  title: string;
  criteria: any;
}

async function checkAchievementCriteria(participantId: string, achievement: Achievement): Promise<boolean> {
  const { data: participant } = await supabase
    .from('participants')
    .select('checked_in')
    .eq('id', participantId)
    .single();

  const { data: checkins } = await supabase
    .from('rally_zone_checkins')
    .select('zone_id')
    .eq('participant_id', participantId);

  const { data: photos } = await supabase
    .from('participant_photos')
    .select('id, like_count')
    .eq('participant_id', participantId);

  const { data: stories } = await supabase
    .from('ride_stories')
    .select('id')
    .eq('participant_id', participantId)
    .eq('is_approved', true);

  const zonesCompleted = checkins?.length || 0;
  const photosUploaded = photos?.length || 0;
  const totalLikes = photos?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0;
  const storiesPublished = stories?.length || 0;

  // Check criteria based on achievement name
  switch (achievement.name) {
    case 'first_checkin':
      return zonesCompleted >= 1;
    
    case 'half_way':
      return zonesCompleted >= 2;
    
    case 'zone_master':
    case 'explorer':
      return zonesCompleted >= 4;
    
    case 'early_bird':
      return participant?.checked_in === true;
    
    case 'photo_star':
      return photosUploaded >= 10;
    
    case 'photographer':
      return photosUploaded >= 25;
    
    case 'social_butterfly':
      return totalLikes >= 50;
    
    case 'story_teller':
      return storiesPublished >= 1;
    
    default:
      return false;
  }
}

async function unlockAchievementsForParticipant(participantId: string, participantName: string) {
  console.log(`\n👤 Checking ${participantName}...`);

  // Get all achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .order('points');

  if (!achievements) return;

  // Get already unlocked achievements
  const { data: unlocked } = await supabase
    .from('participant_achievements')
    .select('achievement_id')
    .eq('participant_id', participantId);

  const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

  let newUnlocks = 0;

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) {
      continue; // Already unlocked
    }

    const earned = await checkAchievementCriteria(participantId, achievement);

    if (earned) {
      const { error } = await supabase
        .from('participant_achievements')
        .insert({
          participant_id: participantId,
          achievement_id: achievement.id,
        });

      if (!error) {
        console.log(`   🏆 Unlocked: ${achievement.title} (+${achievement.points} pts)`);
        newUnlocks++;
      }
    }
  }

  if (newUnlocks === 0) {
    console.log(`   ✓ No new achievements`);
  }

  // Update total points
  await supabase.rpc('update_participant_shadow_scores', {
    p_participant_id: participantId,
  });
}

async function unlockAchievements() {
  console.log('🏆 Checking and unlocking achievements for all participants...\n');

  // Get all participants
  const { data: participants } = await supabase
    .from('participants')
    .select('id, first_name, last_name')
    .order('created_at');

  if (!participants || participants.length === 0) {
    console.log('No participants found\n');
    return;
  }

  console.log(`Found ${participants.length} participant(s)\n`);

  for (const participant of participants) {
    await unlockAchievementsForParticipant(
      participant.id,
      `${participant.first_name} ${participant.last_name}`
    );
  }

  console.log('\n✅ Achievement check complete!\n');
}

unlockAchievements().catch(console.error);
