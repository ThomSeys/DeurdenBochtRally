import type { LoaderFunctionArgs } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const [
    totalParticipantsRes,
    paidParticipantsRes,
    checkedInParticipantsRes,
    pendingScansRes,
    fallbackReviewRes,
    pendingPhotosRes,
    pendingStoriesRes,
    totalSOSRes,
    emergencySOSRes,
    totalChallengesRes,
    pendingChallengesRes,
    totalStoriesRes,
    totalAchievementsRes,
    totalAlbumsRes,
    paymentsRes,
    buddyGroupsRes,
  ] = await Promise.all([
    supabaseAdmin.from('participants').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('participants').select('*', { count: 'exact', head: true }).eq('payment_status', 'completed'),
    supabaseAdmin.from('participants').select('*', { count: 'exact', head: true }).eq('checked_in', true),
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('requires_manual_validation', true)
      .is('manually_validated_at', null),
    supabaseAdmin
      .from('rally_zone_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('is_fallback', true)
      .is('is_validated', null),
    supabaseAdmin
      .from('participant_photos')
      .select('*', { count: 'exact', head: true })
      .or('is_approved.is.null,is_approved.eq.false'),
    supabaseAdmin
      .from('ride_stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabaseAdmin.from('emergency_sos').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('emergency_sos').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
    supabaseAdmin.from('route_challenge_submissions').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('route_challenge_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_validated', false),
    supabaseAdmin.from('ride_stories').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('achievements').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('photo_albums').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('participants').select('amount_paid').eq('payment_status', 'completed'),
    supabaseAdmin.from('riding_buddies').select('buddy_id').not('buddy_id', 'is', null),
  ]);

  const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
  const activeBuddyGroupsCount = new Set(buddyGroupsRes.data?.map(b => b.buddy_id) || []).size;

  const [rallyZones, eventMarkers] = await Promise.all([
    sanityClient.fetch(`
      *[_type == "rallyZone"] | order(order asc) {
        _id,
        is_open
      }
    `),
    sanityClient.fetch(`
      *[_type == "eventMarker"] {
        _id,
        is_visible
      }
    `),
  ]);

  const openZonesCount = rallyZones?.filter((z: any) => z.is_open).length || 0;
  const totalZonesCount = rallyZones?.length || 0;
  const activeMarkersCount = eventMarkers?.filter((m: any) => m.is_visible).length || 0;
  const totalMarkersCount = eventMarkers?.length || 0;

  return Response.json({
    urgent: {
      emergencySOSCount: emergencySOSRes.count || 0,
      pendingChallengesCount: pendingChallengesRes.count || 0,
    },
    stats: {
      totalParticipants: totalParticipantsRes.count || 0,
      paidParticipants: paidParticipantsRes.count || 0,
      checkedInParticipants: checkedInParticipantsRes.count || 0,
    },
    teasers: {
      pendingScansCount: pendingScansRes.count || 0,
      fallbackReviewCount: fallbackReviewRes.count || 0,
      pendingPhotosCount: pendingPhotosRes.count || 0,
      pendingStoriesCount: pendingStoriesRes.count || 0,
      activeBuddyGroupsCount,
      totalAchievementsCount: totalAchievementsRes.count || 0,
      totalAlbumsCount: totalAlbumsRes.count || 0,
      totalSOSCount: totalSOSRes.count || 0,
      totalChallengesCount: totalChallengesRes.count || 0,
      totalStoriesCount: totalStoriesRes.count || 0,
      totalRevenue,
      openZonesCount,
      totalZonesCount,
      activeMarkersCount,
      totalMarkersCount,
    },
  });
}
