/**
 * Achievement Auto-Unlock System
 * Automatically checks and unlocks achievements when triggered
 */

import { supabaseAdmin } from '~/lib/supabase.server';
import { notifyAchievementUnlocked } from '~/lib/achievement-notifications.server';

interface Achievement {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  criteria: {
    type: 'zones' | 'photos' | 'likes' | 'stories' | 'checkin_time' | 'combo' | 'hazepads';
    value?: number;
    time_before?: string; // HH:MM format
    time_after?: string;  // HH:MM format
    conditions?: Array<{
      type: 'zones' | 'photos' | 'likes' | 'stories' | 'hazepads';
      value: number;
    }>;
  } | null;
}

/**
 * Get participant statistics for achievement checking
 */
async function getParticipantStats(participantId: string) {
  const { data: checkins } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id, checked_in_at')
    .eq('participant_id', participantId);

  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select('id, like_count')
    .eq('participant_id', participantId);

  const { data: stories } = await supabaseAdmin
    .from('ride_stories')
    .select('id')
    .eq('participant_id', participantId)
    .eq('is_approved', true);

  const { data: hazepadSubs } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id, took_skip_route')
    .eq('participant_id', participantId)
    .eq('took_skip_route', true);

  return {
    zonesCompleted: checkins?.length || 0,
    photosUploaded: photos?.length || 0,
    totalLikes: photos?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0,
    storiesPublished: stories?.length || 0,
    checkins: checkins || [],
    hazepadsSelected: hazepadSubs ? new Set(hazepadSubs.map((s: any) => s.zone_id).filter(Boolean)).size : 0,
  };
}

/**
 * Check if achievement criteria is met
 * Uses dynamic criteria from database for full flexibility
 */
async function checkAchievementCriteria(
  participantId: string, 
  achievement: Achievement
): Promise<boolean> {
  // If no criteria defined, achievement cannot be earned
  if (!achievement.criteria) {
    console.warn('[achievements] no criteria defined for', achievement.name);
    return false;
  }

  const stats = await getParticipantStats(participantId);
  const { criteria } = achievement;

  // Normalize criteria type to support a few possible variants from DB
  const rawType = (criteria.type || '') as string;
  const lowerType = rawType.toString().toLowerCase();
  const normType = ((): string => {
    if (lowerType === 'hurry_hare' || lowerType === 'hurryhare' || lowerType.includes('hare')) return 'hazepads';
    return lowerType;
  })();

  // Debug log to aid diagnosis when criteria involve hazepads
  if (normType === 'hazepads') {
    console.info('[achievements] evaluating hazepads', {
      achievement: achievement.name,
      required: criteria.value,
      hazepadsSelected: (stats as any).hazepadsSelected,
    });
  }

  // Check based on criteria type
  switch (normType) {
    case 'zones':
      return stats.zonesCompleted >= (criteria.value || 0);
    
    case 'photos':
      return stats.photosUploaded >= (criteria.value || 0);
    
    case 'likes':
      return stats.totalLikes >= (criteria.value || 0);
    
    case 'stories':
      return stats.storiesPublished >= (criteria.value || 0);

    case 'hazepads':
      return (stats as any).hazepadsSelected >= (criteria.value || 0);
    
    case 'checkin_time':
      // Check if any check-in was within time window
      if (!stats.checkins.length) return false;
      
      return stats.checkins.some(checkin => {
        const checkinDate = new Date(checkin.checked_in_at ?? "");
        const hour = checkinDate.getHours();
        const minute = checkinDate.getMinutes();
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        if (criteria.time_before) {
          return timeString < criteria.time_before;
        }
        if (criteria.time_after) {
          return timeString > criteria.time_after;
        }
        return false;
      });
    
    case 'combo':
      // Multiple conditions must all be met
      if (!criteria.conditions || criteria.conditions.length === 0) return false;
      // Use hazepads count from stats if present
      const hazepadsCount = (stats as any).hazepadsSelected || 0;
      return criteria.conditions.every(condition => {
        const cTypeRaw = (condition.type || '').toString().toLowerCase();
        const cType = (cTypeRaw === 'hurry_hare' || cTypeRaw === 'hurryhare' || cTypeRaw.includes('hare')) ? 'hazepads' : cTypeRaw;
        switch (cType) {
          case 'zones':
            return stats.zonesCompleted >= condition.value;
          case 'photos':
            return stats.photosUploaded >= condition.value;
          case 'likes':
            return stats.totalLikes >= condition.value;
          case 'stories':
            return stats.storiesPublished >= condition.value;
          case 'hazepads':
            return hazepadsCount >= condition.value;
          default:
            return false;
        }
      });
    
    default:
      console.warn('[achievements] unknown criteria type', criteria.type);
      return false;
  }
}

export async function checkAndUnlockAchievements(participantId: string): Promise<number> {
  console.info('[achievements] checking achievements for participant', { participantId });

  // Get all achievements
  const { data: achievements } = await supabaseAdmin
    .from('achievements')
    .select('*')
    .order('points', { ascending: true });

  if (!achievements || achievements.length === 0) {
    console.info('[achievements] no achievements found');
    return 0;
  }

  // Get already unlocked achievements
  const { data: unlocked } = await supabaseAdmin
    .from('participant_achievements')
    .select('achievement_id')
    .eq('participant_id', participantId);

  const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);
  let newUnlockCount = 0;

  for (const achievement of achievements) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) {
      continue;
    }

    // Ensure points is a number (not null) for type compatibility
    const achievementForCheck: Achievement = {
      ...achievement,
      points: achievement.points ?? 0,
      // If criteria is stored as JSON, ensure correct typing
      criteria: achievement.criteria as Achievement['criteria'],
    };

    // Check if criteria is met
    const earned = await checkAchievementCriteria(participantId, achievementForCheck);

    if (earned) {
      // Unlock achievement
      const { error } = await supabaseAdmin
        .from('participant_achievements')
        .insert({
          participant_id: participantId,
          achievement_id: achievement.id,
        });

      if (error) {
        console.error('[achievements] error unlocking achievement', { 
          participantId, 
          achievementId: achievement.id,
          error: error.message 
        });
      } else {
        console.info('[achievements] achievement unlocked', { 
          participantId, 
          achievement: achievement.title,
          points: achievement.points 
        });
        newUnlockCount++;

        // Send push notification (async, don't block)
        notifyAchievementUnlocked(participantId, achievement.title, achievement.icon)
          .catch(err => console.error('[achievements] notification error', err));
      }
    }
  }

  console.info('[achievements] check complete', { 
    participantId, 
    newUnlocks: newUnlockCount 
  });

  return newUnlockCount;
}
