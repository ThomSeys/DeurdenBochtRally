import { supabaseAdmin } from './app/lib/supabase.server';

async function testDatabaseData() {
  console.log('Testing database data...\n');

  // Test participants
  const { data: participants, error: pError } = await (supabaseAdmin as any)
    .from('participants')
    .select('id, name, email')
    .limit(5);
  
  console.log('Participants:', participants?.length || 0);
  if (pError) console.error('Participants error:', pError);
  if (participants && participants.length > 0) {
    console.log('Sample:', participants[0]);
  }
  console.log('');

  // Test checkpoints
  const { data: checkpoints, error: cError } = await (supabaseAdmin as any)
    .from('checkins')
    .select('id, participant_id, checkpoint_number')
    .limit(5);
  
  console.log('Checkpoints:', checkpoints?.length || 0);
  if (cError) console.error('Checkpoints error:', cError);
  if (checkpoints && checkpoints.length > 0) {
    console.log('Sample:', checkpoints[0]);
  }
  console.log('');

  // Test photos
  const { data: photos, error: phError } = await (supabaseAdmin as any)
    .from('rally_photo_submissions')
    .select('id, participant_id')
    .limit(5);
  
  console.log('Photos:', photos?.length || 0);
  if (phError) console.error('Photos error:', phError);
  if (photos && photos.length > 0) {
    console.log('Sample:', photos[0]);
  }
  console.log('');

  // Test stories
  const { data: stories, error: sError } = await (supabaseAdmin as any)
    .from('ride_stories')
    .select('id, title')
    .limit(5);
  
  console.log('Stories:', stories?.length || 0);
  if (sError) console.error('Stories error:', sError);
  if (stories && stories.length > 0) {
    console.log('Sample:', stories[0]);
  }
}

testDatabaseData().catch(console.error);
