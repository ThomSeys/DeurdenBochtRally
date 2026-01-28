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
  return [
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(7),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(7),
          text: text,
          marks: [],
        },
      ],
      markDefs: [],
    },
  ];
}

const rallyZones = [
  {
    _type: 'rallyZone',
    title: 'Leie Valley Loop',
    order: 1,
    description: 'De eerste afwijking. Verlaat de hoofdroute en verken kronkelende wegen langs de Leie door polders en glooiende velden.',
    location: 'Deinze/Zulte – Oost-Vlaanderen',
    exit: 'Net na de start, waar de route de Leie kruist bij Deinze. Sla rechtsaf richting Zulte op een kleinere weg parallel aan het water.',
    lus: 'Volg de smalle weg langs de Leie oostwaarts. Houd het water aan je rechterhand. Na ongeveer 6 km zie je een oude brug.',
    zoneType: 'short',
    estimatedDistance: 15,
    points: 12,
    rejoin: 'Volg de weg verder tot je opnieuw op een grotere baan komt die terug naar de hoofdroute leidt.',
    color: 'green',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 51.01308, lng: 3.61875 },
    endPoint: { lat: 50.88479, lng: 3.58042 },
    checkpoints: [
      {
        _key: 'rz1-cp1',
        name: 'Checkpoint 1: De Brugwachter',
        trajectory: createPortableText('Volg de Leie oostwaarts gedurende 6 km. Het water blijft aan je rechterhand. De weg kronkelt mee met de rivier door een open polderlandschap.'),
        description: 'Zoek een oude brug over de Leie met een klein brugwachtershuis. Het gebouwtje heeft rode dakpannen.',
        codeHint: 'Noteer het bouwjaar op de gevelsteen',
        solution: '1893',
        validAnswers: ['1893'],
        location: { lat: 50.96918, lng: 3.62395 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Ronse Heuvelzone',
    order: 2,
    description: 'Klim door de Vlaamse Ardennen. Twee checkpoints in glooiend landschap met kapellen en vergezichten.',
    location: 'Ronse – Vlaamse Ardennen',
    exit: 'Bij het rondpunt ten zuiden van Zottegem. Neem de afslag richting Ronse (zuidwest). De weg begint meteen te stijgen.',
    lus: 'Volg de klimmende weg door de Vlaamse Ardennen. Na de eerste heuvel vind je een kapel. Rijd verder over het plateau naar een tweede heuvel met uitzicht.',
    zoneType: 'medium',
    estimatedDistance: 22,
    points: 20,
    rejoin: 'Daal af richting noordoosten. De weg voert je automatisch terug naar de hoofdroute.',
    color: 'yellow',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 50.72486, lng: 3.68384 },
    endPoint: { lat: 50.58285, lng: 3.80251 },
    checkpoints: [
      {
        _key: 'rz2-cp1',
        name: 'Checkpoint 1: Onze-Lieve-Vrouwkapel',
        trajectory: createPortableText('Klim gedurende 7 km door glooiend landschap. De weg slingert tussen akkers en bosjes. Bij de top zie je een wit kapelletje.'),
        description: 'Een kleine witte kapel op een kruispunt van veldwegen. Toegewijd aan Onze-Lieve-Vrouw.',
        codeHint: 'Noteer de naam van de beeldhouwer op het gedenkplaatje',
        solution: 'DESMET',
        validAnswers: ['DESMET', 'Desmet'],
        location: { lat: 50.69229, lng: 3.67474 },
      },
      {
        _key: 'rz2-cp2',
        name: 'Checkpoint 2: Muziekberg Panorama',
        trajectory: createPortableText('Rijd verder over het plateau. Na 8 km zie je een grotere heuvel voor je. Volg de borden naar "Muziekberg". Klim naar de top.'),
        description: 'Het hoogste punt van de omgeving met een houten uitkijktoren. 360° uitzicht over de Vlaamse Ardennen.',
        codeHint: 'Noteer de hoogte op het informatiebord (in meters)',
        solution: '150',
        validAnswers: ['150', '150m'],
        location: { lat: 50.7583, lng: 3.6178 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Tussen Schelde en Dender',
    order: 3,
    description: 'Een korte maar charmante omweg door het landelijke hart tussen twee rivieren.',
    location: 'Zottegem/Geraardsbergen',
    exit: 'Waar de hoofdroute een bocht maakt richting Geraardsbergen. Sla linksaf op een smalle landweg tussen twee akkers.',
    lus: 'Volg de kronkelende landweggetjes. Het is een doolhof van smalle wegen, maar blijf richting het oosten.',
    zoneType: 'short',
    estimatedDistance: 8,
    points: 12,
    rejoin: 'Na de watermolen kom je vanzelf op een grotere weg die naar de hoofdroute leidt.',
    color: 'green',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 50.60471, lng: 4.20145 },
    endPoint: { lat: 50.56327, lng: 4.23794 },
    checkpoints: [
      {
        _key: 'rz3-cp1',
        name: 'Checkpoint 1: Den Herdermolen',
        trajectory: createPortableText('Volg de smalle weg oostwaarts gedurende 5 km. Je passeert een boerderij met rood-witte luiken. Kort daarna zie je links een beekje. Volg het pad erlangs.'),
        description: 'Een oude watermolen aan een beekje. Het gebouw is verbouwd tot woonhuis maar het molenrad is nog zichtbaar.',
        codeHint: 'Noteer de familienaam op de brievenbus',
        solution: 'VANHOVE',
        validAnswers: ['VANHOVE', 'Vanhove', 'VAN HOVE'],
        location: { lat: 50.60471, lng: 4.20145 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Pays des Collines',
    order: 4,
    description: 'Over de grens naar Frans-Vlaanderen. Glooiend landschap met een historisch fort en panoramisch uitzicht.',
    location: 'Vlaamse grens – Pays des Collines',
    exit: 'Bij Kluisbergen, net voor de grens met Frankrijk. Sla rechtsaf op een secundaire weg richting zuiden.',
    lus: 'Steek de Frans-Belgische grens over. Volg de D-wegen door het glooiende landschap. Zoek het fort, rijd daarna verder naar een heuvel.',
    zoneType: 'medium',
    estimatedDistance: 20,
    points: 20,
    rejoin: 'Vanop de heuvel daal je af richting Ronse. De weg brengt je terug naar België en de hoofdroute.',
    color: 'yellow',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 50.42103, lng: 4.28173 },
    endPoint: { lat: 50.22224, lng: 4.41212 },
    checkpoints: [
      {
        _key: 'rz4-cp1',
        name: 'Checkpoint 1: Fort du Vert Gazon',
        trajectory: createPortableText('Steek de grens over en rijd zuidwaarts. Na 9 km zie je een groot fortificatie op een heuvel rechts. Volg de smalle oprit naar boven.'),
        description: 'Een 19e-eeuws militair fort op een strategische heuvel. Imposante bakstenen muren met een toegangspoort.',
        codeHint: 'Noteer het jaar op de gedenkplaat bij de hoofdpoort',
        solution: '1878',
        validAnswers: ['1878'],
        location: { lat: 50.34245, lng: 4.35235 },
      },
      {
        _key: 'rz4-cp2',
        name: 'Checkpoint 2: Mont de l\'Enclus',
        trajectory: createPortableText('Rijd verder zuidwaarts. De weg klimt geleidelijk. Na 8 km bereik je een kruispunt bij een abdij. Sla links en volg de borden naar de top.'),
        description: 'Het hoogste punt van de streek met een groot houten kruis en een panoramisch uitzicht over Frans-Vlaanderen.',
        codeHint: 'Noteer het woord op het informatiebord naast het kruis',
        solution: 'PANORAMA',
        validAnswers: ['PANORAMA', 'Panorama'],
        location: { lat: 50.27166, lng: 4.43370 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Samber Valley Challenge',
    order: 5,
    description: 'De eerste lange zone. Volg de Samber door industrieel erfgoed, verlaten steengroeven en abdijruïnes.',
    location: 'Samber-vallei – Namen',
    exit: 'Bij Thuin, waar de route de Samber kruist. Sla rechtsaf en volg de rivier stroomopwaarts langs de oude weg.',
    lus: 'Een lange lus langs de Samber. Drie verschillende checkpoints: industrieel erfgoed, een verlaten steengroeve en een abdijruïne.',
    zoneType: 'long',
    estimatedDistance: 38,
    points: 35,
    rejoin: 'Na de abdij volg je de weg noordwaarts. Je komt automatisch terug op de hoofdroute.',
    color: 'orange',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 50.10595, lng: 4.66004 },
    endPoint: { lat: 49.87992, lng: 4.90400 },
    checkpoints: [
      {
        _key: 'rz5-cp1',
        name: 'Checkpoint 1: Ascenseur de Strépy-Thieu',
        trajectory: createPortableText('Volg de Samber stroomopwaarts gedurende 11 km. Je passeert oude industriële gebouwen. Bij het kanaal zie je links een enorme staalconstructie opdoemen.'),
        description: 'Het grootste scheepslift ter wereld. Een indrukwekkend stalen monument van moderne ingenieurskunst.',
        codeHint: 'Noteer de hoogte van de lift (in meters) op het infobord',
        solution: '73',
        validAnswers: ['73', '73m'],
        location: { lat: 50.4778, lng: 4.1572 },
      },
      {
        _key: 'rz5-cp2',
        name: 'Checkpoint 2: Carrière de Feluy',
        trajectory: createPortableText('Rijd verder langs het kanaal. Na 14 km zie je rechts een weg omhoog. Volg deze naar een verlaten industrieterrein met diepe kraters.'),
        description: 'Een oude verlaten steengroeve. Diepe waterplassen in turquoise kleuren tussen rotsformaties.',
        codeHint: 'Noteer het woord op het verroeste metalen bord bij de ingang',
        solution: 'INTERDIT',
        validAnswers: ['INTERDIT', 'Interdit'],
        location: { lat: 50.5789, lng: 4.2645 },
      },
      {
        _key: 'rz5-cp3',
        name: 'Checkpoint 3: Abbaye d\'Aulne',
        trajectory: createPortableText('Verlaat de groeve en rijd noordoostwaarts. Na 10 km door bossen en velden zie je de ruïne van een grote abdij opdoemen.'),
        description: 'De gotische ruïne van een 12e-eeuwse cisterciënzerabdij. Imposante bogen en muren tegen een bosrijke achtergrond.',
        codeHint: 'Noteer de stichtingsjaar op de gedenkplaat',
        solution: '1147',
        validAnswers: ['1147'],
        location: { lat: 50.3535, lng: 4.3912 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Ardennen Panorama Route',
    order: 6,
    description: 'Diep de Ardennen in. De langste zone met smalle bergwegen, dichte bossen en spectaculaire uitzichten.',
    location: 'Houffalize/La Roche – Ardennen',
    exit: 'Net na Marche-en-Famenne. Bij het bord "La Roche-en-Ardenne" sla je linksaf op de N89 richting Houffalize.',
    lus: 'Een uitdagende lus door het hart van de Ardennen. Smalle bergwegen, dichte bossen, een stuwmeer en het hoogste punt van de streek.',
    zoneType: 'long',
    estimatedDistance: 42,
    points: 35,
    rejoin: 'Na de radiomast daal je af. De weg voert automatisch terug naar de hoofdroute richting Luik.',
    color: 'red',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 49.78753, lng: 5.17524 },
    endPoint: { lat: 50.13412, lng: 5.28853 },
    checkpoints: [
      {
        _key: 'rz6-cp1',
        name: 'Checkpoint 1: Barrage de Nisramont',
        trajectory: createPortableText('Rijd zuidwestwaarts door dichte bossen. De weg klimt en daalt voortdurend. Na 13 km bereik je een stuwdam met een groot meer erachter.'),
        description: 'Een indrukwekkende stuwdam in de Ourthe-vallei. Het turquoise water van het stuwmeer strekt zich kilometers ver uit.',
        codeHint: 'Noteer het jaartal op het betonnen monument bij de dam',
        solution: '1958',
        validAnswers: ['1958'],
        location: { lat: 50.1389, lng: 5.5558 },
      },
      {
        _key: 'rz6-cp2',
        name: 'Checkpoint 2: Roche à Frêne Viewpoint',
        trajectory: createPortableText('Volg de weg langs het meer. Na 15 km begin je te klimmen. De weg wordt smaller en kronkeliger. Bij een haarspeldbocht zie je een houten platform.'),
        description: 'Een spectaculair uitzichtpunt over het Ourthe-dal. Ruige rotsen en eindeloze bossen tot aan de horizon.',
        codeHint: 'Noteer de hoogte (in meters) op het panoramabord',
        solution: '435',
        validAnswers: ['435', '435m'],
        location: { lat: 50.1234, lng: 5.4567 },
      },
      {
        _key: 'rz6-cp3',
        name: 'Checkpoint 3: Mont des Deux Provinces',
        trajectory: createPortableText('Klim verder door dennenbossen. Na 11 km bereik je een plateau. Zoek de rode-witte radiomast die boven de bomen uitsteekt.'),
        description: 'Het hoogste punt van de regio, gemarkeerd door een imposante radiomast. Op heldere dagen zie je drie provincies.',
        codeHint: 'Noteer het nummer op de radiomast',
        solution: 'T-14',
        validAnswers: ['T-14', 'T14'],
        location: { lat: 50.2123, lng: 5.5012 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Vallei van de Ourthe',
    order: 7,
    description: 'Volg de slingerende Ourthe stroomopwaarts door een diep uitgesneden vallei met middeleeuwse charme.',
    location: 'La Roche/Houffalize – Ourthe-vallei',
    exit: 'In La Roche-en-Ardenne centrum. Bij het kasteel sla je rechts de smalle N833 in richting Houffalize.',
    lus: 'Volg de Ourthe door een diep uitgesneden vallei. Smalle wegen langs het water met middeleeuwse bruggen en waterpartijen.',
    zoneType: 'medium',
    estimatedDistance: 24,
    points: 20,
    rejoin: 'Na de waterval volgt de weg de vallei verder. Je komt vanzelf terug op de hoofdroute.',
    color: 'yellow',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 50.13375, lng: 5.53609 },
    endPoint: { lat: 50.12837, lng: 5.78650 },
    checkpoints: [
      {
        _key: 'rz7-cp1',
        name: 'Checkpoint 1: Pont de Bérismenil',
        trajectory: createPortableText('Volg de N833 langs de Ourthe. Het water blijft aan je linkerkant. Na 11 km zie je een oude stenen boogbrug over de rivier.'),
        description: 'Een middeleeuwse stenen brug met drie bogen over de Ourthe. Omringd door dichte bossen die tot het water komen.',
        codeHint: 'Noteer de naam van de architect op de gedenkplaat aan de brug',
        solution: 'DELVAUX',
        validAnswers: ['DELVAUX', 'Delvaux'],
        location: { lat: 50.09037, lng: 5.56763 },
      },
      {
        _key: 'rz7-cp2',
        name: 'Checkpoint 2: Cascade du Bayehon',
        trajectory: createPortableText('Rijd verder stroomopwaarts. De vallei wordt smaller en de weg klimt licht. Na 9 km hoor je water ruisen. Volg het pad naar links.'),
        description: 'Een waterval die over rotsen naar beneden stort. Het hoogste punt waar water over rotsen valt in België (30m).',
        codeHint: 'Noteer de hoogte van de waterval (in meters) op het infobord',
        solution: '30',
        validAnswers: ['30', '30m'],
        location: { lat: 50.4956, lng: 6.1167 },
      },
    ],
  },
  {
    _type: 'rallyZone',
    title: 'Signal de Botrange Finale',
    order: 8,
    description: 'De laatste uitdaging. Klim naar het hoogste punt van België en rijd rechtstreeks naar de finish.',
    location: 'Hoge Venen – Luik',
    exit: 'Bij Malmedy. Volg de borden "Signal de Botrange". De weg klimt meteen steil omhoog.',
    lus: 'De slotklim. Door de kale Hoge Venen naar het hoogste punt van het land. Symbolisch en spectaculair.',
    zoneType: 'short',
    estimatedDistance: 12,
    points: 12,
    rejoin: 'Van de top rijd je rechtstreeks naar de finish in Aalter. Dit is het einde van de rally.',
    color: 'green',
    radius_m: 30,
    is_open: true,
    startPoint: { lat: 50.15690, lng: 5.73486 },
    endPoint: { lat: 50.24155, lng: 5.75070 },
    checkpoints: [
      {
        _key: 'rz8-cp1',
        name: 'Checkpoint 1: Hoogste Punt van België',
        trajectory: createPortableText('Klim gedurende 7 km door het kale veenlandschap. De weg slingert omhoog. Bij de top zie je een stenen toren en een grote stapel stenen.'),
        description: 'De Baltia-toren op het Signal de Botrange (694m). Het hoogste punt van België, gemarkeerd door een kunstmatige heuvel.',
        codeHint: 'Noteer de hoogte op het monumentale bord bij de toren',
        solution: '694',
        validAnswers: ['694', '694m'],
        location: { lat: 50.5031, lng: 6.1089 },
      },
    ],
  },
];

async function uploadRallyZones() {
  try {
    console.log('🚀 Rally zones uploaden naar Sanity...\n');

    // Get the active edition first
    const editions = await client.fetch('*[_type == "edition" && isActive == true][0]');
    if (!editions) {
      throw new Error('Geen actieve editie gevonden. Maak eerst een editie aan.');
    }
    console.log(`✅ Actieve editie gevonden: ${editions.name} (${editions._id})\n`);

    for (const zone of rallyZones) {
      // Add edition reference
      const zoneWithEdition = {
        ...zone,
        edition: {
          _type: 'reference',
          _ref: editions._id,
        },
      };

      const result = await client.create(zoneWithEdition);
      console.log(`✅ RZ${zone.order} - ${zone.title} aangemaakt (${result._id})`);
    }

    console.log('\n✨ Alle 8 rally zones succesvol geüpload naar Sanity!');
    console.log('\n📝 Overzicht:');
    console.log('   - 3 korte zones (Type A): RZ1, RZ3, RZ8');
    console.log('   - 3 medium zones (Type B): RZ2, RZ4, RZ7');
    console.log('   - 2 lange zones (Type C): RZ5, RZ6');
    console.log('\n🔗 Bekijk ze in Sanity Studio: https://deurdenbochtrally.sanity.studio');
  } catch (error) {
    console.error('❌ Fout bij uploaden:', error);
    throw error;
  }
}

uploadRallyZones();
