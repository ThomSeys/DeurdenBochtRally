import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function deleteAllRallyZones() {
  try {
    console.log('🧹 Alle rally zones verwijderen...\n');

    // Fetch all rally zones
    const zones = await client.fetch('*[_type == "rallyZone"]{ _id, title }');
    
    if (zones.length === 0) {
      console.log('✅ Geen rally zones gevonden om te verwijderen.');
      return;
    }

    console.log(`📋 ${zones.length} rally zones gevonden:\n`);
    zones.forEach((zone: any) => {
      console.log(`   - ${zone.title} (${zone._id})`);
    });

    console.log('\n🗑️  Verwijderen...\n');

    // Delete all zones
    for (const zone of zones) {
      await client.delete(zone._id);
      console.log(`   ✅ ${zone.title} verwijderd`);
    }

    console.log('\n✨ Alle rally zones succesvol verwijderd!\n');
  } catch (error) {
    console.error('❌ Fout bij verwijderen:', error);
    throw error;
  }
}

deleteAllRallyZones();
