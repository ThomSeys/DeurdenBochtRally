import { createClient } from '@supabase/supabase-js';

require('dotenv').config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkZoneTimes() {
  const { data } = await supabase
    .from('rally_zone_submissions')
    .select('id, zone_id, checkpoint_number, zone_time_minutes, rhythm_score, view_score, shadow_score')
    .order('zone_id', { ascending: true })
    .order('checkpoint_number', { ascending: true });
  
  console.log('Current zone submissions:');
  console.log('Zone | CP | Time (min) | Rhythm | View | Shadow');
  console.log('-'.repeat(60));
  
  for (const row of data || []) {
    console.log(
      `${row.zone_id.padEnd(5)}| ${row.checkpoint_number.toString().padEnd(3)}| ${(row.zone_time_minutes || 0).toString().padEnd(11)}| ${(row.rhythm_score || 0).toFixed(1).padEnd(7)}| ${(row.view_score || 0).toFixed(1).padEnd(5)}| ${(row.shadow_score || 0).toFixed(1)}`
    );
  }
}

checkZoneTimes();
