import { supabaseAdmin } from '../apps/web/app/lib/supabase.server';

async function addOdometerColumns() {
  console.log('Adding odometer columns to rally_submissions table...');

  // Use raw SQL to add columns
  const { error } = await supabaseAdmin.rpc('exec_sql', {
    sql: `
      ALTER TABLE rally_submissions
      ADD COLUMN IF NOT EXISTS start_km DECIMAL(10, 1),
      ADD COLUMN IF NOT EXISTS end_km DECIMAL(10, 1),
      ADD COLUMN IF NOT EXISTS start_km_locked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS end_km_locked BOOLEAN DEFAULT FALSE;
    `
  });

  if (error) {
    console.error('Error:', error);
    console.log('\nAlternative: Run this SQL directly in Supabase SQL Editor:');
    console.log(`
ALTER TABLE rally_submissions
ADD COLUMN IF NOT EXISTS start_km DECIMAL(10, 1),
ADD COLUMN IF NOT EXISTS end_km DECIMAL(10, 1),
ADD COLUMN IF NOT EXISTS start_km_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS end_km_locked BOOLEAN DEFAULT FALSE;
    `);
  } else {
    console.log('✓ Columns added successfully!');
  }
}

addOdometerColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
