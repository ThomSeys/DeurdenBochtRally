require('dotenv').config({ path: './apps/web/.env.local' });
const sanityClient = require('@sanity/client').createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

(async () => {
  console.log('🔍 Checking checkpoint counts in Sanity\n');
  
  const zones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      order,
      "zoneNumber": order + 1,
      zoneType,
      "checkpointCount": count(checkpoints)
    }
  `);

  console.log('Expected vs Actual:');
  console.log('Zone 1: short (1 cp)');
  console.log('Zone 2: medium (2 cp)');
  console.log('Zone 3: medium (2 cp)');
  console.log('Zone 4: long (3 cp)');
  console.log('Zone 5: medium (2 cp)');
  console.log('Zone 6: short (1 cp)');
  console.log('Zone 7: medium (2 cp)');
  console.log('Zone 8: long (3 cp)\n');

  console.log('Actual in Sanity:');
  zones.forEach(zone => {
    const expected = zone.zoneNumber === 1 || zone.zoneNumber === 6 ? 1 :
                     zone.zoneNumber === 4 || zone.zoneNumber === 8 ? 3 : 2;
    const match = zone.checkpointCount === expected ? '✓' : '✗';
    console.log(`Zone ${zone.zoneNumber}: ${zone.zoneType} (${zone.checkpointCount} cp) ${match}`);
  });
})();
