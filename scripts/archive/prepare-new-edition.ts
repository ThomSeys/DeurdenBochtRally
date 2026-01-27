import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSanityClient } from '@sanity/client';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sanity = createSanityClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createNewEdition(editionData: {
  title: string;
  year: number;
  date: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
}) {
  console.log('\n📝 Creating new edition in Sanity...');
  
  const newEdition = await sanity.create({
    _type: 'edition',
    title: editionData.title,
    year: editionData.year,
    date: editionData.date,
    registrationOpenDate: editionData.registrationOpenDate,
    registrationCloseDate: editionData.registrationCloseDate,
    isActive: true,
    description: `Deur Den Bocht ${editionData.year} - Een epische motorrit door de mooiste bochten van België en Noord-Frankrijk`,
  });

  console.log(`✅ Created edition: ${newEdition._id} - ${editionData.title}`);

  // Set this edition as active and disable previous editions
  const allEditions = await sanity.fetch(`*[_type == "edition"]{_id, title}`);
  
  for (const edition of allEditions) {
    if (edition._id !== newEdition._id) {
      await sanity.patch(edition._id).set({ isActive: false }).commit();
      console.log(`   Disabled: ${edition.title}`);
    }
  }

  return newEdition;
}

async function cleanupSupabase() {
  console.log('\n🧹 Cleaning up Supabase database...');
  console.log('   Keeping admin users and their data...\n');

  // Step 1: Get all admin participant IDs
  const { data: adminParticipants, error: adminError } = await supabase
    .from('participants')
    .select('id, first_name, last_name, email')
    .eq('is_admin', true);

  if (adminError) {
    throw new Error(`Failed to fetch admin participants: ${adminError.message}`);
  }

  const adminIds = adminParticipants?.map(p => p.id) || [];
  
  console.log(`   Found ${adminIds.length} admin(s) to preserve:`);
  adminParticipants?.forEach(admin => {
    console.log(`   - ${admin.first_name} ${admin.last_name} (${admin.email})`);
  });

  // Step 2: Delete data for non-admin participants
  
  // Delete ride stories (non-admin)
  console.log('\n   Deleting ride stories (non-admin)...');
  const { error: storiesError, count: storiesCount } = await supabase
    .from('ride_stories')
    .delete()
    .not('participant_id', 'in', `(${adminIds.join(',')})`)
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${storiesCount || 0} ride stories`);

  // Delete participant achievements (non-admin)
  console.log('   Deleting achievements (non-admin)...');
  const { error: achievementsError, count: achievementsCount } = await supabase
    .from('participant_achievements')
    .delete()
    .not('participant_id', 'in', `(${adminIds.join(',')})`)
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${achievementsCount || 0} achievements`);

  // Delete rally zone submissions (non-admin)
  console.log('   Deleting rally zone submissions (non-admin)...');
  const { error: zoneSubError, count: zoneSubCount } = await supabase
    .from('rally_zone_submissions')
    .delete()
    .not('participant_id', 'in', `(${adminIds.join(',')})`)
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${zoneSubCount || 0} zone submissions`);

  // Delete rally submissions (non-admin)
  console.log('   Deleting rally submissions (non-admin)...');
  const { error: rallySubError, count: rallySubCount } = await supabase
    .from('rally_submissions')
    .delete()
    .not('participant_id', 'in', `(${adminIds.join(',')})`)
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${rallySubCount || 0} rally submissions`);

  // Delete check-ins (non-admin)
  console.log('   Deleting check-ins (non-admin)...');
  const { error: checkinsError, count: checkinsCount } = await supabase
    .from('check_ins')
    .delete()
    .not('participant_id', 'in', `(${adminIds.join(',')})`)
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${checkinsCount || 0} check-ins`);

  // Delete non-admin participants
  console.log('   Deleting non-admin participants...');
  const { error: participantsError, count: participantsCount } = await supabase
    .from('participants')
    .delete()
    .eq('is_admin', false)
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${participantsCount || 0} participants`);

  // Step 3: Reset admin participant data (but keep the participant records)
  console.log('\n   Resetting admin participant data...');
  
  for (const adminId of adminIds) {
    // Delete admin rally submissions
    await supabase
      .from('rally_submissions')
      .delete()
      .eq('participant_id', adminId);

    // Delete admin zone submissions
    await supabase
      .from('rally_zone_submissions')
      .delete()
      .eq('participant_id', adminId);

    // Delete admin achievements
    await supabase
      .from('participant_achievements')
      .delete()
      .eq('participant_id', adminId);

    // Delete admin ride stories
    await supabase
      .from('ride_stories')
      .delete()
      .eq('participant_id', adminId);

    // Delete admin check-ins
    await supabase
      .from('check_ins')
      .delete()
      .eq('participant_id', adminId);

    // Reset admin participant fields
    await supabase
      .from('participants')
      .update({
        checked_in: false,
        checked_in_at: null,
        total_achievement_points: 0,
        qr_code_url: null,
      })
      .eq('id', adminId);
  }
  console.log(`   ✓ Reset data for ${adminIds.length} admin(s)`);

  // Step 4: Clean up other tables (these don't have participant_id FK)
  
  // Delete all documents (they should be re-uploaded for new edition)
  console.log('\n   Deleting documents...');
  const { error: docsError, count: docsCount } = await supabase
    .from('documents')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    .select('id', { count: 'exact', head: true });
  console.log(`   ✓ Deleted ${docsCount || 0} documents`);

  console.log('\n✅ Supabase cleanup complete!');
}

