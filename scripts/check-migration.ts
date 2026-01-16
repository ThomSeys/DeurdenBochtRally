import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  console.log('🔍 Checking database migration status...\n');

  // Check rally_zone_submissions table
  console.log('1. Checking rally_zone_submissions table for new columns:');
  const { data: zoneSubmissions, error: zoneError } = await supabase
    .from('rally_zone_submissions')
    .select('checkpoint_number, total_checkpoints')
    .limit(1);
  
  if (zoneError) {
    console.log(`   ❌ Error: ${zoneError.message}`);
    console.log('   → Migration NOT applied to rally_zone_submissions');
  } else {
    console.log('   ✅ checkpoint_number and total_checkpoints columns exist');
  }
  
  // Check rally_submissions table
  console.log('\n2. Checking rally_submissions table for zone type counters:');
  const { data: submissions, error: submissionsError } = await supabase
    .from('rally_submissions')
    .select('short_zones_completed, medium_zones_completed, long_zones_completed')
    .limit(1);
  
  if (submissionsError) {
    console.log(`   ❌ Error: ${submissionsError.message}`);
    console.log('   → Migration NOT applied to rally_submissions');
  } else {
    console.log('   ✅ Zone type counter columns exist');
  }

  // Check if rally_director_dashboard view exists
  console.log('\n3. Checking rally_director_dashboard view:');
  const { data: dashboardData, error: dashboardError } = await supabase
    .from('rally_director_dashboard')
    .select('*')
    .limit(1);
  
  if (dashboardError) {
    console.log(`   ❌ Error: ${dashboardError.message}`);
    console.log('   → View may not be updated or accessible');
  } else {
    console.log('   ✅ Dashboard view is accessible');
  }

  console.log('\n' + '='.repeat(60));
  if (!zoneError && !submissionsError) {
    console.log('✨ Database migration is COMPLETE');
    console.log('\nAll new columns and views are in place.');
    console.log('The multi-checkpoint system is ready to use!');
  } else {
    console.log('⚠️  Database migration is INCOMPLETE');
    console.log('\nTo apply the migration, run:');
    console.log('  psql [DATABASE_URL] < scripts/add-multi-checkpoint-system.sql');
  }
  console.log('='.repeat(60));
}

checkMigration().catch(console.error);
