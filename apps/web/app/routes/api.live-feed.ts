import type { LoaderFunctionArgs } from 'react-router';
import { getUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get buddy IDs for filtering
    const { data: buddyLinks } = await supabaseAdmin
      .from('participant_buddies')
      .select('buddy_id')
      .eq('participant_id', userId)
      .eq('status', 'accepted');

    const buddyIds = (buddyLinks || []).map((b: any) => b.buddy_id).filter(Boolean);

    // Get zone names for mapping
    const rallyZones = await sanityClient.fetch(`
      *[_type == "rallyZone"] {
        _id,
        title
      }
    `);

    const zoneNameById = new Map((rallyZones || []).map((zone: any) => [zone._id, zone.title]));

    // Fetch live activity in parallel
    const [recentCheckIns, recentChallenges, recentPhotos] = await Promise.all([
      supabaseAdmin
        .from('rally_zone_checkins')
        .select('id, participant_id, zone_id, checked_in_at, participants(first_name, last_name, profile_photo_url)')
        .neq('participant_id', userId)
        .order('checked_in_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('route_challenge_submissions')
        .select('id, participant_id, zone_id, submitted_at, challenge_type, participants(first_name, last_name, profile_photo_url)')
        .neq('participant_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('participant_photos')
        .select('id, participant_id, image_url, uploaded_at, zone_id, participants(first_name, last_name, profile_photo_url)')
        .neq('participant_id', userId)
        .order('uploaded_at', { ascending: false })
        .limit(20)
    ]);

    const liveActivity = [
      ...(recentCheckIns.data || []).map((item: any) => ({
        id: `checkin-${item.id}`,
        type: 'checkin',
        timestamp: item.checked_in_at,
        participant_id: item.participant_id,
        participant: item.participants,
        zoneName: zoneNameById.get(item.zone_id) || 'Zone',
      })),
      ...(recentChallenges.data || []).map((item: any) => ({
        id: `challenge-${item.id}`,
        type: 'challenge',
        timestamp: item.submitted_at,
        participant_id: item.participant_id,
        participant: item.participants,
        zoneName: zoneNameById.get(item.zone_id) || 'Zone',
        challengeType: item.challenge_type,
      })),
      ...(recentPhotos.data || []).map((item: any) => ({
        id: `photo-${item.id}`,
        type: 'photo',
        timestamp: item.uploaded_at,
        participant_id: item.participant_id,
        participant: item.participants,
        zoneName: zoneNameById.get(item.zone_id) || 'Zone',
        photoUrl: item.image_url,
      })),
    ]
      .filter((item: any) => item.timestamp)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    return Response.json({
      liveActivity,
      buddyIds: [...buddyIds],
    });
  } catch (error) {
    console.error('[api.live-feed] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
