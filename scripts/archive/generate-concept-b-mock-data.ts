/**
 * Generate comprehensive mock data for Concept B Rally
 * Creates segments, Rally Zones, and test participant data
 */

import { createClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.vercel
dotenv.config({ path: path.join(process.cwd(), '.env.vercel') });

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'tp2nrvnd',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock segment data - Using real distributed GPX coordinates
// Rally zones follow a route loop from Den Bocht through scenic Flemish areas
const segments = [
  {
    title: 'Segment 1: Startpunt',
    order: 1,
    start_location: {
      name: 'Den Bocht - Café De Bocht',
      coordinates: { lat: 51.09686, lng: 3.500041 },
      landmark_description: 'Startpunt bij het legendarische café'
    },
    end_location: {
      name: 'Ronse - Grote Markt',
      coordinates: { lat: 50.76311, lng: 3.56026 },
      landmark_description: 'Bij het stadhuis en de Sint-Hermeskerk'
    },
    distance_km: 45,
    estimated_duration_minutes: 75,
    character: 'Glooiende heuvels en bochtige wegen',
    difficulty: 'moderate' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Let op: smalle wegen in de Vlaamse Ardennen. Veel verkeer mogelijk op zondag.' }]
      }
    ],
    scenic_highlights: ['Oudenaarde', 'Kluisbergen', 'Vlaamse Ardennen'],
    is_active: true
  },
  {
    title: 'Segment 2',
    order: 2,
    start_location: {
      name: 'Ronse - Grote Markt',
      coordinates: { lat: 50.76311, lng: 3.56026 },
      landmark_description: 'Bij het stadhuis en de Sint-Hermeskerk'
    },
    end_location: {
      name: 'Geraardsbergen - Muur',
      coordinates: { lat: 50.76637, lng: 3.88231 },
      landmark_description: 'Voet van de Muur van Geraardsbergen'
    },
    distance_km: 32,
    estimated_duration_minutes: 50,
    character: 'Technische bochten en hellingen',
    difficulty: 'challenging' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Uitdagende kasseienstukken. Rijd voorzichtig bij nat weer.' }]
      }
    ],
    scenic_highlights: ['Kapellenberg', 'Bosberg', 'Muur van Geraardsbergen'],
    is_active: true
  },
  {
    title: 'Segment 3',
    order: 3,
    start_location: {
      name: 'Geraardsbergen - Muur',
      coordinates: { lat: 50.76637, lng: 3.88231 },
      landmark_description: 'Voet van de Muur van Geraardsbergen'
    },
    end_location: {
      name: 'Ninove - Centrumlaan',
      coordinates: { lat: 50.82783, lng: 4.02617 },
      landmark_description: 'Centrum parkeerzone'
    },
    distance_km: 28,
    estimated_duration_minutes: 40,
    character: 'Rustige landwegen en kleine dorpjes',
    difficulty: 'easy' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Vlak terrein, ideaal om te relaxen na de vorige twee segmenten.' }]
      }
    ],
    scenic_highlights: ['Denderstreek', 'Hoppevelden'],
    is_active: true
  },
  {
    title: 'Segment 4',
    order: 4,
    start_location: {
      name: 'Ninove - Centrumlaan',
      coordinates: { lat: 50.82783, lng: 4.02617 },
      landmark_description: 'Centrum parkeerzone'
    },
    end_location: {
      name: 'Aalst - Grote Markt',
      coordinates: { lat: 50.93751, lng: 4.04089 },
      landmark_description: 'Bij het belfort'
    },
    distance_km: 22,
    estimated_duration_minutes: 35,
    character: 'Afwisselend landschap',
    difficulty: 'easy' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Meer verkeer mogelijk. Let op voor fietspaden in de stad.' }]
      }
    ],
    scenic_highlights: ['Dender', 'Aalst Centrum'],
    is_active: true
  },
  {
    title: 'Segment 5',
    order: 5,
    start_location: {
      name: 'Aalst - Grote Markt',
      coordinates: { lat: 50.93751, lng: 4.04089 },
      landmark_description: 'Bij het belfort'
    },
    end_location: {
      name: 'Dendermonde - Grote Markt',
      coordinates: { lat: 51.02644, lng: 4.10082 },
      landmark_description: 'Historisch marktplein'
    },
    distance_km: 26,
    estimated_duration_minutes: 40,
    character: 'Vlakke wegen door de regio',
    difficulty: 'easy' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Mooi uitzicht over de Dender. Ideaal voor foto\'s.' }]
      }
    ],
    scenic_highlights: ['Dender', 'Polders', 'Dendermonde Centrum'],
    is_active: true
  },
  {
    title: 'Segment 6',
    order: 6,
    start_location: {
      name: 'Dendermonde - Grote Markt',
      coordinates: { lat: 51.02644, lng: 4.10082 },
      landmark_description: 'Historisch marktplein'
    },
    end_location: {
      name: 'Lokeren - Grote Kaai',
      coordinates: { lat: 51.10347, lng: 3.99444 },
      landmark_description: 'Aan de Durme'
    },
    distance_km: 18,
    estimated_duration_minutes: 30,
    character: 'Brede wegen door de streek',
    difficulty: 'easy' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Kort segment, ideaal voor een koffiestop in Lokeren.' }]
      }
    ],
    scenic_highlights: ['Waasland', 'Durme'],
    is_active: true
  },
  {
    title: 'Segment 7',
    order: 7,
    start_location: {
      name: 'Lokeren - Grote Kaai',
      coordinates: { lat: 51.10347, lng: 3.99444 },
      landmark_description: 'Aan de Durme'
    },
    end_location: {
      name: 'Gent - Korenmarkt',
      coordinates: { lat: 51.05396, lng: 3.72139 },
      landmark_description: 'Centraal plein'
    },
    distance_km: 35,
    estimated_duration_minutes: 55,
    character: 'Culturele highlights en stadsgezichten',
    difficulty: 'moderate' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Bij aankomst in Gent: let op voor eenrichtingsverkeer en tram.' }]
      }
    ],
    scenic_highlights: ['Leie', 'Gent Centrum', 'Graslei'],
    is_active: true
  },
  {
    title: 'Segment 8: Terug naar Start',
    order: 8,
    start_location: {
      name: 'Gent - Korenmarkt',
      coordinates: { lat: 51.05396, lng: 3.72139 },
      landmark_description: 'Centraal plein'
    },
    end_location: {
      name: 'Den Bocht - Café De Bocht (Finish)',
      coordinates: { lat: 51.09686, lng: 3.500041 },
      landmark_description: 'Het legendarische café'
    },
    distance_km: 52,
    estimated_duration_minutes: 80,
    character: 'Laatste etappe terug naar de start',
    difficulty: 'moderate' as const,
    notes: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Laatste segment! Geniet van de rit terug naar de start.' }]
      }
    ],
    scenic_highlights: ['Schelde', 'Oost-Vlaanderen', 'Thuiskomst'],
    is_active: true
  }
];

