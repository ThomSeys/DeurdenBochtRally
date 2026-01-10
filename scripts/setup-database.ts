import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nRun this command first:');
  console.error('export $(cat apps/web/.env.local | grep -v "^#" | xargs)\n');
  process.exit(1);
}

console.log('🚀 Setting up Supabase database...\n');

// Extract project ref from URL (e.g., gxhseyrdqytkmujwtmlu from https://gxhseyrdqytkmujwtmlu.supabase.co)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

// Read the schema file
const schemaPath = join(__dirname, '..', 'supabase-schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

// Use Supabase REST API to execute SQL
const apiUrl = `${supabaseUrl}/rest/v1/rpc/`;

async function executeSql(sql: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Try to execute using the client query method
  const { data, error } = await supabase.rpc('exec', { sql });
  
  return { data, error };
}

async function setupDatabase() {
  try {
    console.log('📝 Executing schema SQL...\n');
    console.log('⚠️  Note: You need to run this SQL manually in Supabase Studio:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/editor\n`);
    console.log('Or copy the SQL from: supabase-schema.sql\n');
    
    console.log('💡 Alternative: Use Supabase CLI');
    console.log('   npm install -g supabase');
    console.log('   supabase login');
    console.log('   supabase link --project-ref ' + projectRef);
    console.log('   supabase db push\n');

    // For now, just validate the connection
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.from('participants').select('count').limit(1);
    
    if (error && error.message.includes('relation "participants" does not exist')) {
      console.log('❌ Tables not created yet. Please run the SQL in Supabase Studio.\n');
    } else if (error) {
      console.log('⚠️  Error checking tables:', error.message, '\n');
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Tables already exist!\n');
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

setupDatabase();
