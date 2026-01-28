import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const rallyZones = [
  {
    title: 'Vlaamse Ardennen',
    description: 'De klassieke bochtenparadijs van België. Deze zone biedt verschillende manieren om de Vlaamse heuvels te verkennen.',
    location: 'Oost-Vlaanderen',
    routeTips: [
      {
        name: 'De Klassieke Klimroute',
        description: 'De meest iconische beklimmingen van de Vlaamse Ardennen: Oude Kwaremont, Paterberg, Koppenberg. Perfect voor wie houdt van steile, korte klimmetjes.',
        routeType: 'technical',
        difficulty: 'medium',
        estimatedDistance: 35,
        character: 'Zeer bochtig, steile klimmen, smalle wegen',
        warnings: 'Kasseien op sommige stukken, druk in het weekend',
        highlights: 'Kwaremont, Paterberg panorama, authentieke dorpjes',
        exitInstructions: 'In Oudenaarde richting Kluisberg, eerste afslag rechts',
        routeInstructions: 'Volg de gele bordjes "Vlaamse Ardennen Route". Via Mater naar de Kwaremont, dan Paterberg, eindigen via Koppenberg terug richting hoofdroute.',
        rejoinInstructions: 'Na Koppenberg linksaf richting Oudenaarde centrum, daar terug op hoofdroute',
      },
      {
        name: 'Panoramische Valleiweg',
        description: 'Rustigere route door de valleien met prachtige vergezichten. Minder technisch maar minstens zo mooi.',
        routeType: 'panoramic',
        difficulty: 'easy',
        estimatedDistance: 28,
        character: 'Vloeiend, weinig verkeer, breed perspectief',
        warnings: 'Weinig, relaxte route',
        highlights: 'Scheldezicht, Brakelbos, Lierde panorama',
        exitInstructions: 'In Zottegem richting Brakel via N494',
        routeInstructions: 'Volg de Schelde zuidwaarts, door Brakel, via landelijke wegen naar Lierde en terug.',
        rejoinInstructions: 'Via Lierde terug richting Oudenaarde',
      },
      {
        name: 'Off-road Adventure',
        description: 'Voor de avonturiers: onverharde wegen en grindpaden door bossen en velden.',
        routeType: 'offroad',
        difficulty: 'hard',
        estimatedDistance: 42,
        character: 'Gravel, losliggend, technisch veeleisend',
        warnings: 'Onverhard! Alleen voor ervaren rijders met geschikte motor',
        highlights: 'Bos van Tiegem, verborgen paden, avontuurlijk',
        exitInstructions: 'Bij Kruishoutem de kleine weggetjes richting Ooike',
        routeInstructions: 'Via gravelwegen door Brakelbos, dan richting Zegelsem via onverharde paden. Technisch maar spectaculair.',
        rejoinInstructions: 'Bij Brakel terug op asfalt richting hoofdroute',
      },
    ],
    color: 'green',
    is_open: true,
    order: 1,
  },
  {
    title: 'Ardennen - Ourthe Vallei',
    description: 'De prachtige Ourthe-vallei met haar bochtige wegen en dramatische landschappen.',
    location: 'Luxemburg (BE)',
    routeTips: [
      {
        name: 'Rivieroute Ourthe',
        description: 'Volg de kronkelende Ourthe langs pittoreske dorpjes en kasteelruïnes.',
        routeType: 'panoramic',
        difficulty: 'easy',
        estimatedDistance: 45,
        character: 'Vloeiend, volgend de rivier, weinig hoogteverschil',
        warnings: 'Kan druk zijn in zomerweekends',
        highlights: 'La Roche-en-Ardenne, Kasteel van Durbuy, rivierzichten',
        exitInstructions: 'Bij Barvaux richting La Roche via N833',
        routeInstructions: 'Volg de Ourthe via La Roche naar Houffalize, prachtige rivierbochten en dorpjes.',
        rejoinInstructions: 'Bij Houffalize terug op de hoofdroute richting oosten',
      },
      {
        name: 'Heuvelkam Route',
        description: 'Blijf op de heuvelkammen voor maximale panoramas en technische bochtenwerk.',
        routeType: 'technical',
        difficulty: 'hard',
        estimatedDistance: 52,
        character: 'Zeer bochtig, hoogteverschillen, technisch',
        warnings: 'Scherpe haarspeldbochten, steil',
        highlights: 'Col de Wanne, vergezichten over valleien',
        exitInstructions: 'Bij Trois-Ponts omhoog richting Wanne',
        routeInstructions: 'Klim naar de kam, volg de route via Wanne naar Baraque de Fraiture, spectaculaire bochten.',
        rejoinInstructions: 'Bij Baraque de Fraiture (eindpunt rally!)',
      },
      {
        name: 'Snelle Doorsteek',
        description: 'Wil je snel verder? Deze route gebruikt grotere wegen maar blijft mooi.',
        routeType: 'highway',
        difficulty: 'easy',
        estimatedDistance: 38,
        character: 'Vlot verkeer, goede wegen, snel',
        warnings: 'Minder intiem dan andere routes',
        highlights: 'Efficiënt, toch mooie vergezichten',
        exitInstructions: 'Blijf op N89 richting La Roche',
        routeInstructions: 'Via N89 en N888 snel richting Houffalize.',
        rejoinInstructions: 'Bij Houffalize terug op route',
      },
    ],
    color: 'orange',
    is_open: true,
    order: 2,
  },
  {
    title: 'Hoge Venen',
    description: 'Het hoogste punt van België met unieke natuur en weidsheid.',
    location: 'Luik - Hoge Venen',
    routeTips: [
      {
        name: 'Vennentour',
        description: 'Door het unieke veenlandschap, een heel andere ervaring.',
        routeType: 'panoramic',
        difficulty: 'medium',
        estimatedDistance: 48,
        character: 'Open landschap, wind, bijzondere natuur',
        warnings: 'Weer kan snel omslaan, wind!',
        highlights: 'Signal de Botrange, venen panorama, hoogste punt BE',
        exitInstructions: 'Bij Robertville richting Signal de Botrange',
        routeInstructions: 'Via Baraque Michel naar Signal de Botrange, geniet van de weidsheid.',
        rejoinInstructions: 'Via Mont Rigi terug richting hoofdroute',
      },
      {
        name: 'Stuwmerenroute',
        description: 'Langs de mooie stuwmeren van de regio, waterpartijen en bos.',
        routeType: 'mixed',
        difficulty: 'easy',
        estimatedDistance: 35,
        character: 'Gevarieerd, bos en water, rustig',
        warnings: 'Populair bij toeristen',
        highlights: 'Lac de Robertville, Lac de la Gileppe',
        exitInstructions: 'Bij Waimes richting Robertville',
        routeInstructions: 'Rond beide meren, prachtige uitzichten op water en bossen.',
        rejoinInstructions: 'Via Jalhay terug naar hoofdroute',
      },
      {
        name: 'Grensoverschrijdende Lus',
        description: 'Een uitstapje naar Duitsland via kleine grensweggetjes.',
        routeType: 'backroads',
        difficulty: 'medium',
        estimatedDistance: 55,
        character: 'Rustige wegen, weinig verkeer, authentiek',
        warnings: 'Grensovergang, check je papieren!',
        highlights: 'Duitse Eifel, grensdorpjes, unieke ervaring',
        exitInstructions: 'Bij Bütgenbach richting Duitse grens',
        routeInstructions: 'Via kleine weggetjes de Eifel in, terug via andere grensovergang.',
        rejoinInstructions: 'Bij Eupen terug op Belgisch grondgebied',
      },
    ],
    color: 'red',
    is_open: true,
    order: 3,
  },
  {
    title: 'Condroz',
    description: 'Het golvende landschap tussen Maas en Ardennen, minder bekend maar schitterend.',
    location: 'Namen',
    routeTips: [
      {
        name: 'De Golvende Route',
        description: 'Op en neer door het typische Condroz-landschap, eindeloos golvend.',
        routeType: 'technical',
        difficulty: 'medium',
        estimatedDistance: 40,
        character: 'Constant op-en-neer, ritmisch, pittig',
        warnings: 'Veel hoogtemeters!',
        highlights: 'Typisch Condroz, landelijke charme',
        exitInstructions: 'Bij Ciney richting Havelange',
        routeInstructions: 'Door de golven van het Condroz, via Havelange naar Durbuy.',
        rejoinInstructions: 'Bij Durbuy terug op hoofdroute',
      },
      {
        name: 'Maas Panorama',
        description: 'Langs de Maas met schitterende riviergezichten.',
        routeType: 'panoramic',
        difficulty: 'easy',
        estimatedDistance: 50,
        character: 'Vloeiend langs rivier, relaxed',
        warnings: 'Verkeer mogelijk drukker',
        highlights: 'Maasgezichten, Dinant, rotswanden',
        exitInstructions: 'Bij Huy richting Dinant via N92',
        routeInstructions: 'Volg de Maas zuidwaarts, spectaculaire rotswanden en kastelen.',
        rejoinInstructions: 'Bij Dinant terug landinwaarts',
      },
    ],
    color: 'yellow',
    is_open: true,
    order: 4,
  },
];

