import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkAuth() {
  console.log('\n🔍 Checking Auth & Participant Data...\n');

  // Check auth users
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users.find(u => u.email === 'admin@deurdenbocht.be');
  
  console.log('Auth User:');
  console.log('  Email:', adminUser?.email || 'NOT FOUND');
  console.log('  ID:', adminUser?.id || 'NOT FOUND');
  console.log('  Email confirmed:', adminUser?.email_confirmed_at ? 'YES' : 'NO');

  // Check participants table
  const { data: participants } = await supabase
    .from('participants')
    .select('id, email, is_admin')
    .eq('email', 'admin@deurdenbocht.be');
  
  const participant = participants?.[0];
  console.log('\nParticipant Record:');
  console.log('  Email:', participant?.email || 'NOT FOUND');
  console.log('  ID:', participant?.id || 'NOT FOUND');
  console.log('  Is Admin:', participant?.is_admin || false);

  // Check if IDs match
  console.log('\nID Match:');
  if (adminUser && participant) {
    const match = adminUser.id === participant.id;
    console.log(`  ${match ? '✅' : '❌'} Auth ID ${match ? '==' : '!='} Participant ID`);
    if (!match) {
      console.log('\n⚠️  IDs DO NOT MATCH - This is the problem!');
      console.log(`   Auth ID:        ${adminUser.id}`);
      console.log(`   Participant ID: ${participant.id}`);
    }
  }

  // Try login
  console.log('\n🔐 Testing Login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@deurdenbocht.be',
    password: 'Rally2026!'
  });

  if (authError) {
    console.log(`❌ Login failed: ${authError.message}`);
  } else {
    console.log('✅ Login successful!');
    console.log('   User ID:', authData.user?.id);
  }
}

checkAuth();
