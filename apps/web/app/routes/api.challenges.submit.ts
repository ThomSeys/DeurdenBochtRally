import type { ActionFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { getUserId } from '~/lib/session.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Check authentication
    const userId = await getUserId(request);
    if (!userId) {
      console.log('❌ No userId in session');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ UserId from session:', userId);

    // Verify participant exists (userId IS the participant id)
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (participantError || !participant) {
      console.error('❌ Participant not found:', participantError);
      return Response.json({ error: 'Participant not found' }, { status: 404 });
    }

    console.log('✅ Found participant:', participant.id);

    // Parse request
    const formData = await request.formData();
    const zoneId = formData.get('zoneId') as string;
    const locationKey = formData.get('locationKey') as string;
    const challengeType = formData.get('challengeType') as string;
    const textAnswer = formData.get('textAnswer') as string | null;
    const photoUrl = formData.get('photoUrl') as string | null;
    const correctAnswer = formData.get('correctAnswer') as string | null;
    const challengePoints = parseInt(formData.get('points') as string) || 0;

    // Validate required fields
    if (!zoneId || !locationKey || !challengeType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate challenge type
    if (!['photo', 'text', 'multiple_choice', 'number'].includes(challengeType)) {
      return Response.json({ error: 'Invalid challenge type' }, { status: 400 });
    }

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('route_challenge_submissions')
      .select('id')
      .eq('participant_id', participant.id)
      .eq('zone_id', zoneId)
      .eq('location_key', locationKey)
      .single();

    if (existing) {
      return Response.json({ error: 'Challenge already submitted' }, { status: 409 });
    }

    // Auto-validate if we have correct answer
    let isCorrect: boolean | null = null;
    let isValidated = false;
    let pointsAwarded = 0;

    if (correctAnswer && textAnswer) {
      // Normalize answers for comparison (trim, lowercase)
      const normalizedAnswer = textAnswer.trim().toLowerCase();
      const normalizedCorrect = correctAnswer.trim().toLowerCase();
      
      isCorrect = normalizedAnswer === normalizedCorrect;
      isValidated = true;
      pointsAwarded = isCorrect ? challengePoints : 0;
    }

    // Insert submission
    console.log('💾 Inserting submission:', { participant_id: participant.id, zone_id: zoneId, location_key: locationKey });
    
    const { data: submission, error: insertError } = await supabaseAdmin
      .from('route_challenge_submissions')
      .insert({
        participant_id: participant.id,
        zone_id: zoneId,
        location_key: locationKey,
        challenge_type: challengeType,
        text_answer: textAnswer,
        photo_url: photoUrl,
        is_correct: isCorrect,
        is_validated: isValidated,
        points_awarded: pointsAwarded,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return Response.json({ error: 'Failed to submit challenge', details: insertError.message }, { status: 500 });
    }

    console.log('✅ Submission saved:', submission.id);

    // Send push notification to admins if challenge needs manual validation
    if (!isValidated) {
      try {
        const { sendTargetedPushNotification } = await import('~/lib/push-notifications-enhanced.server');
        
        // Get all admin participant IDs
        const { data: admins } = await supabaseAdmin
          .from('participants')
          .select('id')
          .eq('is_admin', true);
        
        const adminIds = admins?.map(a => a.id) || [];
        
        if (adminIds.length > 0) {
          console.log('📢 Sending push notification to admins about challenge submission:', { count: adminIds.length });
          
          // Get challenge type label
          const challengeTypeLabels: Record<string, string> = {
            photo: '📸 Foto Opdracht',
            text: '📝 Tekst Vraag',
            multiple_choice: '❓ Multiple Choice',
            number: '🔢 Getal',
          };
          
          const typeLabel = challengeTypeLabels[challengeType] || challengeType;
          
          await sendTargetedPushNotification(
            { user_ids: adminIds },
            {
              title: '📋 Nieuwe Challenge Inzending',
              body: `${participant.first_name} ${participant.last_name} heeft een ${typeLabel} ingediend`,
              icon: '/icon-192.png',
              badge: '/icon-96.png',
              tag: 'challenge_submission',
              requireInteraction: false,
              data: {
                type: 'challenge_submission',
                submissionId: submission.id,
                participantId: participant.id,
                challengeType: challengeType,
                link: '/admin/challenges?filter=pending',
              },
            },
            {
              title: '📋 Nieuwe Challenge Inzending',
              body: `${participant.first_name} ${participant.last_name} heeft een ${typeLabel} ingediend`,
              eventType: 'challenge_submission',
              targetType: 'targeted',
              targetCriteria: { user_ids: adminIds },
              eventData: {
                submissionId: submission.id,
                participantId: participant.id,
                participantName: `${participant.first_name} ${participant.last_name}`,
                challengeType: challengeType,
                needsValidation: true,
                link: '/admin/challenges?filter=pending',
              },
            }
          );
        } else {
          console.log('⚠️ No admin users found to notify');
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send push notification to admins:', notificationError);
        // Don't fail the submission if notification fails
      }
    }

    return Response.json({
      success: true,
      submission: {
        id: submission.id,
        isValidated,
        isCorrect,
        pointsAwarded,
        needsManualValidation: !isValidated
      }
    });

  } catch (error) {
    console.error('Challenge submission error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
