import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gxhseyrdqytkmujwtmlu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4aHNleXJkcXl0a211and0bWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzAzMzE3MCwiZXhwIjoyMDUyNjA5MTcwfQ.sb_secret_sZcvOeOZY7sGZsr6G-EFrg_HxgkhoWh';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function clearRallySubmissions() {
  try {
    console.log('🧹 Rally submissions verwijderen uit Supabase...\n');

    // First, get counts before deletion
    const { count: checkpointCount } = await supabase
      .from('checkpoint_submissions')
      .select('*', { count: 'exact', head: true });

    const { count: rallyCount } = await supabase
      .from('rally_submissions')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 Huidige status:`);
    console.log(`   - ${checkpointCount || 0} checkpoint submissions`);
    console.log(`   - ${rallyCount || 0} rally submissions\n`);

    if ((checkpointCount || 0) === 0 && (rallyCount || 0) === 0) {
      console.log('✅ Database is al leeg, niets te verwijderen.\n');
      return;
    }

    console.log('🗑️  Verwijderen...\n');

    // Delete checkpoint submissions first (child records)
    const { error: checkpointError } = await supabase
      .from('checkpoint_submissions')
      .delete()
      .neq('id', 0); // Delete all records

    if (checkpointError) {
      console.error('❌ Fout bij verwijderen checkpoint submissions:', checkpointError);
      throw checkpointError;
    }

    console.log(`   ✅ ${checkpointCount || 0} checkpoint submissions verwijderd`);

    // Delete rally submissions (parent records)
    const { error: rallyError } = await supabase
      .from('rally_submissions')
      .delete()
      .neq('id', 0); // Delete all records

    if (rallyError) {
      console.error('❌ Fout bij verwijderen rally submissions:', rallyError);
      throw rallyError;
    }

    console.log(`   ✅ ${rallyCount || 0} rally submissions verwijderd\n`);

    // Verify deletion
    const { count: finalCheckpointCount } = await supabase
      .from('checkpoint_submissions')
      .select('*', { count: 'exact', head: true });

    const { count: finalRallyCount } = await supabase
      .from('rally_submissions')
      .select('*', { count: 'exact', head: true });

    console.log('✨ Database succesvol gewist!');
    console.log(`\n📊 Nieuwe status:`);
    console.log(`   - ${finalCheckpointCount || 0} checkpoint submissions`);
    console.log(`   - ${finalRallyCount || 0} rally submissions\n`);

  } catch (error) {
    console.error('❌ Fout bij wissen database:', error);
    throw error;
  }
}

clearRallySubmissions();
