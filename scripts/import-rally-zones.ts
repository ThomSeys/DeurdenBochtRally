import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const rallyZones = [
  {
    _type: 'rallyZone',
    title: 'RZ1 – De Scheldemeander',
    description: 'Vlaamse Ardennen – ±12 km\n\nVolg de rivier bij een kleine brug langs de hoofdroute. Rij onder de spoorbrug. Neem de eerste verharde weg links. Blijf het water volgen tot je een kleine voetbrug ziet.\n\nCheckpunt: Voetbrug over de Schelde. Code: woord op het brugbord.',
    order: 0,
  },
  {
    _type: 'rallyZone',
    title: 'RZ2 – Het Domein van Henegouwen',
    description: '\'s-Gravenbrakel – ±10 km\n\nVolg de oprijlaan tussen stenen pilaren. Rij tot het kasteel zichtbaar wordt.\n\nCheckpunt: Naambord van het domein. Code: naam van het domein.',
    order: 1,
  },
  {
    _type: 'rallyZone',
    title: 'RZ3 – De Samberoversteek',
    description: 'Charleroi – Thuin – ±14 km\n\nVolg de rivier stroomopwaarts. Houd het water rechts. Zoek een metalen brug.\n\nCheckpunt: De brug. Code: jaartal of brugnaam.',
    order: 2,
  },
  {
    _type: 'rallyZone',
    title: 'RZ4 – De Maasbocht',
    description: 'Dinant – ±8 km\n\nKlim omhoog via haarspelden. Zoek een parking met uitzicht.\n\nCheckpunt: Panoramabord. Code: woord op het bord.',
    order: 3,
  },
  {
    _type: 'rallyZone',
    title: 'RZ5 – De Franse Ardennenlus',
    description: 'Revin – ±20 km\n\nVolg de weg omhoog. Houd links aan. Rij tot een dorp met café.\n\nCheckpunt: Het café. Code: naam van het café.',
    order: 4,
  },
  {
    _type: 'rallyZone',
    title: 'RZ6 – De Semoiskronkel',
    description: 'Bouillon – ±12 km\n\nVolg de rivier. Steek over bij de eerste brug. Klim omhoog tot een rivierbord.\n\nCheckpunt: Het bord. Code: naam.',
    order: 5,
  },
  {
    _type: 'rallyZone',
    title: 'RZ7 – Het Plateau van Vielsalm',
    description: '±10 km\n\nVolg de klim tot een open uitzichtpunt.\n\nCheckpunt: Infobord. Code: woord of jaartal.',
    order: 6,
  },
  {
    _type: 'rallyZone',
    title: 'RZ8 – De Laatste Klim',
    description: 'Baraque de Fraiture – ±8 km\n\nCheckpunt: Hoogste punt van België. Code: woord op het bordje.',
    order: 7,
  },
];

async function importRallyZones() {
  console.log('🗺️  Importing Rally Zones to Sanity...\n');

  try {
    for (const zone of rallyZones) {
      await client.create(zone);
      console.log(`  ✓ ${zone.title}`);
    }

    console.log('\n✅ All Rally Zones imported!\n');
    console.log('📝 Next: Visit https://deurdenbochtrally.sanity.studio');
    console.log('   to upload images for each zone!\n');
  } catch (error) {
    console.error('❌ Error importing rally zones:', error);
    process.exit(1);
  }
}

importRallyZones();
