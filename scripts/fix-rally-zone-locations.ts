import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  useCdn: false,
});

async function fixRallyZoneLocations() {
  console.log('🔧 Fixing Rally Zone Locations structure...\n');

  try {
    // Get all rally zones (published and drafts)
    const zones = await sanityClient.fetch<any[]>(`
      *[_type == "rallyZone"]{
        _id,
        _rev,
        title,
        routeTips
      }
    `);

    console.log(`Found ${zones.length} zones to check\n`);

    for (const zone of zones) {
      if (!zone.routeTips || zone.routeTips.length === 0) {
        console.log(`  ⊘ ${zone.title}: No routeTips to fix`);
        continue;
      }

      let needsUpdate = false;
      const updatedRouteTips = zone.routeTips.map((tip: any) => {
        if (!tip.locations || tip.locations.length === 0) {
          return tip;
        }

        const updatedLocations = tip.locations.map((loc: any) => {
          // Check if location has wrong structure
          if (loc._type === 'routeTipLocation' || loc.location || loc.locationType || loc.title) {
            needsUpdate = true;
            
            // Transform to correct structure
            return {
              _key: loc._key,
              _type: 'routeLocation', // Fixed type name
              name: loc.title || loc.name, // title → name
              coordinates: loc.location || loc.coordinates, // location → coordinates
              type: loc.locationType || loc.type, // locationType → type
              description: loc.description,
            };
          }
          
          return loc;
        });

        return {
          ...tip,
          locations: updatedLocations,
        };
      });

      if (needsUpdate) {
        console.log(`  🔄 Updating ${zone.title}...`);
        
        await sanityClient
          .patch(zone._id)
          .set({ routeTips: updatedRouteTips })
          .commit();
        
        console.log(`  ✓ ${zone.title}: Fixed location structure`);
      } else {
        console.log(`  ✓ ${zone.title}: Already correct`);
      }
    }

    console.log('\n✅ All Rally Zone locations fixed!\n');
  } catch (error) {
    console.error('❌ Error fixing rally zone locations:', error);
    process.exit(1);
  }
}

fixRallyZoneLocations();
