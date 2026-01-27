/**
 * Master Setup Script
 * Runs complete setup for both Sanity and Supabase in the correct order
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function runScript(scriptPath: string, description: string) {
  console.log(`\n▶️  ${description}...`);
  try {
    execSync(`npm run script ${scriptPath}`, { stdio: 'inherit' });
    console.log(`✅ ${description} complete\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed\n`);
    return false;
  }
}

async function masterSetup() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🚀 DEUR DEN BOCHT - MASTER SETUP           ║');
  console.log('║   Complete setup for Sanity + Supabase      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const setupType = await ask(
    'Choose setup type:\n  1) Fresh setup (clean slate)\n  2) Keep existing data, add missing\n  3) Cancel\n\nChoice (1-3): '
  );

  if (setupType === '3') {
    console.log('\n❌ Setup cancelled\n');
    rl.close();
    return;
  }

  const freshSetup = setupType === '1';

  if (freshSetup) {
    console.log('\n⚠️  WARNING: This will DELETE ALL existing data!\n');
    const confirm = await ask('Type "DELETE ALL" to confirm: ');
    
    if (confirm !== 'DELETE ALL') {
      console.log('\n❌ Setup cancelled\n');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Setup Plan:');
  console.log('═══════════════════════════════════════════════\n');

  if (freshSetup) {
    console.log('SANITY:');
    console.log('  1. ❌ Delete all Sanity content');
    console.log('  2. ✨ Create complete setup (edition, config, sponsors, etc)');
    console.log('  3. 🗺️  Generate 4 rally zones from GPX');
    console.log('  4. 📤 Publish all drafts\n');
    
    console.log('SUPABASE:');
    console.log('  5. 🗄️  Reset database (manual: run schema.sql in SQL Editor)');
    console.log('  6. 🪣  Setup storage buckets');
    console.log('  7. 👤 Create admin user');
    console.log('  8. 🧪 Populate test data\n');
  } else {
    console.log('SANITY:');
    console.log('  1. ✨ Create missing content');
    console.log('  2. 📤 Publish all drafts\n');
    
    console.log('SUPABASE:');
    console.log('  3. 🪣  Setup storage buckets');
    console.log('  4. 👤 Create admin user (optional)');
    console.log('  5. 🧪 Populate test data (optional)\n');
  }

  const proceed = await ask('Proceed with setup? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes') {
    console.log('\n❌ Setup cancelled\n');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting setup...\n');
  console.log('═══════════════════════════════════════════════\n');

  // SANITY SETUP
  console.log('📦 SANITY SETUP\n');

  if (freshSetup) {
    if (!runScript('scripts/sanity/reset-all-data.ts', 'Reset Sanity data')) {
      rl.close();
      return;
    }
  }

  if (!runScript('scripts/sanity/complete-setup.ts', 'Create Sanity content')) {
    rl.close();
    return;
  }

  if (!runScript('scripts/sanity/generate-rally-zones.ts', 'Generate rally zones')) {
    rl.close();
    return;
  }

  if (!runScript('scripts/sanity/publish-all-drafts.ts', 'Publish Sanity drafts')) {
    rl.close();
    return;
  }

  // SUPABASE SETUP
  console.log('\n═══════════════════════════════════════════════\n');
  console.log('🗄️  SUPABASE SETUP\n');

  if (freshSetup) {
    console.log('\n⚠️  MANUAL STEP REQUIRED:\n');
    console.log('1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy and run: scripts/supabase/schema.sql');
    console.log('3. Verify all tables are created\n');
    
    const schemaComplete = await ask('Schema applied? (yes/no): ');
    
    if (schemaComplete.toLowerCase() !== 'yes') {
      console.log('\n❌ Please complete schema setup first\n');
      rl.close();
      return;
    }
  }

  if (!runScript('scripts/supabase/setup-storage-buckets.ts', 'Setup storage buckets')) {
    console.log('⚠️  Some buckets may already exist - continuing...');
  }

  // For fresh setup, automatically populate test data
  if (freshSetup) {
    console.log('\n📊 Populating complete test data automatically...\n');
    runScript('scripts/supabase/populate-test-data.ts', 'Populate test data');
  } else {
    // For incremental setup, ask first
    const addTestData = await ask('\nAdd test data? (yes/no): ');
    if (addTestData.toLowerCase() === 'yes') {
      runScript('scripts/supabase/populate-test-data.ts', 'Populate test data');
    }
  }

  // COMPLETE
  console.log('\n═══════════════════════════════════════════════\n');
  console.log('✅ SETUP COMPLETE!\n');
  console.log('📍 Next steps:\n');
  console.log('  1. Start dev server: npm run dev');
  console.log('  2. Open Sanity Studio: http://localhost:3000/studio');
  console.log('  3. Upload images (hero, sponsors, etc)');
  console.log('  4. Upload GPX route file');
  console.log('  5. Test registration flow\n');
  console.log('📚 Documentation: /docs/setup/\n');

  rl.close();
}

masterSetup().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});
