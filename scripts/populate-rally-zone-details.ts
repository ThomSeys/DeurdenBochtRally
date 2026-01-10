import dotenv from 'dotenv';
import { createClient } from '@sanity/client';

// Load environment variables from apps/web/.env.local
dotenv.config({ path: 'apps/web/.env.local' });

// Create a Sanity client with write permissions
const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Rally zone detailed data based on the original hardcoded zones
const rallyZoneDetails = [
  {
    title: 'RZ1 – De Scheldemeander',
    location: 'Vlaamse Ardennen – ±12 km',
    exit: 'Bordje RZ1 → Schelde bij een kleine brug langs de hoofdroute.',
    lus: 'Volg de rivier. Rij onder de spoorbrug. Neem de eerste verharde weg links. Blijf het water volgen tot je een kleine voetbrug ziet.',
    checkpoint: 'Voetbrug over de Schelde.',
    codeHint: 'Woord op het brugbord',
    rejoin: 'Rij omhoog tot je weer de grote baan kruist.',
    points: 15,
  },
  {
    title: 'RZ2 – Het Domein van Henegouwen',
    location: "'s-Gravenbrakel – ±10 km",
    exit: 'Bordje RZ2 → Domaine',
    lus: 'Volg de oprijlaan tussen stenen pilaren. Rij tot het kasteel zichtbaar wordt.',
    checkpoint: 'Naambord van het domein.',
    codeHint: 'Naam van het domein',
    rejoin: 'Rijd door tot je weer asfalt ziet.',
    points: 15,
  },
  {
    title: 'RZ3 – De Samberoversteek',
    location: 'Charleroi – Thuin – ±14 km',
    exit: 'Bordje RZ3 → Samber',
    lus: 'Volg de rivier stroomopwaarts. Houd het water rechts. Zoek een metalen brug.',
    checkpoint: 'De brug.',
    codeHint: 'Jaartal of brugnaam',
    rejoin: 'Steek over en volg de klim.',
    points: 15,
  },
  {
    title: 'RZ4 – De Maasbocht',
    location: 'Dinant – ±8 km',
    exit: 'Bordje RZ4 → Panorama',
    lus: 'Klim omhoog via haarspelden. Zoek een parking met uitzicht.',
    checkpoint: 'Panoramabord.',
    codeHint: 'Woord op het bord',
    rejoin: 'Rij omlaag tot je weer de Maas ziet.',
    points: 15,
  },
  {
    title: 'RZ5 – De Franse Ardennenlus',
    location: 'Revin – ±20 km',
    exit: 'Bordje RZ5 → Colline',
    lus: 'Volg de weg omhoog. Houd links aan. Rij tot een dorp met café.',
    checkpoint: 'Het café.',
    codeHint: 'Naam van het café',
    rejoin: 'Volg de afdaling naar de hoofdweg.',
    points: 15,
  },
  {
    title: 'RZ6 – De Semoiskronkel',
    location: 'Bouillon – ±12 km',
    exit: 'Bordje RZ6 → Semois',
    lus: 'Volg de rivier. Steek over bij de eerste brug. Klim omhoog tot een rivierbord.',
    checkpoint: 'Het bord.',
    codeHint: 'Naam',
    rejoin: 'Volg de afdaling.',
    points: 15,
  },
  {
    title: 'RZ7 – Het Plateau van Vielsalm',
    location: '±10 km',
    exit: 'Bordje RZ7 → Plateau',
    lus: 'Volg de klim tot een open uitzichtpunt.',
    checkpoint: 'Infobord.',
    codeHint: 'Woord of jaartal',
    rejoin: 'Daal af naar de hoofdroute.',
    points: 15,
  },
  {
    title: 'RZ8 – De Laatste Klim',
    location: 'Baraque de Fraiture – ±8 km',
    exit: 'Bordje RZ8 → Sommet',
    lus: 'Volg de alternatieve klim. Zoek het hoogste punt.',
    checkpoint: 'Hoogtebord.',
    codeHint: 'Meters',
    rejoin: 'Je rijdt rechtstreeks de finish binnen.',
    points: 15,
  },
];

async function populateRallyZoneDetails() {
  console.log('Populating rally zone details...\n');

  try {
    // Fetch all rally zones
    const zones = await client.fetch<Array<{ _id: string; title: string }>>(
      '*[_type == "rallyZone"] | order(order asc) { _id, title }'
    );

    console.log(`Found ${zones.length} rally zones\n`);

    // Match zones by title and update with details
    for (const zone of zones) {
      const details = rallyZoneDetails.find(
        (detail) => detail.title === zone.title
      );

      if (details) {
        console.log(`Updating zone: ${zone.title}`);

        await client
          .patch(zone._id)
          .set({
            location: details.location,
            exit: details.exit,
            lus: details.lus,
            checkpoint: details.checkpoint,
            codeHint: details.codeHint,
            rejoin: details.rejoin,
            points: details.points,
          })
          .commit();

        console.log(`✓ Updated ${zone.title}\n`);
      } else {
        console.log(
          `⚠️  No matching details found for: ${zone.title} - skipping\n`
        );
      }
    }

    console.log('✅ All rally zones updated successfully!');
  } catch (error) {
    console.error('Error updating rally zones:', error);
    process.exit(1);
  }
}

populateRallyZoneDetails();
