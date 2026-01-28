const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testCheckpointFlow() {
  console.log('🧪 Testing Multi-Checkpoint Flow\n');
  console.log('='.repeat(60));
  
  // 1. Check zone submission records
  console.log('\n1️⃣  Checking rally_zone_submissions...\n');
  
  const { data: submissions, error } = await supabase
    .from('rally_zone_submissions')
    .select('zone_id, checkpoint_number, total_checkpoints, submitted_answer, is_correct, entry_timestamp')
    .order('zone_id', { ascending: true })
    .order('checkpoint_number', { ascending: true });
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  if (!submissions || submissions.length === 0) {
    console.log('⚠️  No submissions found');
    return;
  }
  
  // Group by zone
  const byZone = {};
  submissions.forEach(sub => {
    if (!byZone[sub.zone_id]) {
      byZone[sub.zone_id] = [];
    }
    byZone[sub.zone_id].push(sub);
  });
  
  console.log(`Found ${submissions.length} checkpoint records across ${Object.keys(byZone).length} zones:\n`);
  
  Object.keys(byZone).sort((a, b) => parseInt(a) - parseInt(b)).forEach(zoneId => {
    const records = byZone[zoneId];
    const totalCheckpoints = records[0].total_checkpoints;
    const completedCheckpoints = records.filter(r => r.submitted_answer).length;
    
    console.log(`📍 Zone ${zoneId} (${totalCheckpoints} checkpoint${totalCheckpoints > 1 ? 's' : ''}):`);
    
    records.forEach(r => {
      const status = r.submitted_answer 
        ? `✅ Code: ${r.submitted_answer}${r.is_correct ? ' (valid)' : ' (invalid)'}`
        : '⏳ Not submitted';
      console.log(`   ${r.checkpoint_number}/${r.total_checkpoints}: ${status}`);
    });
    
    if (completedCheckpoints === totalCheckpoints && totalCheckpoints > 1) {
      console.log(`   🎉 All checkpoints completed!`);
    } else if (completedCheckpoints > 0 && completedCheckpoints < totalCheckpoints) {
      console.log(`   ⚠️  Partial completion (${completedCheckpoints}/${totalCheckpoints})`);
    }
    console.log('');
  });
  
  // 2. Check rally_submissions for combined codes
  console.log('='.repeat(60));
  console.log('\n2️⃣  Checking rally_submissions (combined codes)...\n');
  
  const { data: rallySubs } = await supabase
    .from('rally_submissions')
    .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code')
    .limit(5);
  
  if (rallySubs && rallySubs.length > 0) {
    rallySubs.forEach((sub, idx) => {
      console.log(`Participant ${idx + 1}:`);
      for (let i = 1; i <= 8; i++) {
        const code = sub[`rz${i}_code`];
        if (code) {
          const codes = code.includes('|') ? code.split('|') : [code];
          console.log(`  RZ${i}: ${codes.length} checkpoint${codes.length > 1 ? 's' : ''} - ${codes.join(', ')}`);
        }
      }
      console.log('');
    });
  }
  
  console.log('='.repeat(60));
  console.log('\n✅ Multi-checkpoint system check complete!\n');
  console.log('Expected behavior:');
  console.log('  • Zones 1, 6: 1 checkpoint each');
  console.log('  • Zones 2, 3, 5, 7: 2 checkpoints each');
  console.log('  • Zones 4, 8: 3 checkpoints each');
  console.log('\nWhen a zone is started:');
  console.log('  → Creates separate records for EACH checkpoint');
  console.log('\nWhen codes are submitted:');
  console.log('  → Updates each checkpoint record with submitted_answer');
  console.log('  → Stores combined codes in rally_submissions (pipe-separated)');
}

testCheckpointFlow();