// Mock Rally Zones (coordinates extracted from actual GPX files)
const rallyZones = [
  {
    title: 'Rally Zone 1: Leie Valley Loop',
    order: 1,
    character: 'Mooie lus langs de Leie',
    start_location: {
      name: 'Leie Valley Loop - Start',
      coordinates: { lat: 51.01308, lng: 3.61875 },
      landmark_description: 'Verlaat hoofdroute richting Leievallei'
    },
    end_location: {
      name: 'Leie Valley Loop - Einde',
      coordinates: { lat: 50.88479, lng: 3.58042 },
      landmark_description: 'Voeg terug bij hoofdroute na valleilus'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Welkom bij Rally Zone 1: Leie Valley Loop!' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Deze mooie lus voert je langs de Leie. Verlaat de hoofdroute en geniet van kronkelende wegen door het schilderachtige Vlaamse landschap.' }]
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Lus Uitdaging' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Voltooi de lus en voeg weer bij de hoofdroute. Geniet van het landschap en rijd veilig!' }]
      }
    ],
    guidelines: [
      'Check in bij het startpunt van de lus',
      'Volg de rally zone GPX route',
      'Voltooi het volledige circuit',
      'Check uit bij het weer invoegen op de hoofdroute',
      'Volgende bestemming: Rally Zone 2'
    ],
    estimated_duration_minutes: 45,
    difficulty: 'moderate' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 2: Ronse Heuvelzone',
    order: 2,
    character: 'Uitdagende heuvellus in de Ronse regio',
    start_location: {
      name: 'Ronse Heuvelzone - Start',
      coordinates: { lat: 50.72486, lng: 3.68384 },
      landmark_description: 'Verlaat hoofdroute voor de heuvels'
    },
    end_location: {
      name: 'Ronse Heuvelzone - Einde',
      coordinates: { lat: 50.58285, lng: 3.80251 },
      landmark_description: 'Voeg terug bij hoofdroute na heuvels'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Rally Zone 2: Ronse Heuvelzone!' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Maak je klaar voor klimwerk! Deze lus voert je door de befaamde heuvels van de Ronse regio. Uitdagende beklimmingen met prachtige uitzichten.' }]
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Heuvel Uitdaging' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Meerdere beklimmingen door de Vlaamse Ardennen. Neem je tijd, geniet van de uitdaging en van de panoramische uitzichten!' }]
      }
    ],
    guidelines: [
      'Check in bij start van de lus',
      'Volg de heuvelachtige GPX route',
      'Neem pauzes tijdens klimmen indien nodig',
      'Foto mogelijkheden bij uitzichtpunten',
      'Check uit bij terugkeer naar hoofdroute'
    ],
    estimated_duration_minutes: 60,
    difficulty: 'challenging' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 3: Tussen Schelde en Dender',
    order: 3,
    character: 'Lus tussen twee grote rivieren',
    start_location: {
      name: 'Schelde-Dender Loop - Start',
      coordinates: { lat: 50.60471, lng: 4.20145 },
      landmark_description: 'Verlaat hoofdroute tussen de rivieren'
    },
    end_location: {
      name: 'Schelde-Dender Loop - Einde',
      coordinates: { lat: 50.56327, lng: 4.23794 },
      landmark_description: 'Voeg terug bij hoofdroute na rivierlus'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Rally Zone 3: Tussen Twee Rivieren' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Deze mooie lus loopt tussen de Schelde en de Dender. Relatief vlak terrein met prachtige watergezichten.' }]
      }
    ],
    guidelines: [
      'Check in bij start van de lus',
      'Geniet van het uitzicht langs de rivier',
      'Let op fietsers op gedeelde wegen',
      'Voltooi de rivierlus',
      'Check uit bij terugkeer naar hoofdroute'
    ],
    estimated_duration_minutes: 40,
    difficulty: 'easy' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 4: Pays des Collines',
    order: 4,
    character: 'Glooiende heuvels in het Land van de Heuvels',
    start_location: {
      name: 'Pays des Collines - Start',
      coordinates: { lat: 50.42103, lng: 4.28173 },
      landmark_description: 'Verlaat hoofdroute richting de heuvels'
    },
    end_location: {
      name: 'Pays des Collines - Einde',
      coordinates: { lat: 50.22224, lng: 4.41212 },
      landmark_description: 'Voeg terug bij hoofdroute na heuvelcircuit'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Rally Zone 4: Pays des Collines' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Welkom in het "Pays des Collines" - het Land van de Heuvels. Glooiend landschap met charmante dorpjes en panoramische uitzichten over het platteland.' }]
      }
    ],
    guidelines: [
      'Check in bij toegang tot de lus',
      'Volg de mooie heuvelroute',
      'Meerdere foto mogelijkheden',
      'Dorpjes voor verversing stops',
      'Check uit na voltooien van het circuit'
    ],
    estimated_duration_minutes: 50,
    difficulty: 'moderate' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 5: Samber Valley Challenge',
    order: 5,
    character: 'Uitgebreide valleirit langs de Samber',
    start_location: {
      name: 'Samber Valley - Start',
      coordinates: { lat: 50.10595, lng: 4.66004 },
      landmark_description: 'Verlaat hoofdroute richting Sambervallei'
    },
    end_location: {
      name: 'Samber Valley - Einde',
      coordinates: { lat: 49.87992, lng: 4.904 },
      landmark_description: 'Voeg terug bij hoofdroute na valleicircuit'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Rally Zone 5: Samber Valley Challenge' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Uitgebreide valleirit langs de Samber. Dit is een van de langere rally zones met gevarieerd terrein en prachtige valleigezichten.' }]
      }
    ],
    guidelines: [
      'Check in bij vallei ingang',
      'Langste rally zone - neem je tijd',
      'Tank bij voor of tijdens deze lus',
      'Volg de valleiroute',
      'Check uit na vallei circuit'
    ],
    estimated_duration_minutes: 75,
    difficulty: 'moderate' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 6: Ardennen Panorama Route',
    order: 6,
    character: 'Spectaculaire Ardennen bergpanorama\'s',
    start_location: {
      name: 'Ardennen Panorama - Start',
      coordinates: { lat: 49.78753, lng: 5.17524 },
      landmark_description: 'Verlaat hoofdroute richting de Ardennen'
    },
    end_location: {
      name: 'Ardennen Panorama - Einde',
      coordinates: { lat: 50.13412, lng: 5.28853 },
      landmark_description: 'Voeg terug bij hoofdroute na berglus'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Rally Zone 6: Ardennen Panorama!' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'De Ardennen! Het meest spectaculaire motorterrein van België. Verwacht kronkelende wegen, hoogteverschillen en adembenemende bergpanorama\'s.' }]
      }
    ],
    guidelines: [
      'Check in bij Ardennen toegang',
      'Bergrijden - wees voorbereid',
      'Spectaculaire foto locaties',
      'Let op wild en fietsers',
      'Check uit na bergcircuit'
    ],
    estimated_duration_minutes: 70,
    difficulty: 'challenging' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 7: Vallei van de Ourthe',
    order: 7,
    character: 'Prachtige Ourthe riviervallei route',
    start_location: {
      name: 'Ourthe Valley - Start',
      coordinates: { lat: 50.13375, lng: 5.53609 },
      landmark_description: 'Verlaat hoofdroute richting Ourthevallei'
    },
    end_location: {
      name: 'Ourthe Valley - Einde',
      coordinates: { lat: 50.12837, lng: 5.7865 },
      landmark_description: 'Voeg terug bij hoofdroute na valleirit'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Rally Zone 7: Vallei van de Ourthe' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Prachtige valleirit langs de Ourthe. Kronkelende wegen door beboste heuvels met de rivier als metgezel.' }]
      }
    ],
    guidelines: [
      'Check in bij vallei start',
      'Volg de rivierroute',
      'Mooie stops onderweg',
      'Let op smalle gedeeltes',
      'Check uit bij terugkeer naar hoofdroute'
    ],
    estimated_duration_minutes: 55,
    difficulty: 'moderate' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  },
  {
    title: 'Rally Zone 8: Signal de Botrange Finale',
    order: 8,
    character: 'Laatste uitdaging op het hoogste punt van België',
    start_location: {
      name: 'Signal de Botrange - Start',
      coordinates: { lat: 50.1569, lng: 5.73486 },
      landmark_description: 'Verlaat hoofdroute richting hoogste punt'
    },
    end_location: {
      name: 'Signal de Botrange - Einde',
      coordinates: { lat: 50.24155, lng: 5.7507 },
      landmark_description: 'Voeg terug bij hoofdroute na top'
    },
    briefing: [
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '🏔️ Rally Zone 8: Signal de Botrange - De Finale!' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Je laatste uitdaging! Rijd naar het hoogste punt van België op 694m. Een passend einde aan een epische rally. Vier het op de top!' }]
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'De Top' }]
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Voltooi de klim naar Signal de Botrange. Maak je overwinningsfoto op het hoogste punt van België, daal dan af en rijd naar de finish!' }]
      }
    ],
    guidelines: [
      'Check in aan de voet van de klim',
      'Klim naar Signal de Botrange (694m)',
      'Verplichte foto op de top!',
      'Daal veilig af',
      'Check uit en keer terug naar hoofdroute',
      'Volgende stop: FINISH! 🏁'
    ],
    estimated_duration_minutes: 65,
    difficulty: 'challenging' as const,
    emergency_contact: '+32 123 456 789',
    is_active: true
  }
];

