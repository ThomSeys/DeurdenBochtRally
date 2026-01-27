const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gxhseyrdqytkmujwtmlu.supabase.co',
  'sb_secret_sZcvOeOZY7sGZsr6G-EFrg_HxgkhoWh'
);

async function check() {
  console.log('📊 Checking rally_zone_submissions for checkpoint data...\n');
  
  // Check all zone submissions
  const { data, error } = await supabase
    .from('rally_zone_submissions')
    .select('zone_id, checkpoint_number, total_checkpoints, entry_timestamp')
    .order('zone_id', { ascending: true })
    .order('checkpoint_number', { ascending: true });
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No rally_zone_submissions found');
    return;
  }
  
  console.log(`Found ${data.length} zone submission records:\n`);
  
  const grouped = {};
  data.forEach(record => {
    if (!grouped[record.zone_id]) {
      grouped[record.zone_id] = [];
    }
    grouped[record.zone_id].push(record);
  });
  
  Object.keys(grouped).sort().forEach(zoneId => {
    const records = grouped[zoneId];
    console.log(`Zone ${zoneId}:`);
    records.forEach(r => {
      console.log(`  - Checkpoint ${r.checkpoint_number}/${r.total_checkpoints} (${new Date(r.entry_timestamp).toLocaleString()})`);
    });
    console.log('');
  });
}

check();
