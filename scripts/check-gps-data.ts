import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Check rally zones
  const { data: zones } = await supabase
    .from('rally_zones')
    .select('id, zone_number, name, location')
    .limit(3);
  
  console.log('Rally zones:', JSON.stringify(zones, null, 2));
  
  // Check check-ins count
  const { count } = await supabase
    .from('rally_zone_checkins')
    .select('*', { count: 'exact', head: true });
  
  console.log('\nTotal check-ins:', count);
  
  // Check sample check-ins
  const { data: checkins } = await supabase
    .from('rally_zone_checkins')
    .select('id, rally_zone_id, action, checked_in_at')
    .limit(5);
  
  console.log('Sample check-ins:', JSON.stringify(checkins, null, 2));
}

check();
