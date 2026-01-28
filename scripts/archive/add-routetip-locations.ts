import { createClient } from '@sanity/client';
import 'dotenv/config';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function addRouteTipLocations() {
  console.log('🗺️  Adding route tip locations to existing rally zones...');

  // Fetch all existing rally zones (both published and drafts)
  const zones = await sanityClient.fetch(`*[_type == "rallyZone"] | order(order asc)`);
  
  console.log(`Found ${zones.length} zones (including drafts)`);

  const updates = [
    {
      zoneTitle: 'Vlaamse Ardennen',
      routeTips: [
        {
          name: 'De Klassieke Klimroute',
          color: '#3B82F6',
          locations: [
            {
              name: 'Koppenberg Top',
              coordinates: { lat: 50.8726, lng: 3.6543 },
              type: 'highlight',
              description: 'Legendarische klim uit de wielersport - prachtig uitzicht',
            },
            {
              name: 'Kwaremont Foto Spot',
              coordinates: { lat: 50.8521, lng: 3.5932 },
              type: 'photo',
              description: 'Iconische locatie voor foto\'s met kasseiweg',
            },
          ],
        },
        {
          name: 'Panoramische Valleiweg',
          color: '#EF4444',
          locations: [
            {
              name: 'Muur van Geraardsbergen',
              coordinates: { lat: 50.7633, lng: 3.8755 },
              type: 'highlight',
              description: 'Steile klim met kapel bovenaan',
            },
          ],
        },
        {
          name: 'Off-road Adventure',
          color: '#10B981',
          locations: [
            {
              name: 'Smalle weggetjes',
              coordinates: { lat: 50.8543, lng: 3.7521 },
              type: 'warning',
              description: 'Let op: zeer smalle weggetjes, fietsers mogelijk',
            },
            {
              name: 'Bos van Horebeke',
              coordinates: { lat: 50.8234, lng: 3.6987 },
              type: 'highlight',
              description: 'Rijden door prachtig bosgebied',
            },
          ],
        },
      ],
    },
    {
      zoneTitle: 'Ardennen - Ourthe Vallei',
      routeTips: [
        {
          name: 'Rivieroute Ourthe',
          color: '#3B82F6',
          locations: [
            {
              name: 'Viewpoint Deister',
              coordinates: { lat: 50.1956, lng: 5.5432 },
              type: 'photo',
              description: 'Spectaculair uitzicht over de Ourthe vallei',
            },
            {
              name: 'Houffalize',
              coordinates: { lat: 50.1322, lng: 5.7918 },
              type: 'highlight',
              description: 'Mooi stadje in het hart van de Ardennen',
            },
          ],
        },
        {
          name: 'Heuvelkam Route',
          color: '#F59E0B',
          locations: [
            {
              name: 'Barrage de Nisramont',
              coordinates: { lat: 50.1345, lng: 5.5234 },
              type: 'highlight',
              description: 'Indrukwekkende stuwdam met mooi meer',
            },
            {
              name: 'Smalle bochten',
              coordinates: { lat: 50.1456, lng: 5.5678 },
              type: 'warning',
              description: 'Extra technische bochten, pas snelheid aan',
            },
          ],
        },
        {
          name: 'Snelle Doorsteek',
          color: '#8B5CF6',
          locations: [
            {
              name: 'N89 Stretch',
              coordinates: { lat: 50.1534, lng: 5.6234 },
              type: 'waypoint',
              description: 'Vlotte nationale weg met mooie bochten',
            },
          ],
        },
      ],
    },
    {
      zoneTitle: 'Hoge Venen',
      routeTips: [
        {
          name: 'Vennentour',
          color: '#3B82F6',
          locations: [
            {
              name: 'Signal de Botrange',
              coordinates: { lat: 50.5035, lng: 6.1087 },
              type: 'highlight',
              description: 'Hoogste punt van België - 694m',
            },
            {
              name: 'Baraque Michel',
              coordinates: { lat: 50.4987, lng: 6.0456 },
              type: 'photo',
              description: 'Historische herberg met prachtig uitzicht',
            },
          ],
        },
        {
          name: 'Stuwmerenroute',
          color: '#10B981',
          locations: [
            {
              name: 'Lac de Robertville',
              coordinates: { lat: 50.4723, lng: 6.1234 },
              type: 'photo',
              description: 'Prachtig stuwmeer',
            },
            {
              name: 'Venen Overzicht',
              coordinates: { lat: 50.4876, lng: 6.0987 },
              type: 'highlight',
              description: 'Uitzicht over de Hoge Venen',
            },
          ],
        },
        {
          name: 'Grensoverschrijdende Lus',
          color: '#EF4444',
          locations: [
            {
              name: 'Eau Rouge Kijkpunt',
              coordinates: { lat: 50.4376, lng: 5.9712 },
              type: 'photo',
              description: 'Iconische F1 bocht van buitenaf bekijken',
            },
            {
              name: 'Stavelot',
              coordinates: { lat: 50.3945, lng: 5.9321 },
              type: 'highlight',
            },
          ],
        },
      ],
    },
    {
      zoneTitle: 'Condroz',
      routeTips: [
        {
          name: 'De Golvende Route',
          color: '#3B82F6',
          locations: [
            {
              name: 'Château de Vêves',
              coordinates: { lat: 50.2134, lng: 5.0234 },
              type: 'highlight',
              description: 'Middeleeuws sprookjeskasteel',
            },
            {
              name: 'Foto Spot Vallei',
              coordinates: { lat: 50.2456, lng: 5.0567 },
              type: 'photo',
              description: 'Uitzicht over de Condroz heuvels',
            },
          ],
        },
        {
          name: 'Maas Panorama',
          color: '#10B981',
          locations: [
            {
              name: 'Rocher Bayard',
              coordinates: { lat: 50.2534, lng: 4.9023 },
              type: 'photo',
              description: 'Indrukwekkende rotsspits langs de Maas',
            },
            {
              name: 'Freÿr',
              coordinates: { lat: 50.2321, lng: 4.9234 },
              type: 'highlight',
              description: 'Kasteel en rotsklimgebied',
            },
          ],
        },
      ],
    },
  ];

  // Update each zone
  for (const update of updates) {
    // Find both published and draft versions
    const publishedZone = zones.find((z: any) => !z._id.startsWith('drafts.') && z.title === update.zoneTitle);
    const draftZone = zones.find((z: any) => z._id.startsWith('drafts.') && z.title === update.zoneTitle);
    
    if (!publishedZone && !draftZone) {
      console.log(`⚠️  Zone not found: ${update.zoneTitle}`);
      continue;
    }

    const zonesToUpdate = [publishedZone, draftZone].filter(Boolean);

    for (const zone of zonesToUpdate) {
      console.log(`\n📍 Updating ${zone.title} (${zone._id.startsWith('drafts.') ? 'DRAFT' : 'PUBLISHED'})...`);

    // Get existing routeTips and add locations to them
    const existingRouteTips = zone.routeTips || [];
    
    const updatedRouteTips = existingRouteTips.map((tip: any, index: number) => {
      const matchingUpdate = update.routeTips.find((u) => u.name === tip.name);
      
      if (matchingUpdate) {
        console.log(`  ✅ Adding ${matchingUpdate.locations.length} locations to "${tip.name}"`);
        return {
          ...tip,
          color: matchingUpdate.color,
          locations: matchingUpdate.locations,
        };
      }
      
      return tip;
    });

    try {
      await sanityClient
        .patch(zone._id)
        .set({ routeTips: updatedRouteTips })
        .commit();
      
      console.log(`  ✓ Updated ${zone.title}`);
    } catch (error) {
      console.error(`  ✗ Error updating ${zone.title}:`, error);
    }
    }
  }

  console.log('\n✅ All zones updated with route tip locations!');
}

addRouteTipLocations().catch(console.error);
