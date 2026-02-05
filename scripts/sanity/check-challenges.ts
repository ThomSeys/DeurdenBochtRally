import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN || process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
});

async function checkChallenges() {
  console.log('🔍 Checking for challenges in Sanity...\n');

  const zones = await client.fetch(`
    *[_type == "rallyZone"]{
      _id,
      title,
      "routeTips": routeTips[]{
        _key,
        name,
        "locations": locations[]{
          _key,
          name,
          challenge
        }
      }
    }
  `);

  zones.forEach((zone: any) => {
    console.log(`\n📍 Zone: ${zone.title} (${zone._id})`);
    
    if (!zone.routeTips || zone.routeTips.length === 0) {
      console.log('  ❌ No route tips found');
      return;
    }

    zone.routeTips.forEach((tip: any) => {
      console.log(`\n  🛣️  Route: ${tip.name} (${tip._key})`);
      
      if (!tip.locations || tip.locations.length === 0) {
        console.log('    ❌ No locations found');
        return;
      }

      tip.locations.forEach((loc: any, idx: number) => {
        if (loc.challenge) {
          console.log(`    ✅ Location ${idx}: ${loc.name} - Has challenge (${loc.challenge.type})`);
          console.log(`       Question: ${loc.challenge.question?.substring(0, 50)}...`);
        } else {
          console.log(`    ⚪ Location ${idx}: ${loc.name || 'Unnamed'} - No challenge`);
        }
      });
    });
  });

  console.log('\n✅ Check complete!');
}

checkChallenges().catch(console.error);
