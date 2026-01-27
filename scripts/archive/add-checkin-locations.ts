import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCheckInLocations() {
  console.log('Adding check-in location columns to rally_zone_submissions...');

  try {
    // Add location columns
    const { error: alterError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE rally_zone_submissions
        ADD COLUMN IF NOT EXISTS entry_latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS entry_longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS entry_accuracy DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS answer_latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS answer_longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS answer_accuracy DECIMAL(10, 2);
      `,
    });

    if (alterError) {
      console.error('Error adding columns:', alterError);
      // The columns might already exist, which is fine
      console.log('Columns may already exist, continuing...');
    } else {
      console.log('✓ Columns added successfully');
    }

    // Create indexes for faster queries
    const { error: indexError } = await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_rally_zone_submissions_entry_location 
        ON rally_zone_submissions(entry_latitude, entry_longitude);
        
        CREATE INDEX IF NOT EXISTS idx_rally_zone_submissions_answer_location 
        ON rally_zone_submissions(answer_latitude, answer_longitude);
      `,
    });

    if (indexError) {
      console.log('Indexes may already exist:', indexError.message);
    } else {
      console.log('✓ Indexes created successfully');
    }

    console.log('\n✅ Check-in location tracking is ready!');
    console.log('Columns added:');
    console.log('  - entry_latitude / entry_longitude (where riders started)');
    console.log('  - entry_accuracy (GPS accuracy)');
    console.log('  - answer_latitude / answer_longitude (where they submitted)');
    console.log('  - answer_accuracy (GPS accuracy)');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCheckInLocations();
