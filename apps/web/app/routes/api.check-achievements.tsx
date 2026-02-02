/**
 * Internal API for checking achievements after events
 * Called automatically after check-ins, photo uploads, etc.
 */

import type { ActionFunctionArgs } from 'react-router';
import { checkAndUnlockAchievements } from '~/lib/achievement-checker.server';
import { notifyBuddyAchievementUnlocked } from '~/lib/achievement-notifications.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const participantId = formData.get('participantId') as string;

    if (!participantId) {
      return new Response(JSON.stringify({ error: 'Missing participantId' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'check-participant': {
        // Check regular participant achievements
        const unlockCount = await checkAndUnlockAchievements(participantId);
        return new Response(JSON.stringify({ 
          success: true, 
          unlockCount 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'check-buddy': {
        // Check buddy achievements via database function
        const { error } = await supabaseAdmin.rpc('check_buddy_achievements', {
          p_participant_id: participantId
        });

        if (error) {
          console.error('[api.check-achievements] buddy check error', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Get newly unlocked buddy achievements to send notifications
        const { data: recentUnlocks } = await supabaseAdmin
          .from('buddy_group_achievements')
          .select(`
            *,
            achievement:buddy_achievements(*),
            members:buddy_group_achievement_members(participant_id)
          `)
          .eq('primary_participant_id', participantId)
          .eq('is_unlocked', true)
          .gte('unlocked_at', new Date(Date.now() - 60000).toISOString()); // Last minute

        // Send notifications for recent unlocks
        if (recentUnlocks && recentUnlocks.length > 0) {
          for (const unlock of recentUnlocks) {
            const memberIds = unlock.members?.map((m: any) => m.participant_id) || [];
            if (memberIds.length > 0 && unlock.achievement) {
              await notifyBuddyAchievementUnlocked(
                memberIds,
                unlock.achievement.name,
                unlock.achievement.icon
              );
            }
          }
        }

        return new Response(JSON.stringify({ 
          success: true,
          buddyUnlockCount: recentUnlocks?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'check-all': {
        // Check both participant and buddy achievements
        const participantUnlocks = await checkAndUnlockAchievements(participantId);
        
        await supabaseAdmin.rpc('check_buddy_achievements', {
          p_participant_id: participantId
        });

        return new Response(JSON.stringify({ 
          success: true,
          participantUnlocks
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error: any) {
    console.error('[api.check-achievements] error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
