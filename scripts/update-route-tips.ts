import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN || process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
});

async function updateRouteTips() {
  console.log('🚀 Starting route tips update...\n');

  const updates = [
    // Vlaamse Ardennen - Paterberg & Koppenberg
    {
      docId: 'vlaamse-ardennen',
      key: '49b940efb9fe43207060ddfb4c099451',
      data: {
        description: "Een iconische route langs twee van de meest beruchte hellingen uit de Ronde van Vlaanderen. De Paterberg met zijn steile kasseien en de Koppenberg die zelfs profs doet afstappen.",
        character: "Korte, intense klim met kasseien. Gevolgd door prachtige panorama's over de Vlaamse heuvels. Een echte uitdaging voor motor én rijder!",
        highlights: "📍 Paterberg (400m @ 12%), Koppenberg (600m @ 11%), Café 't Kantje (perfecte koffiestop), panorama Oudenaarde",
        warnings: "Kasseien kunnen glad zijn bij vocht. Koppenberg is smal - let op tegenliggers. Toeristisch druk op weekends.",
        routeInstructions: "Volg N60 richting Oudenaarde, draai af bij borden 'Paterberg'. Na beklimming door naar Kwaremont, dan links richting Koppenberg. Na Koppenberg terug naar N60."
      }
    },
    // Vlaamse Ardennen - Oudenaarde Historic Route
    {
      docId: 'vlaamse-ardennen',
      key: 'a648c3d4ab6b5ce5e6b29188d093c58b',
      data: {
        description: "Een culturele tocht door het hart van Oudenaarde met zijn rijke textielgeschiedenis en prachtige architectuur. Perfecte mix van historie en bochten.",
        character: "Rustige kronkelwegen door historisch textielstadje. Charmante pleintjes, oude bruggen over de Schelde, en gezellige cafeetjes op elk hoekje.",
        highlights: "📍 Stadhuis Oudenaarde (Gothic parel), MOU - Centrum Ronde van Vlaanderen, Brouwerij Roman, Marktplein voor lunch, Schelde kaaien",
        warnings: "Kasseien in stadscentrum - rijd voorzichtig. Marktdag op vrijdag = druk. Beperkt parkeren in centrum.",
        routeInstructions: "Centrum Oudenaarde is compact. Parkeer bij station, verken te voet of rijd langzaam door. Volg bewegwijzering 'Schelderoute' voor mooiste wegen langs de rivier."
      }
    },
    // Vlaamse Ardennen - Ronse Hills
    {
      docId: 'vlaamse-ardennen',
      key: 'c8b6c45e48d50373714affde294d73fa',
      data: {
        description: "De meest uitdagende route met steile hellingen, scherpe bochten en prachtige vergezichten. Voor de echte bocht-helden die van een sportieve rit houden.",
        character: "Technisch veeleisend met constante hoogteverschillen. Smalle bergweggetjes, haakse bochten, en verrassend steile uitdagingen. Echte rally-feeling!",
        highlights: "📍 Hotond (steile beklimming), Muziekbos (magisch woud), Kluisberg (hoogste punt, bar met terras), La Houppe (Franse kant), uitkijkpunten",
        warnings: "Smal wegdek op hellingen. Losliggend grind in bochten. Bij regen extra opletten - wegen kunnen spekglad zijn. Tankstation schaars.",
        routeInstructions: "Start in Ronse centrum, volg N48 richting Mont de l'Enclus. Bij Kluisberg parkeren voor koffie. Daarna door Muziekbos naar Hotond (opletten, véél steiler dan je denkt!). Via kleine wegen terug naar N60."
      }
    },
    // Condroz - Condroz Hills
    {
      docId: 'condroz',
      key: '6ls5v56EbOuIS4pXHwIApB',
      data: {
        description: "Glooiende heuvels en weelderige valleien typeren deze route door de Condroz. Perfect voor wie houdt van afwisselend terrein met lange bochten en spectaculaire vergezichten.",
        character: "Golvend landschap met ruime wegen. Lange sweepers door akkers en bossen. Rustgevend ritme met af en toe een verrassende klim.",
        highlights: "📍 Panorama Chevetogne, Château de Spontin (sprookjeskasteel), Ferme de Barvaux (lokale producten), uitzichtpunt Haillot",
        warnings: "Landbouwverkeer tijdens oogstseizoen. Sommige wegen kunnen grind bevatten na fieldwork. Wind op heuvels kan verraderlijk zijn.",
        routeInstructions: "Volg N4 richting Ciney, draai af naar Chevetogne. Door het dorp, dan rechts richting Spontin. Geniet van het glooiende landschap. Terug via Haillot naar startpunt."
      }
    },
    // Condroz - Back to Start
    {
      docId: 'condroz',
      key: '6ls5v56EbOuIS4pXHwIArG',
      data: {
        description: "De snelste terugweg naar het startpunt via hoofdwegen. Ideaal voor wie klaar is met avonturen en snel terug wil, of om tijd in te halen.",
        character: "Efficiënte route via grotere wegen. Minder bochten maar wel sneller. Goed voor als je wat achterloopt op schema.",
        highlights: "📍 Snelle verbinding, tankstations onderweg, restaurants aan afrit, overzichtelijk verkeer",
        warnings: "Meer verkeer dan backroads. Let op snelheidscamera's. Minder scenisch maar wel praktisch.",
        routeInstructions: "Volg N4/E411 richting startpunt. Duidelijk bewegwijzerd. Bij Wavre afslag nemen richting Brussel/Gent afhankelijk van je bestemming."
      }
    },
    // Ardennen-Ourthe - Ourthe Valley
    {
      docId: 'ardennen-ourthe',
      key: '6ls5v56EbOuIS4pXHwIHEa',
      data: {
        description: "Volg de kronkelende Ourthe rivier door een van de mooiste valleien van België. Eindeloze bochten langs het water met rotswanden en groene heuvels.",
        character: "Vloeiende bochten langs de rivier. Constant wisselend landschap van rotsen, bossen en weilanden. Pure motorrijplezier met adembenemende views!",
        highlights: "📍 Comblain-au-Pont (rotswanden), Sy (pittoresk dorpje), Les Rochers de Sy (foto stop!), Château de Logne ruïne, rivierpanoramas",
        warnings: "Weg kan nat zijn van mist van de rivier. Toeristen in zomer. Wees alert op fietsers langs de route.",
        routeInstructions: "Volg N633 langs de Ourthe vanaf Comblain richting Hamoir. Geniet van elke bocht! Bij Sy kort stoppen voor foto's. Dan verder naar Durbuy. Terug via andere oever voor andere views."
      }
    },
    // Ardennen-Ourthe - Hamoir Curves
    {
      docId: 'ardennen-ourthe',
      key: '6ls5v56EbOuIS4pXHwIHGf',
      data: {
        description: "Een technisch hoogstandje vol haakse bochten en hoogteverschillen. De N86 tussen Hamoir en Ferrières staat bekend als één van de leukste motorwegen van het land.",
        character: "Agressieve bochtenwerk met korte rechte stukken. Constant schakelen en remmen. Voor ervaren rijders die van uitdaging houden!",
        highlights: "📍 Virage de Hamoir (beroemde hairpin), N86 bochten (tel ze niet!), Café Le Relais des Sportifs, panorama Ferrières, technische uitdaging",
        warnings: "Smalle weg met tegenliggers! Motorrijders paradijs = druk in weekends. Olievlekken in hairpins. FOCUS vereist.",
        routeInstructions: "Start in Hamoir centrum, neem N86 richting Ferrières. Concentreer je - bochten komen snel achter elkaar. Na Ferrières rustig uitblazen in café. Terug via rustiger route."
      }
    },
    // Ardennen-Ourthe - Durbuy Route
    {
      docId: 'ardennen-ourthe',
      key: '6ls5v56EbOuIS4pXHwIHIk',
      data: {
        description: "Door kleine dorpjes en over vergeten wegen naar 'de kleinste stad ter wereld'. Durbuy is de perfecte lunch stop met zijn middeleeuwse centrum en terrassen.",
        character: "Ontspannen cruise door Ardens landschap. Kleine wegen, weinig verkeer, authentieke dorpjes. Tijd voor een lange lunch!",
        highlights: "📍 Durbuy centrum (UNESCO kandidaat), Topiary Park, Le Sanglier des Ardennes (top restaurant), Belvédère des Six Ourthes, ambiance middeleeuwse straatjes",
        warnings: "Durbuy is ZEER toeristisch - parkeren kan uitdaging zijn. Smalle straatjes in centrum. Reserveren voor lunch aanbevolen in zomer.",
        routeInstructions: "Via N983 richting Durbuy. Parkeer buiten centrum (Parc des Topiaires parking). Loop 5min naar centrum. Geniet van lunch, verken steegjes. Daarna via N983 terug naar hoofdroute."
      }
    },
    // Hoge Venen - Signal de Botrange
    {
      docId: 'hoge-venen',
      key: 'uKUSe7ggQXp6fRmiJ16833',
      data: {
        description: "Rij naar het hoogste punt van België! Signal de Botrange (694m) biedt spectaculaire uitzichten over de Hoge Venen. Op heldere dagen zie je tot Aken en Maastricht.",
        character: "Breed panoramisch plateau met eindeloze vergezichten. Wind kan stevig zijn! Uniek hoogveenlandschap met paarse heide (aug-sept).",
        highlights: "📍 Toren Signal de Botrange (694m - hoogste punt!), Baltia (café met terras), Mont Rigi uitzichtpunt, Baraque Michel (oudste herberg België), veenlandschap",
        warnings: "Weer kan SNEL omslaan - altijd regenkleding bij. Wind op plateau! Mist mogelijk. In winter sneeuw/ijzel risico.",
        routeInstructions: "Volg N68 richting Botrange. Bij Signal parkeren en toren beklimmen (15min). Indrukwekkend uitzicht! Koffie bij Baltia. Daarna via Baraque Michel terug - oudste café verdient stop!"
      }
    },
    // Hoge Venen - Venen Loop
    {
      docId: 'hoge-venen',
      key: 'uKUSe7ggQXp6fRmiJ1686s',
      data: {
        description: "Een technische lus door de Venen met smalle wegen langs veengebieden. Constant wisselend landschap tussen bos en open veen. Voor de betere rijder!",
        character: "Smal en bochtig met verrassende hoogteverschillen. Natte wegen door veenmist. Technisch veeleisend maar oh zo bevredigend!",
        highlights: "📍 Fagnes plateau, Robertville meer (turquoise water!), Reinhardstein kasteel, houten loopbruggen door veen, fotospots",
        warnings: "Wegen kunnen NAT zijn van mist. Schaarse bewegwijzering. GPS aanbevolen. Wilde dieren kunnen oversteken. Tankstation ver weg.",
        routeInstructions: "Start bij Baraque Michel, volg kleine wegen richting Robertville. Bij meer even genieten van turquoise kleur. Dan via Reinhardstein (kasteel!) terug naar plateau. Complex netwerk - GPS handig!"
      }
    },
    // Hoge Venen - German Border Route
    {
      docId: 'hoge-venen',
      key: 'uKUSe7ggQXp6fRmiJ168Ah',
      data: {
        description: "Rij de grens over naar Duitsland! Monschau is een sprookjesdorp met vakwerkhuizen langs een beekje. Perfect voor koffie en Duitse Kuchen.",
        character: "Rustige kruisbestuiving tussen België en Duitsland. Breed en overzichtelijk met lange bochten. Ontspannen cruise naar pittoresk dorp.",
        highlights: "📍 Monschau centrum (vakwerk!), Senfmühle (mosterdmolen), Duitse bakkerijen (Kuchen!), Rotes Haus museum, Rur rivier, gezellige terrassen",
        warnings: "Monschau is ZEER druk in weekends/zomer. Parkeren moeilijk. Smalle straatjes centrum. Paspoort meenemen (grens). Duitse verkeersregels!",
        routeInstructions: "Via N68 naar grens, dan B258 richting Monschau (6km over grens). Parkeer buiten centrum bij P+R. Loop naar centrum (10min). Geniet van koffie en Schwarzwälder Kirschtorte! Terug via zelfde route."
      }
    }
  ];

  for (const update of updates) {
    try {
      console.log(`📝 Updating ${update.docId} route tip with key ${update.key}...`);
      
      await client
        .patch(update.docId)
        .set({
          [`routeTips[_key=="${update.key}"].description`]: update.data.description,
          [`routeTips[_key=="${update.key}"].character`]: update.data.character,
          [`routeTips[_key=="${update.key}"].highlights`]: update.data.highlights,
          [`routeTips[_key=="${update.key}"].warnings`]: update.data.warnings,
          [`routeTips[_key=="${update.key}"].routeInstructions`]: update.data.routeInstructions,
        })
        .commit();
      
      console.log(`✅ Success!\n`);
    } catch (error) {
      console.error(`❌ Failed to update ${update.docId}:`, error);
    }
  }

  console.log('🎉 All route tips updated!');
}

updateRouteTips().catch(console.error);
