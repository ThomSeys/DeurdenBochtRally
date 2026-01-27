/**
 * Reset Database for New Edition
 * Cleans up old data while preserving admins and structure
 */

import { supabase } from './00-config';
import * as readline from 'readline';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function resetForNewEdition() {
  console.log('⚠️  WARNING: This will reset data for a new edition!\n');
  console.log('The following will be deleted:');
  console.log('  - All non-admin participants');
  console.log('  - All zone check-ins');
  console.log('  - All photos and stories');
  console.log('  - All achievements (but keeping definitions)');
  console.log('\nAdmin accounts will be preserved.\n');

  const confirmed = await confirm('Type "yes" to confirm: ');

  if (!confirmed) {
    console.log('\n❌ Cancelled\n');
    return;
  }

  console.log('\n🗑️  Resetting database...\n');

  // Get admin IDs to preserve
  const { data: admins } = await supabase
    .from('participants')
    .select('id, email')
    .eq('is_admin', true);

  const adminIds = admins?.map((a) => a.id) || [];
  console.log(`📝 Preserving ${adminIds.length} admin account(s)\n`);

  // Delete data in correct order (respecting foreign keys)
  console.log('Deleting participant achievements...');
  await supabase.from('participant_achievements').delete().not('participant_id', 'in', `(${adminIds.join(',')})`);

  console.log('Deleting zone check-ins...');
  await supabase.from('rally_zone_checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Deleting photo likes...');
  await supabase.from('photo_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Deleting photos...');
  await supabase.from('participant_photos').delete().not('participant_id', 'in', `(${adminIds.join(',')})`);

  console.log('Deleting story likes...');
  await supabase.from('ride_story_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Deleting ride stories...');
  await supabase.from('ride_stories').delete().not('participant_id', 'in', `(${adminIds.join(',')})`);

  console.log('Deleting emergency SOS...');
  await supabase.from('emergency_sos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Deleting push subscriptions...');
  await supabase.from('push_subscriptions').delete().not('participant_id', 'in', `(${adminIds.join(',')})`);

  console.log('Deleting non-admin participants...');
  await supabase.from('participants').delete().eq('is_admin', false);

  // Reset admin stats
  console.log('Resetting admin stats...');
  await supabase
    .from('participants')
    .update({
      checked_in: false,
      checked_in_at: null,
      total_achievement_points: 0,
      status: 'registered',
    })
    .eq('is_admin', true);

  console.log('\n✅ Database reset complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Update edition in Sanity');
  console.log('   2. Reset Sanity data if needed');
  console.log('   3. Test registration flow\n');
}

resetForNewEdition().catch(console.error);
