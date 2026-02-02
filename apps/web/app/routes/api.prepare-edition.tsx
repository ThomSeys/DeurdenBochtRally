import type { ActionFunctionArgs } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('api-call', 'Prepare edition API called');

  try {
    const body = await request.json();
    const { year, date, regOpen, regClose, confirmationCode } = body;

    // Require confirmation code
    if (confirmationCode !== 'PREPARE-NEW-EDITION') {
      return Response.json({ 
        error: 'Invalid confirmation code' 
      }, { status: 400 });
    }

    // Validate inputs
    if (!year || !date || !regOpen || !regClose) {
      return Response.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const results = {
      edition: null as any,
      deletedParticipants: 0,
      deletedSubmissions: 0,
      deletedZoneSubmissions: 0,
      deletedAchievements: 0,
      deletedCheckIns: 0,
      deletedDocuments: 0,
      preservedAdmins: [] as any[],
    };

    // Step 1: Get admin participants
    const { data: adminParticipants } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, email')
      .eq('is_admin', true);

    const adminIds = adminParticipants?.map(p => p.id) || [];
    results.preservedAdmins = adminParticipants || [];

    // Step 2: Delete non-admin data
    
    // Achievements
    const { count: achievementsCount } = await supabaseAdmin
      .from('participant_achievements')
      .delete()
      .not('participant_id', 'in', `(${adminIds.join(',')})`);
    results.deletedAchievements = achievementsCount || 0;

    // Zone submissions
    const { count: zoneSubCount } = await supabaseAdmin
      .from('rally_zone_submissions')
      .delete()
      .not('participant_id', 'in', `(${adminIds.join(',')})`);
    results.deletedZoneSubmissions = zoneSubCount || 0;

    // Rally submissions
    const { count: rallySubCount } = await supabaseAdmin
      .from('rally_submissions')
      .delete()
      .not('participant_id', 'in', `(${adminIds.join(',')})`);
    results.deletedSubmissions = rallySubCount || 0;

    // Check-ins - commented out as table doesn't exist in schema
    // const { count: checkinsCount } = await supabaseAdmin
    //   .from('participant_check_ins')
    //   .delete()
    //   .not('participant_id', 'in', `(${adminIds.join(',')})`);
    results.deletedCheckIns = 0; // checkinsCount || 0;

    // Participants
    const { count: participantsCount } = await supabaseAdmin
      .from('participants')
      .delete()
      .eq('is_admin', false);
    results.deletedParticipants = participantsCount || 0;

    // Step 3: Reset admin data
    for (const adminId of adminIds) {
      await supabaseAdmin.from('rally_submissions').delete().eq('participant_id', adminId);
      await supabaseAdmin.from('rally_zone_submissions').delete().eq('participant_id', adminId);
      await supabaseAdmin.from('participant_achievements').delete().eq('participant_id', adminId);
      // await supabaseAdmin.from('participant_check_ins').delete().eq('participant_id', adminId);
      
      await supabaseAdmin
        .from('participants')
        .update({
          checked_in: false,
          checked_in_at: null,
          total_achievement_points: 0,
          qr_code_url: null,
        })
        .eq('id', adminId);
    }

    // Step 4: Delete documents
    const { count: docsCount } = await supabaseAdmin
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    results.deletedDocuments = docsCount || 0;

    // Step 5: Create new edition in Sanity
    const title = `Deur Den Bocht ${year}`;
    const newEdition = await sanityClient.create({
      _type: 'edition',
      title,
      year: parseInt(year),
      date,
      registrationOpenDate: regOpen,
      registrationCloseDate: regClose,
      isActive: true,
      description: `Deur Den Bocht ${year} - Een epische motorrit door de mooiste bochten van België en Noord-Frankrijk`,
    });

    results.edition = newEdition;

    // Disable all other editions
    const allEditions = await sanityClient.fetch(`*[_type == "edition"]{_id, title}`);
    for (const edition of allEditions) {
      if (edition._id !== newEdition._id) {
        await sanityClient.patch(edition._id).set({ isActive: false }).commit();
      }
    }

    console.info('[prepare-edition] Successfully prepared new edition:', results);

    return Response.json({
      success: true,
      message: 'New edition prepared successfully',
      results,
    });

  } catch (error) {
    console.error('[prepare-edition] Error:', error);
    return Response.json({ 
      error: 'Failed to prepare new edition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
