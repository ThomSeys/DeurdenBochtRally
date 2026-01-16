require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking Zone 2 data for thomasseyssens82@hotmail.com\n');

  // Get participant
  const { data: participant } = await supabase
    .from('participants')
    .select('id, email')
    .eq('email', 'thomasseyssens82@hotmail.com')
    .single();

  if (!participant) {
    console.log('❌ Participant not found');
    return;
  }

  console.log(`✅ Participant: ${participant.email} (ID: ${participant.id})\n`);

  // Get zone 2 checkpoint records
  const { data: checkpoints } = await supabase
    .from('rally_zone_submissions')
    .select('*')
    .eq('participant_id', participant.id)
    .eq('zone_id', '2')
    .order('checkpoint_number');

  console.log(`📍 Zone 2 checkpoint records (${checkpoints?.length || 0}):`);
  checkpoints?.forEach(cp => {
    console.log(`   Checkpoint ${cp.checkpoint_number}/${cp.total_checkpoints}: ${cp.submitted_answer || '(empty)'}`);
  });

  // Get combined code from rally_submissions
  const { data: submission } = await supabase
    .from('rally_submissions')
    .select('rz2_code')
    .eq('participant_id', participant.id)
    .single();

  console.log(`\n📋 Combined code in rally_submissions:`);
  console.log(`   rz2_code: "${submission?.rz2_code || '(empty)'}"`);
  
  const codes = (submission?.rz2_code || '').split('|');
  console.log(`   Split codes: [${codes.map(c => `"${c}"`).join(', ')}]`);
})();
