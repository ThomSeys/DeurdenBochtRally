import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function getActiveEdition() {
  const edition = await client.fetch(
    `*[_type == "edition"][0]{ _id }`
  );
  if (!edition) {
    throw new Error('No edition found. Please create an edition in Sanity Studio first.');
  }
  console.log(`Found edition: ${edition._id}`);
  return edition._id;
}

async function createFeatureCards() {
  const editionId = await getActiveEdition();
  
  const featureCards = [
    {
      _type: 'featureCard',
      title: '8 Rally Zones',
      description: 'Optionele lussen langs de route met unieke uitdagingen en verborgen parels',
      icon: 'map',
      section: 'rally-features',
      order: 1,
      edition: {
        _type: 'reference',
        _ref: editionId,
      },
    },
    {
      _type: 'featureCard',
      title: 'Het Bochtenboek',
      description: 'Geschreven aanwijzingen in plaats van GPS-pijlen. Echt navigeren, echt avontuur.',
      icon: 'book',
      section: 'rally-features',
      order: 2,
      edition: {
        _type: 'reference',
        _ref: editionId,
      },
    },
    {
      _type: 'featureCard',
      title: 'Deel je verhaal',
      description: 'Maak foto\'s, verzamel verhalen en deel je avontuur met de community',
      icon: 'camera',
      section: 'rally-features',
      order: 3,
      edition: {
        _type: 'reference',
        _ref: editionId,
      },
    },
  ];

  console.log(`Creating ${featureCards.length} feature cards for edition: ${editionId}...`);

  for (const card of featureCards) {
    try {
      const result = await client.create(card);
      console.log(`✓ Created: ${card.title} (${result._id})`);
    } catch (error) {
      console.error(`✗ Failed to create ${card.title}:`, error);
    }
  }

  console.log('\n✅ Feature cards created successfully!');
}

createFeatureCards().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
