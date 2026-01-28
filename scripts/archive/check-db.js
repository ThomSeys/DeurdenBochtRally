const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  console.log('Checking rally_zone_submissions...');
  const result1 = await supabase
    .from('rally_zone_submissions')
    .select('checkpoint_number, total_checkpoints')
    .limit(1);
  
  if (result1.error) {
    console.log('❌ rally_zone_submissions:', result1.error.message);
  } else {
    console.log('✅ rally_zone_submissions has checkpoint columns');
  }
  
  console.log('\nChecking rally_submissions...');
  const result2 = await supabase
    .from('rally_submissions')
    .select('short_zones_completed, medium_zones_completed, long_zones_completed')
    .limit(1);
  
  if (result2.error) {
    console.log('❌ rally_submissions:', result2.error.message);
  } else {
    console.log('✅ rally_submissions has zone type counters');
  }
}

check();
