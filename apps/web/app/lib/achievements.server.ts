import { supabaseAdmin } from './supabase.server';

interface AchievementCriteria {
  zones_completed?: number;
  all_correct?: boolean;
  checkin_before?: string;
  weather_bonus?: boolean;
  distance_over?: number;
  photos_uploaded?: number;
  photo_likes?: number;
  editions_count?: number;
}

export async function checkAndUnlockAchievements(participantId: string) {
  // Get participant data
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (!participant) return;

  // Get rally submission
  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', participantId)
    .single();

  // Get rally zone submissions
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('*')
    .eq('participant_id', participantId);

  // Get photos
  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select('*')
    .eq('participant_id', participantId);

  // Calculate current stats
  const zonesCompleted = submission
    ? Object.keys(submission).filter(k => k.startsWith('rz') && (submission as any)[k]).length
    : 0;

  const allCorrect = zoneSubmissions?.every(z => z.is_correct) && zoneSubmissions.length === 8;
  const photosUploaded = photos?.length || 0;
  const totalPhotoLikes = photos?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;

  // Get all achievements
  const { data: achievements } = await supabaseAdmin
    .from('achievements')
    .select('*');

  // Get already unlocked achievements
  const { data: unlocked } = await supabaseAdmin
    .from('participant_achievements')
    .select('achievement_id')
    .eq('participant_id', participantId);

  const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

  // Check each achievement
  const newUnlocks: number[] = [];

  for (const achievement of achievements || []) {
    if (unlockedIds.has(achievement.id)) continue;

    const criteria = achievement.criteria as AchievementCriteria;
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
      await supabaseAdmin.from('participant_achievements').insert({
        participant_id: participantId,
        achievement_id: achievement.id,
      });

      newUnlocks.push(achievement.id);

      // Update total achievement points
      await supabaseAdmin
        .from('participants')
        .update({
          total_achievement_points: (participant.total_achievement_points || 0) + (achievement.points || 0),
        })
        .eq('id', participantId);
    }
  }

  return newUnlocks;
}

export async function getParticipantAchievements(participantId: string) {
  const { data } = await supabaseAdmin
    .from('participant_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('participant_id', participantId);

  return data || [];
}

export async function getAchievementLeaderboard() {
  const { data } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, total_achievement_points')
    .order('total_achievement_points', { ascending: false })
    .limit(10);

  return data || [];
}
