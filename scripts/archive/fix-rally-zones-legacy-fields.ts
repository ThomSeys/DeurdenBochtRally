import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function fixLegacyFields() {
  try {
    console.log('🔧 Legacy velden invullen...\n');

    const zones = await client.fetch('*[_type == "rallyZone"]{ _id, title }');
    
    if (zones.length === 0) {
      console.log('❌ Geen rally zones gevonden.');
      return;
    }

    console.log(`📋 ${zones.length} zones gevonden\n`);

    for (const zone of zones) {
      console.log(`📍 ${zone.title} updaten...`);
      
      await client
        .patch(zone._id)
        .set({
          // Legacy velden met dummy waarden
          exit: 'Zie routetips voor specifieke instructies',
          lus: 'Zie routetips voor specifieke route beschrijvingen',
          rejoin: 'Zie routetips voor terugkeer instructies',
          estimatedDistance: 30,
          checkpoints: [],
          points: 0,
          radius_m: 30,
          // Dummy coördinaten (centrum België)
          startPoint: {
            lat: 50.5039,
            lng: 4.4699,
          },
          endPoint: {
            lat: 50.5039,
            lng: 4.4699,
          },
        })
        .commit();
      
      console.log(`   ✅ ${zone.title} geüpdatet`);
    }

    console.log('\n✨ Alle zones succesvol geüpdatet!\n');
  } catch (error) {
    console.error('❌ Fout:', error);
    throw error;
  }
}

fixLegacyFields();
