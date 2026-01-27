const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gxhseyrdqytkmujwtmlu.supabase.co',
  'sb_secret_sZcvOeOZY7sGZsr6G-EFrg_HxgkhoWh'
);

async function setupTestData() {
  console.log('🧹 Setting up clean test data...\n');
  
  // 1. Find the participant
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id, first_name, last_name, email')
    .eq('email', 'thomasseyssens82@hotmail.com')
    .single();
  
  if (participantError || !participant) {
    console.log('❌ Could not find participant with email thomasseyssens82@hotmail.com');
    return;
  }
  
  console.log(`✅ Found participant: ${participant.first_name} ${participant.last_name} (ID: ${participant.id})`);
  
  // 2. Clean up existing data for this participant
  console.log('\n🗑️  Deleting existing rally data...');
  
  const { error: deleteZonesError } = await supabase
    .from('rally_zone_submissions')
    .delete()
    .eq('participant_id', participant.id);
  
  if (deleteZonesError) {
    console.log('⚠️  Error deleting zone submissions:', deleteZonesError.message);
  } else {
    console.log('   ✅ Deleted old rally_zone_submissions');
  }
  
  const { error: deleteSubmissionError } = await supabase
    .from('rally_submissions')
    .delete()
    .eq('participant_id', participant.id);
  
  if (deleteSubmissionError) {
    console.log('⚠️  Error deleting rally submission:', deleteSubmissionError.message);
  } else {
    console.log('   ✅ Deleted old rally_submission');
  }
  
  // 3. Create comprehensive test data
  console.log('\n📝 Creating test data with proper checkpoint structure...\n');
  
  // Zone configuration based on migration
  const zoneConfig = {
    1: { checkpoints: 1, type: 'short' },
    2: { checkpoints: 2, type: 'medium' },
    3: { checkpoints: 2, type: 'medium' },
    4: { checkpoints: 3, type: 'long' },
    5: { checkpoints: 2, type: 'medium' },
    6: { checkpoints: 1, type: 'short' },
    7: { checkpoints: 2, type: 'medium' },
    8: { checkpoints: 3, type: 'long' },
  };
  
  const baseTime = new Date('2026-01-16T10:00:00Z');
  const checkpointRecords = [];
  
  // Create checkpoint records for all 8 zones
  for (let zoneNum = 1; zoneNum <= 8; zoneNum++) {
    const config = zoneConfig[zoneNum];
    const zoneStartTime = new Date(baseTime.getTime() + (zoneNum - 1) * 30 * 60 * 1000); // 30 min apart
    
    console.log(`Zone ${zoneNum} (${config.type}): ${config.checkpoints} checkpoint${config.checkpoints > 1 ? 's' : ''}`);
    
    for (let cpNum = 1; cpNum <= config.checkpoints; cpNum++) {
      const cpTime = new Date(zoneStartTime.getTime() + (cpNum - 1) * 5 * 60 * 1000); // 5 min per checkpoint
      
      checkpointRecords.push({
        participant_id: participant.id,
        zone_id: zoneNum.toString(),
        checkpoint_number: cpNum,
        total_checkpoints: config.checkpoints,
        entry_timestamp: zoneStartTime.toISOString(),
        entry_latitude: cpNum === 1 ? 51.0366 + (zoneNum * 0.01) : null,
        entry_longitude: cpNum === 1 ? 3.9136 + (zoneNum * 0.01) : null,
        entry_accuracy: cpNum === 1 ? 20 : null,
        submitted_answer: `TESTCODE${zoneNum}-${cpNum}`,
        normalized_answer: `testcode${zoneNum}-${cpNum}`,
        is_correct: true,
        valid: true,
        answer_timestamp: cpTime.toISOString(),
        answer_latitude: 51.0366 + (zoneNum * 0.01) + (cpNum * 0.001),
        answer_longitude: 3.9136 + (zoneNum * 0.01) + (cpNum * 0.001),
        answer_accuracy: 25,
      });
      
      console.log(`   ✓ Checkpoint ${cpNum}/${config.checkpoints}: TESTCODE${zoneNum}-${cpNum}`);
    }
  }
  
  // Insert all checkpoint records
  const { error: insertError } = await supabase
    .from('rally_zone_submissions')
    .insert(checkpointRecords);
  
  if (insertError) {
    console.log('\n❌ Error creating checkpoint records:', insertError.message);
    return;
  }
  
  console.log(`\n✅ Created ${checkpointRecords.length} checkpoint records`);
  
  // 4. Create rally_submission with combined codes
  console.log('\n📋 Creating rally_submission record...');
  
  const rallySubmission = {
    participant_id: participant.id,
    rz1_code: 'TESTCODE1-1',
    rz2_code: 'TESTCODE2-1|TESTCODE2-2',
    rz3_code: 'TESTCODE3-1|TESTCODE3-2',
    rz4_code: 'TESTCODE4-1|TESTCODE4-2|TESTCODE4-3',
    rz5_code: 'TESTCODE5-1|TESTCODE5-2',
    rz6_code: 'TESTCODE6-1',
    rz7_code: 'TESTCODE7-1|TESTCODE7-2',
    rz8_code: 'TESTCODE8-1|TESTCODE8-2|TESTCODE8-3',
    start_km: 12345.5,
    end_km: 12789.2,
    total_distance: 443.7,
    start_km_locked: true,
    end_km_locked: true,
    total_points: 206, // Max points: 2*12 + 4*20 + 2*35 + 30 (all zones) + 10 (4+ zones) + 10 (500km)
    short_zones_completed: 2,
    medium_zones_completed: 4,
    long_zones_completed: 2,
    submitted_at: new Date().toISOString(),
  };
  
  const { error: submissionError } = await supabase
    .from('rally_submissions')
    .insert(rallySubmission);
  
  if (submissionError) {
    console.log('❌ Error creating rally submission:', submissionError.message);
    return;
  }
  
  console.log('✅ Rally submission created with combined codes');
  
  // 5. Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test data setup complete!\n');
  console.log('Summary:');
  console.log(`  • Participant: ${participant.first_name} ${participant.last_name}`);
  console.log(`  • Email: ${participant.email}`);
  console.log(`  • Total zones: 8 (all completed)`);
  console.log(`  • Total checkpoints: ${checkpointRecords.length}`);
  console.log(`  • Breakdown:`);
  console.log(`    - 2 Short zones (1 checkpoint each) = 2 checkpoints`);
  console.log(`    - 4 Medium zones (2 checkpoints each) = 8 checkpoints`);
  console.log(`    - 2 Long zones (3 checkpoints each) = 6 checkpoints`);
  console.log(`  • Total points: 206`);
  console.log(`  • Total distance: 443.7 km`);
  console.log('\nYou can now test:');
  console.log('  ✓ Viewing zones with multiple checkpoints');
  console.log('  ✓ Dashboard showing all checkpoint codes');
  console.log('  ✓ Points calculation with zone type bonuses');
  console.log('  ✓ Leaderboard with complete submission');
  console.log('='.repeat(60));
}

setupTestData();