// Cleanup function
async function cleanupExistingData() {
  console.log('\n🗑️  Cleaning up existing data...');
  
  // Delete check-ins first (foreign key constraints)
  const { error: checkinsError } = await supabase
    .from('rally_zone_checkins')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (checkinsError) {
    console.error('   ❌ Error deleting check-ins:', checkinsError.message);
  } else {
    console.log('   ✅ Deleted all check-ins');
  }
  
  // Delete Sanity documents
  console.log('   🧹 Deleting Sanity documents...');
  
  // Delete rallyZoneV2 documents
  const zones = await sanityClient.fetch(`*[_type == "rallyZoneV2"]._id`);
  for (const zoneId of zones) {
    await sanityClient.delete(zoneId);
  }
  console.log(`   ✅ Deleted ${zones.length} Rally Zones`);
  
  // Delete eventSegment documents
  const segments = await sanityClient.fetch(`*[_type == "eventSegment"]._id`);
  for (const segmentId of segments) {
    await sanityClient.delete(segmentId);
  }
  console.log(`   ✅ Deleted ${segments.length} Event Segments`);
  
  console.log('   ✅ Cleanup complete!\n');
}

// Test participants
const testParticipants = [
  {
    email: 'thomas@conceptb.rally',
    first_name: 'Thomas',
    last_name: 'Seyssens',
    motorcycle_brand: 'BMW',
    motorcycle_model: 'R1250GS',
    license_plate: '1-ABC-123',
    phone: '+32 476 12 34 56',
    formula: 'with_meals',
    amount_paid: 125,
    payment_status: 'completed',
    ride_type: 'free',
    qr_code: 'TEST-THOMAS-001',
    checked_in: true
  },
  {
    email: 'jan@conceptb.rally',
    first_name: 'Jan',
    last_name: 'De Rider',
    motorcycle_brand: 'Ducati',
    motorcycle_model: 'Multistrada V4',
    license_plate: '1-DEF-456',
    phone: '+32 476 11 22 33',
    formula: 'breakfast_only',
    amount_paid: 100,
    payment_status: 'completed',
    ride_type: 'free',
    qr_code: 'TEST-JAN-002',
    checked_in: true
  },
  {
    email: 'marie@conceptb.rally',
    first_name: 'Marie',
    last_name: 'Van Damme',
    motorcycle_brand: 'Honda',
    motorcycle_model: 'Africa Twin',
    license_plate: '1-GHI-789',
    phone: '+32 476 44 55 66',
    formula: 'with_meals',
    amount_paid: 125,
    payment_status: 'completed',
    ride_type: 'free',
    qr_code: 'TEST-MARIE-003',
    checked_in: true
  }
];

