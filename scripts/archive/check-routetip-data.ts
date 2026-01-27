import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
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
