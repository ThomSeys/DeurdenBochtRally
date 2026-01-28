import { createClient } from '@sanity/client';
import 'dotenv/config';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function checkData() {
  console.log('🔍 Checking what data exists in Sanity...\n');

  const zones = await sanityClient.fetch(`*[_type == "rallyZone"] | order(order asc) {
    _id,
    title,
    routeTips[] {
      name,
      color,
      locations
    }
  }`);

  zones.forEach((zone: any) => {
    console.log(`\n📍 ${zone.title} (${zone._id})`);
    console.log(`   Has ${zone.routeTips?.length || 0} routeTips`);
    
    if (zone.routeTips && zone.routeTips.length > 0) {
      zone.routeTips.forEach((tip: any, idx: number) => {
        console.log(`   ${idx + 1}. ${tip.name}`);
        console.log(`      - Color: ${tip.color || 'not set'}`);
        console.log(`      - Locations: ${tip.locations?.length || 0} items`);
        if (tip.locations && tip.locations.length > 0) {
          tip.locations.forEach((loc: any) => {
            console.log(`        • ${loc.name} (${loc.type})`);
          });
        }
      });
    }
  });
}

checkData().catch(console.error);
