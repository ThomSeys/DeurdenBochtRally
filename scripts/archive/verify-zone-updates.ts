import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function verifyZoneUpdates() {
  console.log('🔍 Verifying published zone data...\n');
  
  const zones = await client.fetch(`
    *[_type == "rallyZone" && !(_id in path("drafts.**"))] | order(title asc) {
      _id,
      title,
      startPoint,
      endPoint,
      routeTips[] {
        name,
        locations[] {
          name,
          type
        }
      }
    }
  `);
  
  zones.forEach((zone: any) => {
    const routeTipsWithLocations = zone.routeTips?.filter((rt: any) => rt.locations && rt.locations.length > 0).length || 0;
    const totalLocations = zone.routeTips?.reduce((sum: number, rt: any) => sum + (rt.locations?.length || 0), 0) || 0;
    
    console.log(`📍 ${zone.title}`);
    console.log(`   Published ID: ${zone._id}`);
    console.log(`   Start: ${zone.startPoint ? `✅ ${zone.startPoint.lat.toFixed(4)}, ${zone.startPoint.lng.toFixed(4)}` : '❌ Missing'}`);
    console.log(`   End: ${zone.endPoint ? `✅ ${zone.endPoint.lat.toFixed(4)}, ${zone.endPoint.lng.toFixed(4)}` : '❌ Missing'}`);
    console.log(`   RouteTips with locations: ${routeTipsWithLocations}`);
    console.log(`   Total location points: ${totalLocations}`);
    console.log('');
  });
}

verifyZoneUpdates().catch(console.error);
