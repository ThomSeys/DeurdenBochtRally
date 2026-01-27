/**
 * Complete Sanity Setup
 * Creates ALL content types with realistic sample data for a full working site
 */

import { sanityClient } from './00-config';

async function completeSetup() {
  console.log('🚀 Complete Sanity Setup - Creating ALL content...\n');

  // Step 1: Create Edition
  console.log('📅 Creating Edition...');
  const edition = await sanityClient.createOrReplace({
    _type: 'edition',
    _id: 'edition-2026',
    year: 2026,
    name: 'Bochtenkoning Rally 2026',
    slug: { current: '2026' },
    isActive: true,
    eventDate: '2026-08-08',
    registrationOpen: true,
    registrationOpenDate: '2026-01-27T00:00:00Z',
    registrationCloseDate: '2026-08-01T23:59:59Z',
    maxParticipants: 100,
    currentParticipants: 0,
  });
  console.log(`   ✓ ${edition.name}\n`);

  // Step 2: Create Site Config
  console.log('⚙️  Creating Site Configuration...');
  const siteConfig = await sanityClient.createOrReplace({
    _type: 'siteConfig',
    _id: 'siteConfig',
    eventName: 'Bochtenkoning Rally 2026',
    eventDate: '2026-08-08',
    eventLocation: 'Start: Café Den Belami | Finish: Baraque de Fraiture',
    startLocation: { lat: 51.0935, lng: 3.4417 },
    eventTagline: 'Community-gerichte motorrit rally door de mooiste wegen van België',
    contactEmail: 'info@deur-den-bocht.be',
    contactWhatsapp: '+32 470 12 34 56',
    contactLocation: 'Café Den Belami, Oost-Vlaanderen',
    socialFacebook: 'https://facebook.com/bochtenkoning',
    socialInstagram: 'https://instagram.com/bochtenkoning',
    seoTitle: 'Bochtenkoning Rally 2026 - Motorrit door de Ardennen',
    seoDescription: 'Community-gerichte motorrit van 350-450km door de mooiste wegen van België. Keuze tussen Adventure Track met rally zones of Complete Route cruise mode.',
    noIndex: false,
    noFollow: false,
    edition: { _type: 'reference', _ref: edition._id },
  });
  console.log(`   ✓ Site configuration created\n`);

  // Step 3: Create Sponsors
  console.log('🏢 Creating Sponsors...');
  const sponsors = [
    { 
      name: 'Hoofdsponsor', 
      website: 'https://example.com/hoofdsponsor',
      order: 0,
      edition: { _type: 'reference', _ref: edition._id },
    },
    { 
      name: 'Motor Garage Aalter', 
      website: 'https://example.com/motorgarage',
      order: 1,
      edition: { _type: 'reference', _ref: edition._id },
    },
    { 
      name: 'Café Belami', 
      website: 'https://example.com/cafebelami',
      order: 2,
      edition: { _type: 'reference', _ref: edition._id },
    },
  ];
  for (const sponsor of sponsors) {
    await sanityClient.create({ _type: 'sponsor', ...sponsor });
  }
  console.log(`   ✓ ${sponsors.length} sponsors created (⚠️  Upload logos in Studio)\n`);

  // Step 4: Create Stats
  console.log('📊 Creating Stats...');
  const stats = [
    { 
      label: 'Kilometers', 
      value: '350-450', 
      icon: '🏍️', 
      order: 0,
      edition: { _type: 'reference', _ref: edition._id },
    },
    { 
      label: 'Rally Zones', 
      value: 'Meerdere', 
      icon: '🗺️', 
      order: 1,
      edition: { _type: 'reference', _ref: edition._id },
    },
    { 
      label: 'Max Deelnemers', 
      value: '50-100', 
      icon: '👥', 
      order: 2,
      edition: { _type: 'reference', _ref: edition._id },
    },
    { 
      label: 'Bochten', 
      value: '1000+', 
      icon: '🌀', 
      order: 3,
      edition: { _type: 'reference', _ref: edition._id },
    },
  ];
  for (const stat of stats) {
    await sanityClient.create({ _type: 'stat', ...stat });
  }
  console.log(`   ✓ ${stats.length} stats created\n`);

  // Step 5: Create Pricing Tiers
  console.log('💰 Creating Pricing Tiers...');
  const pricingTiers = [
    {
      name: 'Met maaltijden',
      price: 25,
      icon: '🍽️',
      features: ['Ontbijt', 'Avondmaal', 'Rally Book', 'GPX Route', 'Finisher Certificate'],
      highlighted: true,
      order: 0,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      name: 'Alleen ontbijt',
      price: 20,
      icon: '☕',
      features: ['Ontbijt', 'Rally Book', 'GPX Route', 'Finisher Certificate'],
      highlighted: false,
      order: 1,
      edition: { _type: 'reference', _ref: edition._id },
    },
  ];
  for (const tier of pricingTiers) {
    await sanityClient.create({ _type: 'pricingTier', ...tier });
  }
  console.log(`   ✓ ${pricingTiers.length} pricing tiers created\n`);

  // Step 6: Create Schedule Items
  console.log('📅 Creating Schedule...');
  const scheduleItems = [
    {
      time: '06:30',
      title: 'Check-in Start',
      description: 'Aankomst Café Den Belami, QR code scannen, pakketjes ontvangen',
      icon: '✅',
      order: 0,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '06:30-08:00',
      title: 'Ontbijt',
      description: 'Koffie, thee en ontbijt voor deelnemers',
      icon: '☕',
      order: 1,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '07:30',
      title: 'Safety Briefing',
      description: 'Uitleg event, veiligheid, noodprocedures en rally zones',
      icon: '🛡️',
      order: 2,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '07:45',
      title: 'Groepsfoto',
      description: 'Alle deelnemers samen voor de start',
      icon: '📸',
      order: 3,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '08:00',
      title: 'Rally Start',
      description: 'Start van de rit - Adventure Track of Complete Route',
      icon: '🏁',
      order: 4,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '11:30-14:30',
      title: 'Lunch Optie',
      description: 'Tussenstop in de Ardennen (All-in pakket)',
      icon: '🍔',
      order: 5,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '17:00',
      title: 'Finish Baraque de Fraiture',
      description: 'Aankomst op hoogste punt van België',
      icon: '🏔️',
      order: 6,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '17:00-20:30',
      title: 'Avondeten & Napraten',
      description: 'Eten, drinken en verhalen uitwisselen',
      icon: '🍽️',
      order: 7,
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      time: '21:00',
      title: 'Community Time',
      description: 'Verhalen presentaties, foto gallery showcase',
      icon: '🎉',
      order: 8,
      edition: { _type: 'reference', _ref: edition._id },
    },
  ];
  for (const item of scheduleItems) {
    await sanityClient.create({ _type: 'scheduleItem', ...item });
  }
  console.log(`   ✓ ${scheduleItems.length} schedule items created\n`);

  // Step 7: Create FAQ Items
  console.log('❓ Creating FAQ Items...');
  const faqItems = [
    {
      question: 'Wat is de Bochtenkoning Rally?',
      answer: 'Een community-gerichte motorrit van 350-450km door de mooiste wegen van België. Het is geen race of competitie, maar een viering van het motorrijden en de gemeenschap. Start in Café Den Belami, finish bij Baraque de Fraiture (hoogste punt van België).',
      category: 'general',
      icon: '🏍️',
      order: 0,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Wat zijn de twee route formules?',
      answer: 'Je kunt kiezen tussen Adventure Track (met rally zones en routetips waar je doorheen navigeert) of Complete Route (cruise mode met één doorlopende GPX zonder checkpoints). Beide formules geven volledige vrijheid.',
      category: 'rally',
      icon: '🗺️',
      order: 1,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Moet ik alle rally zones doen?',
      answer: 'Nee! Bij Adventure Track zijn alle rally zones volledig optioneel. Je kiest zelf welke zones je wilt verkennen. Bij Complete Route volg je gewoon de hoofdroute. Er is geen tijdsdruk of verplichting.',
      category: 'rally',
      icon: '🎯',
      order: 2,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Wat is het verschil tussen de prijsformules?',
      answer: 'Basisdeelname (€15) geeft je toegang tot alles zonder maaltijden. All-in Pakket (€25) bevat ontbijt, lunch optie onderweg, en avondeten bij de finish. Beide geven volledige toegang tot rally zones en app.',
      category: 'general',
      icon: '💰',
      order: 3,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Kan ik solo rijden of moet ik in groep?',
      answer: 'Beide zijn mogelijk! Je mag volledig solo rijden op je eigen tempo, of je kunt aansluiten bij een begeleide groep. De keuze is aan jou.',
      category: 'safety',
      icon: '👤',
      order: 4,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Welke vereisten zijn er voor deelname?',
      answer: 'Je hebt nodig: geldig rijbewijs (A categorie), geldige motorverzekering, motor in goede technische staat, en helm + beschermende kledij (verplicht). Minimum leeftijd is 18 jaar.',
      category: 'safety',
      icon: '📋',
      order: 5,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Hoe werkt het check-in systeem?',
      answer: 'Bij aankomst scan je je persoonlijke QR code voor check-in. Bij Adventure Track kun je optioneel ook QR codes bij rally zones scannen om je voortgang te volgen via de app.',
      category: 'rally',
      icon: '📱',
      order: 6,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Wat als ik pech krijg of hulp nodig heb?',
      answer: 'We hebben een Emergency SOS knop in de app die direct je GPS-locatie naar ons stuurt. Er zijn road marshals op strategische punten en we hebben EHBO aanwezig bij start en finish.',
      category: 'safety',
      icon: '🚨',
      order: 7,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      question: 'Kan ik mijn inschrijving annuleren?',
      answer: 'Ja, terugbetaling is mogelijk tot 5 dagen voor het event. Contacteer ons via info@deur-den-bocht.be.',
      category: 'cancellation',
      icon: '↩️',
      order: 8,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
  ];
  for (const item of faqItems) {
    await sanityClient.create({ _type: 'faqItem', ...item });
  }
  console.log(`   ✓ ${faqItems.length} FAQ items created\n`);

  // Step 8: Create Benefit Items
  console.log('✨ Creating Benefits...');
  const benefitItems = [
    {
      title: 'Roadbook met Rally Zones',
      description: 'Klassiek papieren roadbook met gedetailleerde rally zones en routetips',
      icon: '📖',
      category: 'everyone',
      order: 0,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'GPX Bestanden',
      description: 'Downloadbare GPX per routetip of complete route voor je GPS navigatie',
      icon: '🗺️',
      category: 'everyone',
      order: 1,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Mobiele App',
      description: 'Live tracking, foto uploads, achievement systeem en community gallery',
      icon: '📱',
      category: 'everyone',
      order: 2,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Emergency SOS',
      description: 'One-tap noodknop met GPS tracking voor veiligheid onderweg',
      icon: '🚨',
      category: 'everyone',
      order: 3,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Community Gallery',
      description: 'Deel je foto\'s en verhalen met andere deelnemers',
      icon: '📸',
      category: 'everyone',
      order: 4,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Achievement Systeem',
      description: 'Verzamel badges en punten voor speciale prestaties tijdens de rally',
      icon: '🏅',
      category: 'everyone',
      order: 5,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Start bij Café Den Belami',
      description: 'Gezellige start locatie in Oost-Vlaanderen met ontbijt',
      icon: '☕',
      category: 'everyone',
      order: 6,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Finish op Baraque de Fraiture',
      description: 'Eindigen op het hoogste punt van België met spectaculair uitzicht',
      icon: '🏔️',
      category: 'everyone',
      order: 7,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'EHBO & Road Marshals',
      description: 'Professionele ondersteuning en veiligheid onderweg',
      icon: '🛡️',
      category: 'everyone',
      order: 8,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
    {
      title: 'Community Time',
      description: 'Verhalen delen, foto showcase en prizes voor beste bijdragen',
      icon: '🎉',
      category: 'winner',
      order: 0,
      edition: { _type: 'reference', _ref: 'edition-2026' },
    },
  ];
  for (const item of benefitItems) {
    await sanityClient.create({ _type: 'benefitItem', ...item });
  }
  console.log(`   ✓ ${benefitItems.length} benefit items created\n`);

  // Step 9: Create Page Content
  console.log('📄 Creating Page Content...');
  const pageContents = [
    // Homepage sections
    {
      page: 'homepage',
      section: 'hero',
      title: 'Bochtenkoning Rally 2026',
      order: 0,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Community-gerichte motorrit door de mooiste wegen van België. Vrijheid, avontuur en verhalen delen. 8 augustus 2026.' }],
        },
      ],
    },
    {
      page: 'homepage',
      section: 'intro',
      title: 'Wat is de Bochtenkoning Rally?',
      order: 1,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'De Bochtenkoning Rally is een community-gerichte motorrit rally door de mooiste wegen van België, met focus op vrijheid, avontuur en verhalen delen. Het is geen race of competitie, maar een viering van het motorrijden en de gemeenschap eromheen.' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '350-450 km door de Ardennen, van Café Den Belami (Oost-Vlaanderen) naar Baraque de Fraiture (hoogste punt van België). Start 06:30, finish 17:00-20:30.' }],
        },
      ],
    },
    {
      page: 'homepage',
      section: 'formulas',
      title: 'Twee Route Formules',
      order: 2,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          style: 'h3',
          children: [{ _type: 'span', text: '🗺️ Adventure Track (met Rally Zones)' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Voor avonturiers die willen navigeren en hun eigen route willen samenstellen. Meerdere rally zones met verschillende routetips (off-road, technisch, panoramisch, snelweg, binnendoor). Volledig optioneel - kies waar je zin in hebt.' }],
        },
        {
          _type: 'block',
          style: 'h3',
          children: [{ _type: 'span', text: '🛣️ Complete Route (Cruise Mode)' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Voor rijders die gewoon willen cruisen zonder druk van checkpoints. Eén doorlopende GPX route, geen verplichte stops, volledige vrijheid. Je kunt altijd nog zones bezoeken als je wilt.' }],
        },
      ],
    },
    {
      page: 'homepage',
      section: 'principles',
      title: 'Core Principles',
      order: 3,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: '✅ Keuze & Vrijheid: Deelnemers kiezen zelf hoe ze hun dag invullen' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '✅ Community First: Het gaat om verbinding, niet om winnen' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '✅ Verhalen Delen: Foto\'s en ervaringen zijn belangrijker dan punten' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '✅ Veiligheid: Veilig rijden, op eigen tempo, geen tijdsdruk' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '✅ Toegankelijkheid: Voor elk niveau en rijstijl' }],
        },
      ],
    },
    {
      page: 'homepage',
      section: 'features',
      title: 'Wat krijg je?',
      order: 4,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Klassiek roadbook (papier) met rally zones & routetips, digital GPX per tip of complete route, mobiele app met live tracking en community features, QR code check-in systeem, emergency SOS button, foto gallery en verhalen platform, achievement systeem met badges.' }],
        },
      ],
    },
    {
      page: 'homepage',
      section: 'pricing',
      title: 'Inschrijven',
      order: 5,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Basisdeelname: €15 (motor + rijder, zonder maaltijden)' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'All-in pakket: €25 (inclusief ontbijt, lunch optie, avondeten)' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Maximum 50-100 deelnemers. Annulering mogelijk tot 5 dagen voor event.' }],
        },
      ],
    },
    // About page sections
    {
      page: 'about',
      section: 'intro',
      title: 'Over Bochtenkoning Rally',
      order: 0,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'De Bochtenkoning Rally is geboren uit de overtuiging dat motorrijden draait om gemeenschap, vrijheid en de pure vreugde van de rit - niet om competitie of het verzamelen van punten.' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'We willen weg van het traditionele rally concept waar alles draait om checkpoints en tijdsdruk. In plaats daarvan bieden we keuze: Adventure Track voor degenen die willen navigeren en ontdekken, of Complete Route voor wie gewoon wil cruisen.' }],
        },
      ],
    },
    {
      page: 'about',
      section: 'philosophy',
      title: 'Onze Filosofie',
      order: 1,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          style: 'h3',
          children: [{ _type: 'span', text: 'Van Competition naar Community' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'We geloven dat de beste rally\'s niet gaan over wie het snelst is of de meeste punten verzamelt, maar over het delen van ervaringen, het maken van herinneringen en het creëren van een community van gepassioneerde motorrijders.' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Daarom zijn alle rally zones optioneel, is er geen tijdslimiet, en geven we evenveel waarde aan een mooie foto als aan het voltooien van een zone. Iedereen is een "bocht-held" in hun eigen verhaal.' }],
        },
      ],
    },
    {
      page: 'about',
      section: 'values',
      title: 'Core Principles',
      order: 2,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: '🗝️ Keuze & Vrijheid: Deelnemers kiezen zelf hoe ze hun dag invullen - geen verplichtingen' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '🤝 Community First: Het gaat om verbinding maken, niet om winnen of verliezen' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '📸 Verhalen Delen: Foto\'s en ervaringen zijn belangrijker dan punten of rankings' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '🛡️ Veiligheid: Veilig rijden op eigen tempo zonder tijdsdruk of groepsdruk' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: '🌍 Toegankelijkheid: Voor elk niveau motorrijder, elk type motor, elke rijstijl' }],
        },
      ],
    },
    {
      page: 'about',
      section: 'organization',
      title: 'Organisatie',
      order: 3,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'De Bochtenkoning Rally wordt georganiseerd door VZW Deur Den Bocht, een groep gepassioneerde motorrijders die geloven in veilig, vrij en gemeenschapsgericht rijden.' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Ons team test elke route persoonlijk, selecteert de mooiste wegen, en zorgt voor een perfecte balans tussen uitdaging en toegankelijkheid. We hebben EHBO-ers, road marshals en een 24/7 emergency systeem om ieders veiligheid te waarborgen.' }],
        },
      ],
    },
    {
      page: 'about',
      section: 'safety',
      title: 'Veiligheid',
      order: 4,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Veiligheid staat voorop. We hebben een mandatory safety briefing om 07:30, EHBO aanwezig bij start en finish, road marshals op strategische punten, en een emergency SOS knop in de app die direct je GPS-locatie naar ons stuurt.' }],
        },
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Vereisten: geldig rijbewijs (A categorie), geldige motorverzekering, motor in goede staat, helm + beschermende kledij verplicht. Minimum leeftijd 18 jaar.' }],
        },
      ],
    },
    {
      page: 'about',
      section: 'contact',
      title: 'Contact',
      order: 5,
      edition: { _type: 'reference', _ref: 'edition-2026' },
      content: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: 'Vragen? Stuur een email naar info@deur-den-bocht.be of volg ons op sociale media voor updates en behind-the-scenes content.' }],
        },
      ],
    },
  ];
  for (const content of pageContents) {
    await sanityClient.create({ _type: 'pageContent', ...content });
  }
  console.log(`   ✓ ${pageContents.length} page content items created\n`);

  // Step 10: Create Event Story
  console.log('📖 Creating Event Story...');
  await sanityClient.createOrReplace({
    _type: 'eventStory',
    _id: 'eventStory-2026',
    title: 'Bochtenkoning Rally 2026 - Het Verhaal',
    content: [
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Een Nieuw Soort Rally' }],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'De Bochtenkoning Rally 2026 is geen traditionele rally. Het is een shift van competition naar community, van tijdsdruk naar vrijheid, van punten verzamelen naar verhalen delen.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: '8 augustus 2026. De zon komt net op als de eerste deelnemers aankomen bij Café Den Belami in Oost-Vlaanderen. 06:30 begint de check-in, QR codes worden gescand, roadbooks uitgedeeld. De geur van verse koffie hangt in de lucht terwijl motorrijders uit heel België verzamelen.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Keuze & Vrijheid' }],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Om 07:30 is de safety briefing. Geen race, geen tijdslimiet, geen verplichtin gen. Jullie bepalen zelf. Kies Adventure Track met rally zones en routetips waar je doorheen navigeert. Of kies Complete Route voor een relaxte cruise zonder checkpoints.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Om 08:00 start de rally. 350-450 kilometer door de Ardennen liggen voor je. Solo of in groep, snel of rustig, alle zones of alleen je favorieten - jij beslist.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'De Reis' }],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Rally zones bieden verschillende routetips: off-road, technisch, panoramisch, snelweg, binnendoor. Elk met zijn eigen karakter. Sommige rijders kiezen de technische routes, anderen de scenic wegen. Geen juiste keuze, alleen jouw keuze.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Tussen 11:30 en 14:30 is er een lunch optie in de Ardennen voor wie het All-in pakket heeft. Anderen rijden door of stoppen waar ze willen. Vrijheid.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Onderweg maak je foto\'s, deel je je locatie (optioneel), en zie je andere deelnemers op de live map. Een groet, een wave, misschien een korte stop samen. Community, niet competitie.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'De Finish' }],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Vanaf 17:00 beginnen rijders aan te komen bij Baraque de Fraiture, het hoogste punt van België. De finish. Vermoeide maar voldane gezichten. Motoren die nog nagloeien. Verhalen die verteld moeten worden.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Tussen 17:00 en 20:30 is er avondeten en drinken. Om 21:00 Community Time - verhalen presentaties, foto gallery showcase op groot scherm. Dit is waar de magie gebeurt. Niet op de weg, maar hier, samen.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'We eren niet de snelsten of degenen met de meeste zones. We eren de mooiste foto\'s, de beste verhalen, degenen die de spirit van de rally belichamen. Want dat is wat Bochtenkoning Rally is: niet wie, maar hoe.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Meer Dan Een Rit' }],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Als de laatste motor de parking verlaat, blijft iets achter. Nieuwe vriendschappen. Gedeelde herinneringen. Het besef dat motorrijden niet draait om winnen, maar om samen zijn.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Tot volgende keer. Ride safe, ride free, and enjoy every corner.',
          },
        ],
      },
    ],
    edition: { _type: 'reference', _ref: 'edition-2026' },
  });
  console.log('   ✓ Event story created\n');

  // Step 11: Create Event Markers
  console.log('📍 Creating Event Markers...');
  const eventMarkers = [
    {
      title: 'Water Station',
      description: 'Gratis water en sportdrank beschikbaar',
      type: 'station',
      location: { lat: 50.8503, lng: 4.3517 },
      severity: 'low',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edition: { _type: 'reference', _ref: edition._id },
    },
    {
      title: 'Photo Spot',
      description: 'Prachtig uitzichtpunt - ideaal voor groepsfoto',
      type: 'info',
      location: { lat: 50.4673, lng: 5.5102 },
      severity: 'low',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edition: { _type: 'reference', _ref: edition._id },
    },
  ];
  for (const marker of eventMarkers) {
    await sanityClient.create({ _type: 'eventMarker', ...marker });
  }
  console.log(`   ✓ ${eventMarkers.length} event markers created\n`);

  console.log('✅ Complete Sanity setup finished!');
  console.log('\n📍 Next steps:');
  console.log('   1. Run: npm run script scripts/sanity/generate-rally-zones.ts');
  console.log('   2. Upload GPX file in Sanity Studio (optional)');
  console.log('   3. Upload images for sponsors/hero in Sanity Studio');
  console.log('   4. Run: npm run script scripts/sanity/publish-all-drafts.ts\n');
}

completeSetup().catch(console.error);
