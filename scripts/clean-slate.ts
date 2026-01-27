/**
 * Clean Slate - Delete ALL Data
 * Removes ALL data from both Sanity and Supabase
 * USE WITH EXTREME CAUTION!
 */

import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from correct path
dotenv.config({ path: resolve(__dirname, '../apps/web/.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Sanity client
const sanityClient = createSanityClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: process.env.SANITY_TOKEN || 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  apiVersion: '2023-05-03',
  useCdn: false,
});

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

async function cleanSanity() {
  console.log('\n🗑️  Deleting all Sanity documents...');

  const allDocs = await sanityClient.fetch(`
    *[!(_type match "system.**")] {
      _id,
      _type
    }
  `);

  if (allDocs.length === 0) {
    console.log('   ✓ No documents to delete\n');
    return;
  }

  console.log(`   Found ${allDocs.length} document(s)`);

  const batchSize = 100;
  for (let i = 0; i < allDocs.length; i += batchSize) {
    const batch = allDocs.slice(i, i + batchSize);
    const transaction = sanityClient.transaction();

    batch.forEach((doc: any) => {
      transaction.delete(doc._id);
    });

    await transaction.commit();
    console.log(`   ✓ Deleted batch ${Math.floor(i / batchSize) + 1}`);
  }

  console.log('   ✅ All Sanity documents deleted\n');
}

async function cleanSupabase() {
  console.log('🗑️  Deleting all Supabase data...\n');

  // First, delete all auth users (must be done before participants table)
  console.log('🔐 Deleting auth users...');
  try {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log(`   ⚠️  Could not list users: ${listError.message}`);
    } else if (users && users.users.length > 0) {
      let deletedCount = 0;
      for (const user of users.users) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (!error) {
          deletedCount++;
        }
      }
      console.log(`   ✓ auth.users: ${deletedCount} users deleted`);
    } else {
      console.log(`   ✓ auth.users: no users to delete`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  auth.users: ${err.message}`);
  }

  const tables = [
    'photo_likes',
    'ride_story_likes',
    'participant_photos',
    'ride_stories',
    'participant_achievements',
    'certificates',
    'emergency_contacts',
    'emergency_sos',
    'push_delivery_log',
    'push_notifications_history',
    'push_recipient_groups',
    'push_message_templates',
    'push_subscriptions',
    'report_queue',
    'report_history',
    'scheduled_reports',
    'rally_zone_checkins',
    'participants',
    'documents',
    'achievements',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✓ ${table}: ${data?.length || 0} rows deleted`);
      }
    } catch (err: any) {
      console.log(`   ⚠️  ${table}: ${err.message}`);
    }
  }

  console.log('\n   ✅ All Supabase data deleted\n');

  console.log('🪣 Cleaning storage buckets...\n');

  const buckets = ['participant-photos', 'qr-codes', 'fallback-photos', 'reports'];

  for (const bucket of buckets) {
    try {
      const { data: files } = await supabase.storage.from(bucket).list();

      if (files && files.length > 0) {
        const filePaths = files.map((f) => f.name);
        await supabase.storage.from(bucket).remove(filePaths);
        console.log(`   ✓ ${bucket}: ${files.length} files deleted`);
      } else {
        console.log(`   ✓ ${bucket}: empty`);
      }
    } catch (err: any) {
      console.log(`   ⚠️  ${bucket}: ${err.message}`);
    }
  }

  console.log('   ✅ Storage buckets cleaned\n');
}

async function cleanSlate() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        ⚠️  CLEAN SLATE - DELETE ALL          ║');
  console.log('║                                              ║');
  console.log('║  This will permanently delete:               ║');
  console.log('║  • ALL Sanity content (editions, zones, etc) ║');
  console.log('║  • ALL Supabase data (participants, photos)  ║');
  console.log('║  • ALL storage files (photos, QR codes)      ║');
  console.log('║                                              ║');
  console.log('║  THIS CANNOT BE UNDONE!                      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const confirm1 = await ask('Type the project name "Deur Den Bocht" to confirm: ');
  
  if (confirm1 !== 'Deur Den Bocht') {
    console.log('\n❌ Cancelled - name did not match\n');
    rl.close();
    return;
  }

  const confirm2 = await ask('Type "DELETE EVERYTHING" to proceed: ');
  
  if (confirm2 !== 'DELETE EVERYTHING') {
    console.log('\n❌ Cancelled - confirmation text did not match\n');
    rl.close();
    return;
  }

  console.log('\n💀 Starting complete data deletion...\n');
  console.log('═══════════════════════════════════════════════\n');

  await cleanSanity();
  await cleanSupabase();

  console.log('═══════════════════════════════════════════════\n');
  console.log('✅ CLEAN SLATE COMPLETE\n');
  console.log('All data has been permanently deleted.\n');
  console.log('📍 Next steps:');
  console.log('   Run: npm run script scripts/master-setup.ts\n');

  rl.close();
}

cleanSlate().catch((error) => {
  console.error('\n❌ Clean slate failed:', error);
  rl.close();
  process.exit(1);
});