async function generateMockData() {
  console.log('🎨 Generating Concept B Mock Data...\n');

  // Step 0: Cleanup existing data
  await cleanupExistingData();

  // 1. Create Event Segments in Sanity
  console.log('1️⃣  Creating Event Segments in Sanity...');
  const createdSegments: any[] = [];
  
  for (const segment of segments) {
    try {
      const doc = await sanityClient.create({
        _type: 'eventSegment',
        ...segment
      });
      createdSegments.push(doc);
      console.log(`   ✅ Created segment ${segment.order}: ${segment.title}`);
    } catch (error: any) {
      console.error(`   ❌ Error creating segment ${segment.order}:`, error.message);
    }
  }

  // 2. Create Rally Zones in Sanity
  console.log('\n2️⃣  Creating Rally Zones in Sanity...');
  const createdZones: any[] = [];
  
  for (const zone of rallyZones) {
    try {
      const doc = await sanityClient.create({
        _type: 'rallyZoneV2',
        ...zone
      });
      createdZones.push(doc);
      console.log(`   ✅ Created Rally Zone ${zone.order}: ${zone.title}`);
    } catch (error: any) {
      console.error(`   ❌ Error creating zone ${zone.order}:`, error.message);
    }
  }

  // 3. Create Test Participants in Supabase
  console.log('\n3️⃣  Creating Test Participants in Supabase...');
  const createdParticipants: any[] = [];
  
  for (const participant of testParticipants) {
    // Check if exists
    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('email', participant.email)
      .single();
    
    if (existing) {
      console.log(`   ℹ️  Participant ${participant.email} already exists`);
      createdParticipants.push(existing);
      continue;
    }
    
    const { data, error } = await supabase
      .from('participants')
      .insert(participant)
      .select()
      .single();
    
    if (error) {
      console.error(`   ❌ Error creating participant ${participant.email}:`, error.message);
    } else {
      createdParticipants.push(data);
      console.log(`   ✅ Created participant: ${participant.first_name} ${participant.last_name}`);
    }
  }

  // 4. Create Sample Check-ins (first 3 zones for first participant)
  console.log('\n4️⃣  Creating Sample Check-ins...');
  
  if (createdParticipants.length > 0 && createdZones.length >= 3) {
    const participant = createdParticipants[0];
    
    for (let i = 0; i < 3; i++) {
      const zone = createdZones[i];
      const timestamp = Date.now() + (i * 3600000); // 1 hour apart
      
      // Check-in
      const { error: checkinError } = await supabase
        .from('rally_zone_checkins')
        .insert({
          participant_id: participant.id,
          rally_zone_id: zone._id,
          action: 'CHECKIN',
          qr_code: `RZ${zone.order}-CHECKIN-${timestamp}`,
          latitude: zone.start_location.coordinates.lat,
          longitude: zone.start_location.coordinates.lng
        });
      
      if (checkinError) {
        console.error(`   ❌ Check-in error for zone ${zone.order}:`, checkinError.message);
      } else {
        console.log(`   ✅ Check-in zone ${zone.order}: ${zone.title}`);
      }
      
      // Check-out (30 min later)
      const { error: checkoutError } = await supabase
        .from('rally_zone_checkins')
        .insert({
          participant_id: participant.id,
          rally_zone_id: zone._id,
          action: 'CHECKOUT',
          qr_code: `RZ${zone.order}-CHECKOUT-${timestamp + 1800000}`,
          latitude: zone.end_location.coordinates.lat,
          longitude: zone.end_location.coordinates.lng
        });
      
      if (checkoutError) {
        console.error(`   ❌ Check-out error for zone ${zone.order}:`, checkoutError.message);
      } else {
        console.log(`   ✅ Check-out zone ${zone.order}: ${zone.title}`);
      }
    }
  }

  // 5. Summary
  console.log('\n📋 Mock Data Summary:');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Event Segments: ${createdSegments.length}/${segments.length}`);
  console.log(`✅ Rally Zones: ${createdZones.length}/${rallyZones.length}`);
  console.log(`✅ Test Participants: ${createdParticipants.length}/${testParticipants.length}`);
  console.log(`✅ Sample Check-ins: 6 (3 zones × 2 actions)`);
  
  console.log('\n💡 Next Steps:');
  console.log('───────────────────────────────────────');
  console.log('1. Upload GPX files to Sanity for each segment');
  console.log('2. Run test script: npx tsx scripts/test-concept-b-flow.ts');
  console.log('3. Test participant flow in the app');
  console.log('4. Test admin dashboards');
  
  console.log('\n✅ Mock Data Generation Complete!\n');
}

generateMockData().catch(console.error);
