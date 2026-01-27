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

// Get the active edition ID
async function getActiveEditionId() {
  const editions = await client.fetch(
    '*[_type == "edition" && isActive == true] | order(_createdAt desc)[0]{ _id }'
  );
  return editions?._id;
}

// Schedule items data
const scheduleItems = [
  {
    time: '06:30 - 08:00',
    title: 'Start bij Café Den Belami',
    description: 'Bij aankomst ontvang je je startnummer, ontbijt en alle materialen voor de dag.',
    icon: '🌅',
    color: 'primary',
    details: [
      'Inschrijving & polsbandje',
      'Ontbijt (koffie, koffiekoek, fruitsap)',
      'Bochtenboek',
      'QR-code naar GPX-route, Google Maps backup, WhatsApp groep',
      'Rallykaart',
    ],
    order: 1,
  },
  {
    time: '11:30 - 14:30',
    title: 'Lunch (optioneel)',
    description: 'Tussen 11:30 en 14:30 in de Ardennen. Met polsbandje krijg je een vast gerecht + drankje.',
    icon: '🍽',
    color: 'blue',
    details: [],
    order: 2,
  },
  {
    time: '17:00 - 20:30',
    title: 'Finish bij Baraque de Fraiture',
    description: 'Aankomst op het hoogste punt van België. Parking, bar, eten en verhalen delen.',
    icon: '🏁',
    color: 'green',
    details: [],
    order: 3,
  },
  {
    time: '21:00',
    title: 'Den Bochtenkoning',
    description: 'De rallykaarten worden nagekeken, de punten geteld, en we kronen DEN BOCHTENKONING van Deur den Bocht.',
    icon: '🏆',
    color: 'yellow',
    details: [],
    order: 4,
  },
];

// Benefit items data
const benefitItems = [
  {
    title: 'Deur den Bocht – editie-sticker',
    description: 'Deur den Bocht – editie-sticker',
    icon: '✓',
    category: 'everyone',
    order: 1,
  },
  {
    title: 'Digitale persoonlijke Rallykaart',
    description: 'Digitale persoonlijke Rallykaart',
    icon: '✓',
    category: 'everyone',
    order: 2,
  },
  {
    title: 'Toegang tot fotoalbum',
    description: 'Toegang tot fotoalbum',
    icon: '✓',
    category: 'everyone',
    order: 3,
  },
  {
    title: 'Bochtenboek met alle rally zones',
    description: 'Bochtenboek met alle rally zones',
    icon: '✓',
    category: 'everyone',
    order: 4,
  },
  {
    title: 'Den Bochtenkoning-trofee',
    description: 'Den Bochtenkoning-trofee',
    icon: '🏆',
    category: 'winner',
    order: 1,
  },
  {
    title: 'Speciale winnaar sticker',
    description: 'Speciale winnaar sticker',
    icon: '🏆',
    category: 'winner',
    order: 2,
  },
  {
    title: 'Plaats op de Wall of Fame',
    description: 'Plaats op de Wall of Fame',
    icon: '🏆',
    category: 'winner',
    order: 3,
  },
];

// FAQ items data
const faqItems = [
  {
    question: 'Noodnummer via QR',
    answer: 'Bij de start ontvang je een QR-code met directe toegang tot het noodnummer.',
    category: 'safety',
    icon: '📱',
    order: 1,
  },
  {
    question: 'WhatsApp groep',
    answer: 'Enkel voor noodgevallen en belangrijke updates onderweg.',
    category: 'safety',
    icon: '💬',
    order: 2,
  },
  {
    question: 'Eigen risico',
    answer: 'Deelname volledig op eigen risico. Zorg voor goede verzekering.',
    category: 'safety',
    icon: '⚠️',
    order: 3,
  },
  {
    question: 'Geen snelheid, geen tijdsklassement',
    answer: 'Dit is géén race. Rijd veilig, geniet van de route en het avontuur.',
    category: 'safety',
    icon: '🚫',
    order: 4,
  },
  {
    question: 'Overdraagbaar',
    answer: 'Je inschrijving is overdraagbaar aan iemand anders. Stuur ons gewoon even een bericht met de nieuwe deelnemergegevens.',
    category: 'cancellation',
    icon: '🔄',
    order: 1,
  },
  {
    question: 'Terugbetaling',
    answer: 'Terugbetaling is mogelijk tot 5 dagen voor het event. Na deze datum is geen terugbetaling meer mogelijk.',
    category: 'cancellation',
    icon: '🔄',
    order: 2,
  },
  {
    question: 'Voorinschrijving verplicht',
    answer: 'Geen voorinschrijving = geen startnummer, geen ontbijt, geen rallykaart',
    category: 'important',
    icon: '⚡',
    order: 1,
  },
  {
    question: 'Beperkte plaatsen',
    answer: 'Vol = vol. Inschrijving sluit wanneer alle plaatsen vol zijn of uiterlijk 48 uur voor het event',
    category: 'important',
    icon: '⚡',
    order: 2,
  },
  {
    question: 'Geldig rijbewijs en verzekering',
    answer: 'Verplicht voor deelname',
    category: 'important',
    icon: '⚡',
    order: 3,
  },
  {
    question: 'Motor in goede staat',
    answer: 'Controleer je motor voor vertrek',
    category: 'important',
    icon: '⚡',
    order: 4,
  },
];

