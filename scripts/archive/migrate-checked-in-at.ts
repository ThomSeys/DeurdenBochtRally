import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/web/.env.local
dotenv.config({ path: join(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('🔄 Adding checked_in_at column to participants table...');

  try {
    // Add checked_in_at column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE participants 
        ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
        
        CREATE INDEX IF NOT EXISTS idx_participants_checked_in_at ON participants(checked_in_at);
      `
    });

    if (alterError) {
      console.error('❌ Error:', alterError);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('   - Added checked_in_at column');
    console.log('   - Created index on checked_in_at');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
