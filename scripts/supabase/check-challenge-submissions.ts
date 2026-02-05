import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkSubmissions() {
  console.log('🔍 Checking for challenge submissions...\n');

  try {
    // First check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('route_challenge_submissions')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('❌ Table "route_challenge_submissions" does not exist!');
      console.log('\nRun this script to create it:');
      console.log('  psql -h db.gxhseyrdqytkmujwtmlu.supabase.co -U postgres -d postgres -f scripts/add-route-challenges.sql');
      console.log('\nOr manually execute the SQL from: scripts/add-route-challenges.sql\n');
      return;
    }

    const { data, error } = await supabase
      .from('route_challenge_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching submissions:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No submissions found in the database yet.\n');
      console.log('Possible issues:');
      console.log('  1. The API might not be saving data correctly');
      console.log('  2. Authentication might be failing');
      console.log('  3. The participant might not exist\n');
      return;
    }

    console.log(`✅ Found ${data.length} submission(s):\n`);
    
    data.forEach((submission, idx) => {
      console.log(`${idx + 1}. ID: ${submission.id}`);
      console.log(`   Participant: ${submission.participant_id}`);
      console.log(`   Zone: ${submission.zone_id}`);
      console.log(`   Location: ${submission.location_key}`);
      console.log(`   Type: ${submission.challenge_type}`);
      console.log(`   Answer: ${submission.text_answer || submission.photo_url || 'N/A'}`);
      console.log(`   Correct: ${submission.is_correct ?? 'Not validated'}`);
      console.log(`   Points: ${submission.points_awarded}`);
      console.log(`   Submitted: ${submission.submitted_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to check submissions:', error);
  }
}

checkSubmissions();
