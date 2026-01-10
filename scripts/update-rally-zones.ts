import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: 'apps/web/.env.local' });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Rally zones with solution codes and colors
const rallyZonesData = [
  {
    title: 'De Scheldemeander',
    color: 'green',
    solution: 'SCHELDE2026', // Replace with actual solution
  },
  {
    title: 'Het Domein van Henegouwen',
    color: 'yellow',
    solution: 'HENEGOUWEN2026', // Replace with actual solution
  },
  {
    title: 'De Samberoversteek',
    color: 'yellow',
    solution: 'SAMBER2026', // Replace with actual solution
  },
  {
    title: 'De Maasbocht',
    color: 'orange',
    solution: 'MAAS2026', // Replace with actual solution
  },
  {
    title: 'De Franse Ardennenlus',
    color: 'red',
    solution: 'ARDENNEN2026', // Replace with actual solution
  },
  {
    title: 'De Semoiskronkel',
    color: 'red',
    solution: 'SEMOIS2026', // Replace with actual solution
  },
  {
    title: 'Het Plateau van Vielsalm',
    color: 'yellow',
    solution: 'VIELSALM2026', // Replace with actual solution
  },
  {
    title: 'De Laatste Klim',
    color: 'green',
    solution: 'KLIM2026', // Replace with actual solution
  },
];

async function updateRallyZones() {
  console.log('Updating rally zones with solutions and colors...');

  try {
    // Fetch all rally zones
    const zones = await client.fetch(`*[_type == "rallyZone"] | order(order asc)`);

    if (zones.length === 0) {
      console.log('No rally zones found. Please create them first.');
      return;
    }

    // Update each zone
    for (let i = 0; i < zones.length && i < rallyZonesData.length; i++) {
      const zone = zones[i];
      const data = rallyZonesData[i];

      console.log(`Updating zone ${i + 1}: ${zone.title}`);

      await client
        .patch(zone._id)
        .set({
          solution: data.solution,
          color: data.color,
        })
        .commit();

      console.log(`✓ Updated ${zone.title}`);
    }

    console.log('\n✅ All rally zones updated successfully!');
    console.log('\n⚠️  IMPORTANT: Update the solution codes in this script with the actual codes!');
  } catch (error) {
    console.error('Error updating rally zones:', error);
  }
}

updateRallyZones();