// Page content data
const pageContent = [
  {
    page: 'homepage',
    section: 'what-is-it',
    title: 'WAT IS DEUR DEN BOCHT?',
    content: [
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Een motordag zoals geen ander. Geen race. Geen tijdsdruk. Gewoon pure vrijheid op twee wielen.' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Vertrek samen met tientallen andere motorrijders vanuit café Belami in Aalter, en rijd via een speciaal uitgestippelde route van 500+ kilometer door België, Noord-Frankrijk en de Ardennen.' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Onderweg kan je 8 optionele Rally Zones rijden: korte lusjes met een unieke uitdaging. Verzamel codes, verdien punten, en maak kans op de titel "Den Bochtenkoning"!' }
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 1,
  },
  {
    page: 'homepage',
    section: 'rally-intro',
    title: 'HET BOCHTENBOEK & DE RALLY',
    content: [
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Je hoeft niets te doen. Gewoon rijden is al fantastisch. Maar wie een uitdaging wil, kan onderweg deelnemen aan de rally!' }
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 1,
  },
  {
    page: 'rally',
    section: 'how-it-works-intro',
    title: 'Hoe werkt een Rally Zone?',
    content: [
      {
        _type: 'block',
        children: [
          { _type: 'span', text: '1. Je rijdt op de GPX tot je een RZ-bordje ziet' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: '2. Daar verlaat je de route' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: '3. Je volgt een beschrijving in je Bochtenboek' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: '4. Je bereikt een checkpunt' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: '5. Je noteert een codewoord' }
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        children: [
          { _type: 'span', text: '6. Je rijdt verder tot je automatisch terug op de GPX zit' }
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    order: 1,
  },
];

async function populateContent() {
  console.log('🚀 Starting content population...\n');

  try {
    const editionId = await getActiveEditionId();
    
    if (!editionId) {
      console.error('❌ No active edition found. Please create an edition first.');
      process.exit(1);
    }

    console.log(`✓ Found active edition: ${editionId}\n`);

    // Create schedule items
    console.log('📅 Creating schedule items...');
    for (const item of scheduleItems) {
      const doc = {
        _type: 'scheduleItem',
        ...item,
        edition: { _type: 'reference', _ref: editionId },
      };
      const result = await client.create(doc);
      console.log(`  ✓ Created: ${item.title}`);
    }

    // Create benefit items
    console.log('\n🎁 Creating benefit items...');
    for (const item of benefitItems) {
      const doc = {
        _type: 'benefitItem',
        ...item,
        edition: { _type: 'reference', _ref: editionId },
      };
      const result = await client.create(doc);
      console.log(`  ✓ Created: ${item.title}`);
    }

    // Create FAQ items
    console.log('\n❓ Creating FAQ items...');
    for (const item of faqItems) {
      const doc = {
        _type: 'faqItem',
        ...item,
        edition: { _type: 'reference', _ref: editionId },
      };
      const result = await client.create(doc);
      console.log(`  ✓ Created: ${item.question}`);
    }

    // Create page content
    console.log('\n📄 Creating page content...');
    for (const item of pageContent) {
      const doc = {
        _type: 'pageContent',
        ...item,
        edition: { _type: 'reference', _ref: editionId },
      };
      const result = await client.create(doc);
      console.log(`  ✓ Created: ${item.page} - ${item.section}`);
    }

    console.log('\n✅ All content populated successfully!');
  } catch (error) {
    console.error('❌ Error populating content:', error);
    process.exit(1);
  }
}

populateContent();
