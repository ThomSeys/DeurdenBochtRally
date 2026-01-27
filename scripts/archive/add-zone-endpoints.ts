import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  apiVersion: '2023-05-03',
  useCdn: false,
});

const zoneEndpoints = {
  'Vlaamse Ardennen': {
    startPoint: { lat: 50.7569, lng: 3.6089 }, // Oudenaarde
    endPoint: { lat: 50.8225, lng: 3.7817 },   // Geraardsbergen
  },
  'Ardennen - Ourthe Vallei': {
    startPoint: { lat: 50.2342, lng: 5.3442 }, // Durbuy
    endPoint: { lat: 50.4094, lng: 5.8469 },   // La Roche-en-Ardenne
  },
  'Hoge Venen': {
    startPoint: { lat: 50.5064, lng: 6.0908 }, // Spa
    endPoint: { lat: 50.5333, lng: 6.2667 },   // Signal de Botrange
  },
  'Condroz': {
    startPoint: { lat: 50.3511, lng: 4.8667 }, // Dinant
    endPoint: { lat: 50.4667, lng: 4.8667 },   // Ciney
  },
};

async function addZoneEndpoints() {
  console.log('📍 Adding proper start & end points to zones...\n');

  // Get all zones
  const zones = await client.fetch(`
    *[_type == "rallyZone"] {
      _id,
      title,
      "isPublished": !(_id in path("drafts.**"))
    }
  `);

  for (const zone of zones) {
    const endpoints = zoneEndpoints[zone.title as keyof typeof zoneEndpoints];
    
    if (!endpoints) {
      console.log(`⚠️  No endpoints defined for: ${zone.title}`);
      continue;
    }

    const docId = zone.isPublished ? zone._id : zone._id.replace('drafts.', '');
    
    console.log(`\n📍 ${zone.title}`);
    console.log(`   Start: ${endpoints.startPoint.lat}, ${endpoints.startPoint.lng}`);
    console.log(`   End: ${endpoints.endPoint.lat}, ${endpoints.endPoint.lng}`);
    
    // Update published version
    try {
      await client
        .patch(docId)
        .set({
          startPoint: endpoints.startPoint,
          endPoint: endpoints.endPoint,
        })
        .commit();
      console.log(`   ✅ Updated published version`);
    } catch (error) {
      console.log(`   ⚠️  Published version not found`);
    }

    // Check if draft exists first
    const draftExists = await client.fetch(`*[_id == $draftId][0]`, { draftId: `drafts.${docId}` });
    
    if (draftExists) {
      // Update draft version
      try {
        await client
          .patch(`drafts.${docId}`)
          .set({
            startPoint: endpoints.startPoint,
            endPoint: endpoints.endPoint,
          })
          .commit();
        console.log(`   ✅ Updated draft version`);
      } catch (error) {
        console.log(`   ⚠️  Error updating draft:`, error);
      }
    } else {
      console.log(`   ⏭️  No draft version, skipped`);
    }
  }

  console.log('\n✨ Done!');
}

addZoneEndpoints().catch(console.error);
