const sanityClient = require('@sanity/client').createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  useCdn: false
});

// Helper to convert markdown to Sanity blocks
function markdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    if (line.startsWith('####')) {
      blocks.push({
        _type: 'block',
        _key: Math.random().toString(36).substr(2, 9),
        style: 'h4',
        children: [{ _type: 'span', _key: Math.random().toString(36).substr(2, 9), text: line.replace(/^####\s+/, '').trim() }]
      });
    } else if (line.startsWith('###')) {
      blocks.push({
        _type: 'block',
        _key: Math.random().toString(36).substr(2, 9),
        style: 'h3',
        children: [{ _type: 'span', _key: Math.random().toString(36).substr(2, 9), text: line.replace(/^###\s+/, '').trim() }]
      });
    } else if (line.startsWith('##')) {
      blocks.push({
        _type: 'block',
        _key: Math.random().toString(36).substr(2, 9),
        style: 'h2',
        children: [{ _type: 'span', _key: Math.random().toString(36).substr(2, 9), text: line.replace(/^##\s+/, '').trim() }]
      });
    } else if (line.startsWith('- ')) {
      blocks.push({
        _type: 'block',
        _key: Math.random().toString(36).substr(2, 9),
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        children: [{ _type: 'span', _key: Math.random().toString(36).substr(2, 9), text: line.replace(/^-\s+/, '').trim() }]
      });
    } else {
      // Parse inline formatting
      let text = line;
      const children = [];
      
      // Simple parser for **bold**, _italic_
      const regex = /(\*\*.*?\*\*|_.*?_|[^*_]+)/g;
      let matches = text.match(regex);
      
      if (matches) {
        for (const match of matches) {
          if (match.startsWith('**') && match.endsWith('**')) {
            children.push({
              _type: 'span',
              _key: Math.random().toString(36).substr(2, 9),
              text: match.slice(2, -2),
              marks: ['strong']
            });
          } else if (match.startsWith('_') && match.endsWith('_')) {
            children.push({
              _type: 'span',
              _key: Math.random().toString(36).substr(2, 9),
              text: match.slice(1, -1),
              marks: ['em']
            });
          } else if (match.trim()) {
            children.push({
              _type: 'span',
              _key: Math.random().toString(36).substr(2, 9),
              text: match
            });
          }
        }
      } else {
        children.push({
          _type: 'span',
          _key: Math.random().toString(36).substr(2, 9),
          text: text
        });
      }
      
      blocks.push({
        _type: 'block',
        _key: Math.random().toString(36).substr(2, 9),
        style: 'normal',
        children
      });
    }
  }
  
  return blocks;
}

const stories = {
  'eventStory-2026': `**Vergeet alles wat je dacht te weten over rally's.**

Dit is anders.

### Geen Klassieke Rally

Geen tijdsdruk. Geen verplichte checkpoints. Geen puntensysteem.

### Wat Je Wél Krijgt

**Complete rijvrijheid** op de beste wegen van België.

Vind je eigen ritme. Stop bij die ene bocht om hem nog eens te rijden. Bouw je dag zoals jij het wilt.

### Onze Filosofie

**Rijplezier** boven race-mentaliteit
**Community** boven competitie
**Verhalen** boven statistieken

Het gaat niet om wie het snelst finisht, maar om _wie met de grootste grijns aankomt_.

## Wat Blijft Hangen

Die hairpin waar je de perfecte apex vond.
Die spontane rit-maatjes onderweg.
Die onverwachte omweg met glasvlak asfalt.

's Avonds komen de verhalen: die close call, die verrassende route, dat moment waarop alles klopte.

**Dat zijn de momenten die je blijft vertellen.**

_Dit is meer dan een rally. Dit is waarom je rijdt._`,

  '9c07d78d-9708-4d24-beb2-e40ff8bd50a1': `De schoonheid van motorrijden zit in diversiteit.

Sommigen zoeken avontuur. Anderen flow. Beide zijn intens. Daarom twee formules.

## Adventure Track
_Voor ontdekkingsreizigers_

Jij bepaalt het verhaal. Wij geven waypoints, jij kiest de weg.

- Smalle landwegen waar je écht moet sturen
- Vergezichten die je moet zien
- Extra tijd bij die vette bochtenpartij

**Je krijgt de tools:** verborgen parels, technische stukken, relaxte omwegen.

Wat je ermee doet? Jouw keuze.

## Roadtrip Track
_Voor flow-zoekers_

Wij cureerden. Maanden getest. Elke kilometer zit erin.

- Wegen met perfecte leuning
- Ritme dat klopt
- Stops precies wanneer je ze nodig hebt

Download de GPX en rij. Simpel. Effectief.

En natuurlijk - afwijken mag altijd. Dit is Bochtenkoning.`,

  '7fe30809-a156-4859-9070-2ccba466348e': `Adventure is voor rijders die onderweg beslissen.

Geen voorgeschreven route. Het avontuur omarmen.

## Hoe Het Werkt

Waypoints geven richting aan. Tussen die punten? Jouw speelterrein.

**Je bochtenboek vol insider tips:**

- Verborgen landwegen die lekker slingeren
- Technische stukken met haarspeldbochten
- Plateauwegen met uitzicht

Suggesties, geen opdrachten. Gebruik ze, negeer ze, remix ze.

## De Enige Regel

**Dit is jouw dag, jouw motor, jouw route.**

Rij waar je wilt. Stop voor die bocht om hem opnieuw te pakken. Perfectioneer je lijn.

De enige verplichting? Arriveer met een grijns en een verhaal.`,

  'ba704e91-bdd7-4f7e-9c99-9d7440d13517': `Sommige dagen wil je gewoon rijden.

Geen planning. Geen navigatie-stress. Gewoon starten en gaan.

## Perfect Gecureerd

Maanden getest. Honderden kilometers.

**Elke bocht heeft flow:**
- Motor glijdt vanzelf doorheen
- Rechte stukken precies lang genoeg
- Stops komen wanneer je rust nodig hebt

## Het Resultaat

Eén lange flow:

- Scherpe hairpins waar je motor overhelt
- Snelle sweepers met ritme
- Technische secties die scherp houden
- Rustiger stukken om te genieten

Blijft boeien zonder te vermoeien.

## Gebruik

Download GPX. In je navigatie. Gas.

Laat de route je leiden. **En afwijken mag altijd.**

Zie je iets moois? Neem die afslag. Wil je een stuk herhalen? Draai om.`,

  '099974d2-32cf-4ffc-bcdd-4ea9bd31fba7': `Perfecte routes maken geen perfecte dagen.

Wat telt zijn de momenten:

- Die spontane rit met iemand op jouw tempo
- Die hand signals voor die perfecte bocht
- Die energie als je in sync rijdt

## De Magie Tussen Bochten

Wij selecteren wegen. Jij brengt energie.

Die grap op de parking. Dat gesprek bij de tankstop. Dat oogcontact in de bocht waar je allebei weet: _dít is het_.

## Rij Op Jouw Manier

**Solo?** Perfect. Stilte, eigen tempo, alleen met motor en weg.

**Sociaal?** Geweldig. Groepsenergie, samen die lijn vinden, gedeelde ervaringen.

Beide welkom. Beide gevierd.

## 's Avonds

Met een biertje komen verhalen los:

Die onverwachte omweg. Die close call. Die bocht waar alles klopte. Die random rijder die je hele middag plakte.

**Verhalen die resoneren. Die blijven hangen. Die dit bijzonder maken.**`,

  'ad9f0ff3-a94f-4143-a975-21c667a14928': `**Elk moment dat je vastlegt wordt deel van het grotere verhaal.**

## Jullie Content, Onze Legende

De rally leeft verder in jullie beelden:

- Die actieshot in de hairpin
- Die groepsfoto bij een onverwachte stop
- Die drone-beelden van perfecte formatie

Elk beeld draagt bij aan onze **collectieve uitstraling**.

## Deel Je Ervaringen

- **Foto's** van bochten, motors, crew, landschappen
- **Video's** met rijfootage, vlogs, drone shots
- **Stories** met real-time updates

### Maak Het Vindbaar

Gebruik **#Bochtenkoning2026**
Tag @deurdenbocht

Zo delen we jouw momenten en bouwen we samen aan het verhaal.

_Jouw lens, jouw perspectief, jouw bijdrage._`,

  '71f4bdd8-8184-4b30-961e-35654356b952': `Technologie met mate.

## De App Als Stille Partner

**Het principe:** jij minimaal bezig, wij weten dat je veilig bent.

**Werking:** inchecken bij zones. Scan, bevestiging, klaar.

Niet voor controle. Puur veiligheid. Als iemand lang wegblijft, handelen we proactief.

## Privacy Centraal

- Geen constante tracking
- Geen bewegingshistorie
- Geen afleidende notificaties

Alleen essentiële info voor veiligheid.

## Als Je Ons Nodig Hebt

Directe alarmfunctie voor nood.

**Eén druk:**
- Onmiddellijk contact
- Hulp coördinatie
- Je staat niet alleen

Simpel. Effectief. Hopelijk nooit nodig.`
};

async function updateStories() {
  console.log('📝 Updating event stories...\n');
  
  for (const [id, markdown] of Object.entries(stories)) {
    try {
      console.log(`   Updating ${id}...`);
      
      // First delete any draft
      try {
        await sanityClient.delete(`drafts.${id}`);
      } catch (e) {
        // No draft exists
      }
      
      const content = markdownToBlocks(markdown);
      
      // Update published document directly
      await sanityClient
        .patch(id)
        .set({ content })
        .commit();
      
      console.log(`   ✓ Updated\n`);
    } catch (error) {
      console.error(`   ✗ Error updating ${id}:`, error.message);
    }
  }
  
  console.log('✅ All stories updated!');
}

updateStories();