async function populateRallyZones() {
  try {
    console.log('🏍️  Rally zones aanmaken met routetips...\n');

    // Fetch edition
    const editions = await client.fetch('*[_type == "edition"] | order(_createdAt desc)[0]');
    
    if (!editions) {
      console.error('❌ Geen edition gevonden! Maak eerst een edition aan.');
      return;
    }

    console.log(`📋 Edition gevonden: ${editions.title || editions._id}\n`);

    for (const zone of rallyZones) {
      console.log(`📍 ${zone.title} aanmaken...`);
      
      const doc = {
        _type: 'rallyZone',
        title: zone.title,
        description: zone.description,
        location: zone.location,
        routeTips: zone.routeTips,
        color: zone.color,
        is_open: zone.is_open,
        order: zone.order,
        edition: {
          _type: 'reference',
          _ref: editions._id,
        },
      };

      const result = await client.create(doc);
      console.log(`   ✅ ${zone.title} aangemaakt met ${zone.routeTips.length} routetips`);
      zone.routeTips.forEach((tip) => {
        console.log(`      • ${tip.name} (${tip.routeType}, ${tip.difficulty}, ${tip.estimatedDistance}km)`);
      });
      console.log('');
    }

    console.log('✨ Alle rally zones succesvol aangemaakt!\n');
  } catch (error) {
    console.error('❌ Fout bij aanmaken:', error);
    throw error;
  }
}

populateRallyZones();
