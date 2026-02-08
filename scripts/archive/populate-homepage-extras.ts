import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the web app directory
dotenv.config({ path: path.join(process.cwd(), 'apps/web/.env') });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function main() {
  console.log('🚀 Adding remaining homepage content...\n');

  // Get active edition
  const editions = await client.fetch(`*[_type == "edition" && isActive == true][0]`);
  if (!editions) {
    console.error('❌ No active edition found!');
    process.exit(1);
  }
  
  console.log(`✓ Found active edition: ${editions._id}\n`);

  // Hero quote section
  const heroQuoteContent = {
    _type: 'pageContent',
    page: 'homepage',
    section: 'hero-quote',
    title: 'Altijd via de omweg.',
    content: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: '✓ Geen snelweg\n✓ Geen GPS-pijltjes\n✓ Geen stress\n= Pure rijvreugde',
            marks: ['strong'],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 4,
    edition: {
      _type: 'reference',
      _ref: editions._id,
    },
  };

  // Rally zone card 1
  const rallyZoneCard = {
    _type: 'pageContent',
    page: 'homepage',
    section: 'rally-zones-card',
    title: '8 Rally Zones',
    content: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Optionele lusjes van de hoofdroute. Volg de beschrijving, vind het checkpunt, noteer de code.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 5,
    edition: {
      _type: 'reference',
      _ref: editions._id,
    },
  };

  // Points card
  const pointsCard = {
    _type: 'pageContent',
    page: 'homepage',
    section: 'points-card',
    title: 'Punten verdienen',
    content: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Elke zone = 15 punten. Alle 8 = +20 bonus. Wie het best scoort wordt "Deur den Bocht Champion"!',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 6,
    edition: {
      _type: 'reference',
      _ref: editions._id,
    },
  };

  // Final CTA
  const finalCTA = {
    _type: 'pageContent',
    page: 'homepage',
    section: 'final-cta',
    title: 'KLAAR VOOR HET AVONTUUR?',
    content: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Schrijf je nu in en zorg dat je erbij bent!',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 7,
    edition: {
      _type: 'reference',
      _ref: editions._id,
    },
  };

  // Sponsors intro
  const sponsorsIntro = {
    _type: 'pageContent',
    page: 'homepage',
    section: 'sponsors-intro',
    title: 'ONZE SPONSORS',
    content: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Dit evenement wordt mede mogelijk gemaakt door:',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 8,
    edition: {
      _type: 'reference',
      _ref: editions._id,
    },
  };

  // Sponsors CTA
  const sponsorsCTA = {
    _type: 'pageContent',
    page: 'homepage',
    section: 'sponsors-cta',
    title: 'Interesse om sponsor te worden?',
    content: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Neem contact met ons op via info@deurdenbocht.be',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 9,
    edition: {
      _type: 'reference',
      _ref: editions._id,
    },
  };

  const allContent = [
    heroQuoteContent,
    rallyZoneCard,
    pointsCard,
    finalCTA,
    sponsorsIntro,
    sponsorsCTA,
  ];

  console.log('📄 Creating additional homepage content...');
  for (const content of allContent) {
    try {
      await client.create(content);
      console.log(`  ✓ Created: ${content.section}`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${content.section}:`, error);
    }
  }

  console.log('\n✅ All additional homepage content created!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
