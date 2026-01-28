import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

// Helper function to create portable text blocks
function createPortableText(text: string) {
  // Split by paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map(paragraph => ({
    _type: 'block',
    _key: Math.random().toString(36).substring(7),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).substring(7),
        text: paragraph.trim(),
        marks: [],
      },
    ],
    markDefs: [],
  }));
}

async function populateEventStory() {
  console.log('Fetching active edition...');
  
  const edition = await client.fetch(`*[_type == "edition" && isActive == true][0] { _id, title }`);
  
  if (!edition) {
    console.error('No active edition found!');
    return;
  }

  console.log(`Found edition: ${edition.title}`);

  // Delete existing stories for this edition
  const existingStories = await client.fetch(
    `*[_type == "eventStory" && references($editionId)]._id`,
    { editionId: edition._id }
  );

  if (existingStories.length > 0) {
    console.log(`Deleting ${existingStories.length} existing stories...`);
    for (const id of existingStories) {
      await client.delete(id);
    }
  }

  const stories = [
    {
      _type: 'eventStory',
      title: 'De Filosofie van Deur Den Bocht',
      subtitle: 'Meer dan een rit – een queeste',
      content: createPortableText(`Deur Den Bocht is niet zomaar een rally. Het is een uitnodiging om de vertrouwde routes te verlaten en het onbekende op te zoeken. Elke bocht die je neemt, elke afslag die je kiest, brengt je dichter bij wat motorrijden werkelijk betekent: vrijheid, avontuur en de pure vreugde van het moment.

In een wereld waar GPS ons door elke straat leidt en snelwegen ons van A naar B brengen, daagt Deur Den Bocht je uit om weer écht te navigeren. Om te voelen, te beslissen, en soms ook te verdwalen. Want juist in die momenten van twijfel en herontdekking, vind je de mooiste wegen.

Dit event viert de essentie van motorrijden: niet het snelst aankomen, maar de rijkste ervaring hebben. Het draait om ritme, niet om race. Om het landschap dat aan je voorbijtrekt, om de stilte tussen twee bochten, en om het gezelschap van medeavonturiers die dezelfde passie delen.`),
      highlights: [
        { number: '400+', label: 'kilometers' },
        { number: '8', label: 'rally zones' },
        { number: '1', label: 'dag avontuur' },
        { number: '∞', label: 'verhalen' },
      ],
      edition: {
        _type: 'reference',
        _ref: edition._id,
      },
      order: 0,
    },
    {
      _type: 'eventStory',
      title: 'Hoe het werkt',
      subtitle: 'Navigeer, ontdek, en verzamel punten',
      content: createPortableText(`De route is je canvas, de rally zones zijn je uitdagingen. Je start met een roadbook – geen digitale instructies, maar een klassiek boekje dat je door België leidt. Onderweg kom je 8 rally zones tegen, elk met hun eigen karakter en uitdaging.

Sommige zones zijn korte verleidingen: 5 tot 8 kilometer omwegen die je lokken met één mysterieus checkpoint. Andere zijn beslissers: 15 tot 25 kilometer met twee checkpoints die je strategie testen. En dan zijn er de grote omwegen: 30 tot 45 kilometer met drie checkpoints voor de échte avonturiers.

Bij elk checkpoint zoek je naar een locatie, een monument, een brug, of een vergeten kapel. Vind de aanwijzing, noteer de code, en verzamel punten. Maar let op: tijd is ook een factor. Je ritme, je overzicht, en zelfs de schaduw die je motor werpt worden beoordeeld door ons unieke puntensysteem.

Het is puzzelen, navigeren, en genieten tegelijk. En aan het einde van de dag? Dan weet je dat je meer dan alleen kilometers hebt gereden.`),
      highlights: [
        { number: '12-35', label: 'punten per zone' },
        { number: '3', label: 'types zones' },
        { number: '1-3', label: 'checkpoints per zone' },
      ],
      edition: {
        _type: 'reference',
        _ref: edition._id,
      },
      order: 1,
    },
  ];

  console.log(`Creating ${stories.length} event stories...`);

  for (const story of stories) {
    const result = await client.create(story);
    console.log(`✓ Created: ${story.title} (${result._id})`);
  }

  console.log('\n✓ All event stories created successfully!');
}

populateEventStory().catch(console.error);