async function resetSanityData() {
  console.log('\n🔄 Resetting Sanity data...');
  
  // Note: We don't delete rally zones, site config, etc.
  // Those can be updated manually or kept as templates
  
  // Optionally, we could reset zone submissions or other dynamic data here
  console.log('   ℹ️  Rally zones and site config preserved');
  console.log('   ℹ️  Update rally zone details manually if needed');
  
  console.log('\n✅ Sanity reset complete!');
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║     🏍️  DEUR DEN BOCHT - NEW EDITION PREPARATION SCRIPT      ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  WARNING: This script will:');
  console.log('   • Create a new edition in Sanity');
  console.log('   • Delete ALL participant data (except admins)');
  console.log('   • Delete ALL rally submissions, achievements, check-ins');
  console.log('   • Keep admin users but reset their data');
  console.log('');

  const confirm = await askQuestion('Are you ABSOLUTELY SURE? Type "YES" to continue: ');
  
  if (confirm !== 'YES') {
    console.log('\n❌ Operation cancelled. No changes made.');
    rl.close();
    process.exit(0);
  }

  console.log('\n📋 New Edition Details:');
  
  const year = await askQuestion('   Year (e.g., 2027): ');
  const title = `Deur Den Bocht ${year}`;
  const date = await askQuestion('   Event Date (YYYY-MM-DD, e.g., 2027-05-17): ');
  const regOpen = await askQuestion('   Registration Opens (YYYY-MM-DD, e.g., 2027-01-01): ');
  const regClose = await askQuestion('   Registration Closes (YYYY-MM-DD, e.g., 2027-05-10): ');

  console.log('\n📝 Summary:');
  console.log(`   Title: ${title}`);
  console.log(`   Date: ${date}`);
  console.log(`   Registration: ${regOpen} → ${regClose}`);
  console.log('');

  const finalConfirm = await askQuestion('Proceed with these settings? Type "YES": ');
  
  if (finalConfirm !== 'YES') {
    console.log('\n❌ Operation cancelled. No changes made.');
    rl.close();
    process.exit(0);
  }

  try {
    // Step 1: Create new edition in Sanity
    await createNewEdition({
      title,
      year: parseInt(year),
      date,
      registrationOpenDate: regOpen,
      registrationCloseDate: regClose,
    });

    // Step 2: Clean up Supabase
    await cleanupSupabase();

    // Step 3: Reset Sanity dynamic data (optional)
    await resetSanityData();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║                    ✅ PREPARATION COMPLETE!                   ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Review rally zones in Sanity Studio');
    console.log('   2. Update GPX route for new edition');
    console.log('   3. Upload new documents (Bochtenboek, maps, etc.)');
    console.log('   4. Test registration flow');
    console.log('   5. Update homepage content if needed');
    console.log('');
    console.log('🎉 Ready for the new edition!');

  } catch (error) {
    console.error('\n❌ Error during preparation:', error);
    console.error('\n⚠️  Some changes may have been applied. Check Sanity and Supabase manually.');
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main();
