# Deur Den Bocht – Volledige Content Gids 2026

> **Voor wie is dit document?**  
> Dit document is een complete hands-on gids voor wie de website beheert en de content aanvult. Het bevat de exacte teksten die op elke pagina moeten staan, gegroepeerd per pagina en per sectie. Sommige teksten worden beheerd in **Sanity Studio** (het CMS), andere staan rechtstreeks in de code. Voor elk onderdeel staat duidelijk vermeld waar het aangepast moet worden.

---

## STIJLGIDS — Zo klinkt Deur Den Bocht

### Stem & Toon

Deur Den Bocht klinkt als een enthousiaste vriend die je uitnodigt voor de rit van je leven — niet als een corporate bedrijf. De stemming is:

- **Informeel maar sterk.** We zeggen "je" en "jij", nooit "u".
- **Kort en gedurfd.** Geen lange zinnen beweren iets. Eén krachtige zin zegt meer.
- **Trots Belgisch.** Geen nep-Americanisme. Wel Vlaamse energie.
- **Inclusief.** Iedereen is welkom, groot of klein, ervaren of beginner.
- **Geen race. Nooit.** Dit woord mag nooit gebruikt worden om de rit te omschrijven. Het is een *beleving*, een *challenge*, een *ervaring*.

### Vaste Sleutelzinnen

Deze zinnen keeren terug door de hele site. Gebruik ze consequent:

| Zin | Context |
|-----|---------|
| `DEUR DEN BOCHT` | Evenementnaam, altijd in hoofdletters in headers |
| `THE 500` | Subtitle van het evenement |
| `De rit van je leven` | Hero-tagline variant |
| `500+ kilometer rijplezier` | Route samenvatting |
| `Geen race, puur rijplezier` | Altijd als het 'type' event uitgelegd wordt |
| `Vertrekt wanneer jij wil, stopt wanneer jij wil` | Vrijheid prop |
| `GADE MEE?` | Call-to-action header (volledig hoofdletter) |
| `TOT AAN CAFÉ DEN BELAMI, AALTER!` | Eindpunt / eindcall-to-action |
| `VZW DEUR DEN BOCHT` | Officiële naamvermelding |
| `Bochtenkoning` | Fun-titel, gebruikt in context van de winnaar of de sfeer |

### Headers

Grote paginatitels zijn altijd:
- Font-weight: **black** (900)
- Letter-spacing: smal (tracking-tight)
- In **hoofdletters** of met Capital Letters
- Met een **gradient** (primair blauw/paars naar accent oranje)
- Voorbeeld: `DEUR DEN BOCHT RALLY`, `WAT IS DEUR DEN BOCHT?`, `GADE MEE?`

### Alineatekst

- Maximaal 3 zinnen per paragraaf.
- Eerste zin is altijd de sterkst.
- Gebruik **bold** voor de kern van elke zin.
- Leesteken aan het eind: punten zijn optioneel voor lijstjes, maar verhogen soms de kracht.

### Lijstjes

Gebruik de `✓` markering voor voordelen en features. Geen bullets met streepjes of cirkels in de tekst zelf.  
Voorbeeld:
```
✓ Je rijdt 500+ km via de mooiste bochten
✓ Je vertrekt wanneer jij wil
✓ Je stopt wanneer jij wil
```

---

## VISUELE STIJLGIDS — Zo ziet Deur Den Bocht eruit

> Dit hoofdstuk beschrijft het complete visuele systeem van de site. Wie een nieuwe pagina bouwt of een bestaande aanpast, werkt altijd met deze regels. **Geen uitzonderingen zonder reden.**

---

### KLEURPALET

Het kleurverhaal is simpel: **teal (primair) + oranje (accent)**. Koud + warm. Rust + energie. Alles daartussen is grijs of wit.

#### Primaire kleur — Teal/Blauwgroen

| Token | Hex | Gebruik |
|-------|-----|---------|
| `primary-50` | `#f0f9fa` | Lichte achtergrond bij hover op kaarten |
| `primary-100` | `#d9f0f3` | Subtiele tints in secties |
| `primary-200` | `#b7e3e9` | Borders, scheidingslijnen |
| `primary-400` | `#52b2c2` | Gradiënt eindkleur pricing |
| `primary-500` | `#3798a8` | Basisteal — links, accenten |
| `primary-600` | `#2f7184` | **Hoofdkleur** — borders, iconen, actieve elementen |
| `primary-700` | `#2d6376` | Hover states op primaire kleur |
| `primary-800` | `#2d5161` | Donker blauw voor achtergronden |
| `primary-900` | `#294552` | Hero-achtergrond begin |
| `primary-950` | `#172c36` | Diepste donkerblauwe tint |

**Vuistregel:** Gebruik `primary-600` als de standaard "merk"-kleur voor borders en iconen. Gebruik `primary-900` tot `primary-700` als achtergrond voor gradients op hero-secties.

#### Accentkleur — Oranje

| Token | Hex | Gebruik |
|-------|-----|---------|
| `accent-50` | `#fff7ed` | Hover-achtergrond op accent-cards |
| `accent-400` | `#fb923c` | Lichte oranje tint |
| `accent-500` | `#f97316` | **Oranje CTA-knop begin** |
| `accent-600` | `#ea580c` | **Oranje CTA-knop einde / hover begin** |
| `accent-700` | `#c2410c` | Hover einde op CTA |

**Vuistregel:** Oranje is altijd de call-to-action kleur. Gebruik het uitsluitend voor de primaire actieknop ("Nu inschrijven") en statistieken-borders. Nooit als tekstkleur op een witte achtergrond.

#### Neutrale kleuren

| Token | Gebruik |
|-------|---------|
| `white` | Kaarten, sectie-achtergronden |
| `gray-50` (#f9fafb) | Alternerende sectie-achtergrond |
| `gray-100` | Input-achtergronden, tags |
| `gray-300` | Border voor secondaire knoppen |
| `gray-600` | Subtekst, labels |
| `gray-700` | Bodytekst |
| `gray-800` | Footer achtergrond |
| `gray-900` | Headlines, donkere tekst |

---

### TYPOGRAFIE

**Lettertype:** `Inter` (via Google Fonts) — variabel gewicht, opsz 14–32, gewicht 100–900.

```html
<!-- Al geladen in root.tsx — geen actie nodig -->
https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900
```

#### Gewichten in gebruik

| Gewicht | Tailwind-klasse | Gebruik |
|---------|----------------|---------|
| 900 — Black | `font-black` | **Grote paginatitels, hero-headlines** |
| 700 — Bold | `font-bold` | Kaart-titels, sectieopschriften |
| 600 — Semibold | `font-semibold` | Labels, subtitels, knoppen |
| 500 — Medium | `font-medium` | Navigatie-items, badges |
| 400 — Regular | *(standaard)* | Bodytekst, paragrafen |

#### Groottes — Responsive Schaal

Grote titels zijn altijd responsief geschaald. Dit is het standaard patroon voor sectie-opschriften:

```
text-3xl sm:text-4xl md:text-5xl lg:text-7xl
```

Hero-hoofdtitel (enkel op homepage):
```
text-4xl sm:text-5xl md:text-6xl lg:text-8xl
```

Bodytekst:
```
text-lg    (18px) — standaard alinea
text-xl    (20px) — intro-paragraaf
text-2xl   (24px) — grote intro op lichte achtergrond
```

Kleine labels en uppercase subtitels:
```
text-xs uppercase tracking-widest   — bijschriften boven een titel
text-sm uppercase tracking-wide     — navigatie, badges
```

#### Letter-spacing regels

- **Grote titels:** altijd `tracking-tight` — letters staan dichter op elkaar voor massa
- **Kleine uppercase labels:** altijd `tracking-widest` of `tracking-wide` — ruimte ademt
- **Bodytekst:** standaard (geen tracking-klasse)

---

### DE GRADIENT-TEKST

De `gradient-text`-klasse is de meest herkenbare stijleigenschap van de site. Het is een tekstkleur-gradient van primair-teal naar oranje, van links naar rechts.

**CSS definitie:**
```css
.gradient-text {
  background: linear-gradient(135deg, #2f7184 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Wanneer gebruiken:**
- Op elke grote sectie-opschrift (h1, h2) op een **witte of lichte achtergrond**
- NOOIT op een donkere of gekleurde achtergrond — gradient-tekst verdwijnt dan
- Op hero-secties (donkere achtergrond) gebruik je gewoon `text-white`

**Combinatie altijd:**
```
font-black tracking-tight gradient-text uppercase
```

---

### BORDER RADIUS — SCHERPE HOEKEN

DDB gebruikt consequent `rounded-sm` (2px) op bijna alle elementen. **Geen grote afgeronde hoeken** op functionele componenten.

| Klasse | Waarde | Gebruik |
|--------|--------|---------|
| `rounded-sm` | 2px | **Standaard** — kaarten, knoppen, inputvelden, badges |
| `rounded-lg` / `rounded-xl` | 8–12px | Enkel op visuele overlay-elementen in hero's (logo-badge, datum-badge) |
| `rounded-full` | Volledig rond | Profielfoto's, kleine icooncirkels |
| `rounded-2xl` | 16px | Grote logo-badge centraal in de homepage hero |

**Vuistregel:** Als het iets functioneels is (knop, kaart, formulierveld), is het `rounded-sm`.

---

### KNOPPEN

Er zijn drie soorten knoppen. Gebruik ze in de juiste context — mix ze niet.

#### 1. Primaire CTA — Oranje gradient (op donkere of lichte achtergrond)

```
bg-gradient-to-r from-accent-500 to-accent-600
hover:from-accent-600 hover:to-accent-700
text-white px-10 py-4 rounded-sm
text-lg font-black uppercase
transition-all duration-300 shadow-xl hover:shadow-2xl
```

**Voorbeeld:** "Nu inschrijven", "Schrijf je in"

---

#### 2. Secondaire ghost-knop — Op donkere (hero) achtergrond

```
bg-white/15 backdrop-blur-md
hover:bg-white/25
border-2 border-white/40
hover:border-white/60
text-white px-10 py-4 rounded-sm
text-lg font-black uppercase
transition-all duration-300
```

**Voorbeeld:** "Meer info over het event" naast de inschrijfknop in de hero

---

#### 3. Secondaire outline-knop — Op witte achtergrond

```
bg-white border-2 border-gray-300
hover:border-primary-600
text-gray-900 px-10 py-4 rounded-sm
text-lg font-bold uppercase
transition-colors
```

**Voorbeeld:** "Meer info" in de CTA-sectie op de homepage

---

### KAARTEN (CARDS)

#### Feature Card — `fancy-card`

Het basiskaart-patroon van de site. Wit, linker accent-border, zachte schaduw, hover-gradient.

```
bg-white p-8 rounded-sm shadow-md
border-l-2 border-primary-600
text-center
hover:bg-gradient-to-b hover:from-white hover:to-primary-50
transition-all duration-300 h-full
```

Een variant met oranje border (voor pricing/formulae):
```
border-l-2 border-accent-500
hover:to-accent-50
```

#### Stats Card

```
bg-white rounded-sm border-l-4 border-accent-500
p-8 text-center shadow-md hover:shadow-lg
transition-shadow
```

Het grote getal binnenin:
```
text-6xl sm:text-3xl md:text-4xl font-extrabold text-primary-600 mb-2
```

Het kleine label eronder:
```
text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider
```

#### Pricing Card — Aanbevolen (gemarkeerd)

```
bg-gradient-to-r from-primary-600 to-primary-400
shadow-2xl text-white rounded-sm p-10
```

#### Pricing Card — Normaal

```
border border-gray-200 shadow-lg rounded-sm p-10
```

---

### HERO-SECTIE OPBOUW

De hero-sectie is altijd het eerste wat een bezoeker ziet. De structuur is identiek op elke pagina.

```
┌─────────────────────────────────────────────┐
│  Achtergrond: foto of video (fixed/cover)   │
│  Overlay: bg-black/50 of gradient          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Logo badge (wit, backdrop-blur)    │    │
│  │  H1 — gradient-text of white       │    │
│  │  Subtitle — primary-100            │    │
│  │  Datum-badge — white/10 glasmorph  │    │
│  │  CTA knoppen                        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Technische klassen:**

Buitenste wrapper:
```
relative text-white min-h-screen overflow-hidden bg-cover bg-center bg-fixed
```

Content laag (bovenop de afbeelding):
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
relative z-20 h-full flex items-center justify-center
py-32 md:py-48
```

**Glasmorfisme badge** (gebruikt voor logo, datum, etc. op donkere achtergrond):
```
bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl
hover:backdrop-blur-lg transition-all duration-300
```

**Hero op subpagina's** (About, Rally — kleinere hero, geen fullscreen):
```
relative text-white overflow-hidden
```
Met content-breedte:
```
relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-20
```

---

### SECTIE-OPBOUW & RITME

Elke pagina is opgebouwd uit afwisselende secties. Het ritme is altijd:

```
HERO (donkere achtergrond — foto/gradient)
↓
SECTIE 1 — bg-white, py-16
↓
SECTIE 2 — bg-gray-50, py-20
↓
SECTIE 3 — bg-white, py-20
↓
SECTIE 4 — bg-gray-50, py-20
↓
FOOTER — bg-gray-800
```

**Elke sectie-container:**
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

**Sectie-opschrift — altijd gecentreerd:**
```html
<div class="text-center mb-12">
  <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl
             font-black text-gray-900 mb-4
             gradient-text tracking-tight uppercase">
    SECTIETITEL
  </h2>
  <p class="text-xl text-gray-700 max-w-3xl mx-auto">
    Optionele subtitel of intro-zin.
  </p>
</div>
```

---

### GRID-PATRONEN

#### 2-kolom inhoud + afbeelding

```
grid md:grid-cols-2 gap-12 items-center
```

Op de about-pagina wisselen de stories af: links/rechts. Oneven stories: tekst links, beeld rechts. Even stories: beeld links, tekst rechts (via `lg:flex-row-reverse` of `order-last`).

#### 3-kolom feature cards

```
grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8
```

#### 4-kolom statistieken

```
grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6
```

#### 2-kolom pricing

```
grid md:grid-cols-2 gap-8 max-w-5xl mx-auto
```

---

### PARALLAX AFBEELDINGEN (About-pagina)

De grote afbeeldingen op de About-pagina hebben een subtiel parallax-scroll effect. De structuur:

```html
<!-- Container: overflow hidden, vaste hoogte -->
<div class="lg:w-[48%] h-72 sm:h-[28rem] lg:h-auto
            relative overflow-hidden">

  <!-- Afbeelding: groter dan de container, verschuift bij scrollen -->
  <img class="w-full h-[125%] object-cover block
               will-change-transform -mt-[12.5%]" />

  <!-- Donkere overlay -->
  <div class="absolute inset-0 bg-black/20" />

  <!-- Groot watermark-getal (decoratief, semi-transparant) -->
  <div class="absolute bottom-6 left-6
               text-white/[0.12] text-[110px]
               font-black leading-none select-none">
    01
  </div>

</div>
```

Het JavaScript-scroll effect berekent de positie en verschuift de afbeelding verticaal (`translateY`) op basis van de scroll-positie.

---

### ICONEN

De site gebruikt een intern `<Icon>` component. Beschikbare namen:

```
bell, check, checkSimple, x, lightning, megaphone, target, chart,
flag, trophy, cloud, lightbulb, filter, refresh, clock, map, marker,
warning, alert-triangle, alert-circle, lock, users, document, search,
settings, phone, calendar, utensils, motorcycle, coffee, info, eye,
wave, crown, camera, book, clipboard, mail, award, rocket, cookie,
database, ban, building, door, star, heart, diamond, hourglass, trash,
home, shield, money, chevron-left, chevron-right, book-open, plus,
send, loader, message-circle, check-circle, info-circle, arrow-left,
cog, mountain, road, tree, party, user, arrow-back, alert, gift, bed
```

**Standaard gebruik in feature cards:**
```
className="w-20 h-20 mb-6 mx-auto text-accent-500"
```

**In hero stats-badges:**
```
className="w-5 h-5"
```

**In lijsten en formulieren:**
```
className="w-4 h-4" of className="w-5 h-5"
```

---

### HEADER

De header heeft twee standen:

**Transparant** (op de homepage hero-sectie):
```
<Header fixed transparent={true} />
```
→ Geen achtergrond, tekst wit, verdwijnt in de hero-foto

**Standaard** (op alle andere pagina's):
```
<Header />
```
→ Witte/donkere achtergrond, zichtbaar als vaste balk bovenaan

---

### FOOTER

De footer is altijd `bg-gray-800 text-white`. Structuur: 3 kolommen (Logo + Info, Navigatie, Contact) op desktop, 1 kolom op mobiel.

Kopjes in de footer:
```
font-bold mb-4 uppercase text-sm tracking-wide
```

Links in de footer:
```
text-gray-300 hover:text-white text-sm transition-colors
```

---

### FORMULIEREN

Alle inputvelden:
```
w-full px-4 py-2 border border-gray-300 rounded-sm
focus:ring-2 focus:ring-primary-500 focus:border-transparent
```

Labels:
```
block text-sm font-medium text-gray-700 mb-2
```

Foutmeldingen:
```
bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded
```

Succesmeldingen:
```
bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded
```

Info-meldingen:
```
bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded
```

---

### LEGE STATEN (EMPTY STATES)

Als een pagina geen data heeft (geen foto's, geen verhalen, geen check-ins), toon je altijd een lege staat. Structuur:

```html
<div class="text-center py-16">
  <!-- Icoon of illustratie -->
  <div class="text-6xl mb-4">📷</div>
  <!-- Of: -->
  <Icon name="camera" class="w-16 h-16 mx-auto mb-4 text-gray-300" />

  <h3 class="text-xl font-semibold text-gray-600 mb-2">
    Lege staat titel
  </h3>
  <p class="text-gray-500 max-w-sm mx-auto">
    Beschrijving waarom het leeg is en wanneer er content verschijnt.
  </p>
</div>
```

---

### DONKERE AUTHENTICATIEPAGINA'S

Login, wachtwoord vergeten, en reset-pagina's gebruiken een donkere gradient achtergrond (geen header/footer):

```
min-h-screen
bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700
flex items-center justify-center p-4
```

Het formulier-kaartje binnenin:
```
max-w-md w-full bg-white rounded-sm shadow-xl p-8
```

Dit geeft een donkere, meeslepende omgeving die de gebruiker tot actie aanzet (inloggen of registreren).

---

### AFBEELDING-RICHTLIJNEN

Gebruik afbeeldingen die bij het volgende profiel passen:

| Type | Richtlijn |
|------|-----------|
| **Hero's** | Dramatisch, breed, cineast. Motoren op wegen, geen groepsposefoto's. Prefereer landschapsperspectief. |
| **Story-afbeeldingen (About)** | Naturalistisch, niet geposeerd. Actie of sfeer. Riders op de weg, details van motors, landschappen. |
| **Profielfoto's** | Vierkant/cirkel, deelnemers vrij om te kiezen |
| **Sponsor-logo's** | 400×200px, PNG, witte achtergrond, grijs op hover → kleur |
| **Formaat** | Prefereer landscape (16:9 of 3:2) voor achtergronden. Portret (4:5) voor story-images op mobiel. |
| **Kleursfeer** | Warme herfstkleuren en groene lentekleuren passen bij de route. Geen koude of blauwe foto's — het event is in mei. |

**Altijd:** Zet een `alt`-tekst op elke afbeelding. Bondig en beschrijvend.

---

### NOTATIES — Hoe schrijf je klassen op

Wanneer je een nieuw pagina-element bouwt, volg dan de volgorde van Tailwind-klassen:

```
[Layout] [Sizing] [Spacing] [Flex/Grid] [Backgrounds] [Borders] [Text] [Interactivity] [Transitions]
```

Voorbeeld:
```
relative w-full max-w-7xl mx-auto px-4 py-20
flex flex-col items-center gap-8
bg-white
border-l-2 border-primary-600 rounded-sm shadow-md
text-center font-black text-gray-900
hover:bg-primary-50 cursor-pointer
transition-all duration-300
```

---

## DEEL 1: SANITY STUDIO CONTENT

> De volgende secties worden beheerd via **Sanity Studio** op `/sanity-studio`.  
> Log in op het studio-dashboard en navigeer naar het juiste content type.

---

## 1.1 — SITE CONFIGURATIE (`siteConfig`)

Ga in Sanity Studio naar **Site Configuratie** (er is slechts één document van dit type).

| Veld | Waarde |
|------|--------|
| `eventName` | `Deur Den Bocht` |
| `eventTagline` | `The 500 — Een unieke motordag door de mooiste bochten van België` |
| `seoTitle` | `Deur Den Bocht — Motorrit Rally 2026` |
| `seoDescription` | `Een unieke 500+ km motordag door België, Noord-Frankrijk en de Ardennen. Geen race, puur rijplezier. Inschrijven voor zondag 16 mei 2026.` |
| `maxRegistrations` | *(vul in naargelang de capaciteit, bv. 150)* |
| `spotifyPlaylistUrl` | *(optioneel: link naar de DDB Spotify playlist)* |

**Hero Video / Afbeelding:** Upload een dramatische foto of video van motoren op een kronkelende bergweg. Geen mensen op de voorgrond — enkel de weg, de motoren en de horizon.

---

## 1.2 — HOMEPAGE CONTENT (`pageContent`)

In Sanity Studio, ga naar **Pagina Content → Homepage**. Er zijn de volgende secties (elk een apart document):

---

### Sectie: `hero-quote`

**Veld: Title**
```
De Rit van Je Leven
```
*(Dit verschijnt als de grote headline op de hero. Let op: de HTML rendert dit in gigantische kleur-gradient letters. Kort en krachtig werkt het best. Max 5 woorden.)*

**Veld: Content** *(als Portable Text)*
```
Zondag 16 mei 2026. 500+ km. België, Noord-Frankrijk, de Ardennen.
Geen race. Geen tijdsdruk. Puur rijplezier — op jouw tempo.
```

---

### Sectie: `final-cta`

**Veld: Title**
```
GADE MEE?
```

**Veld: Content** *(als Portable Text)*
```
TOT AAN CAFÉ DEN BELAMI, AALTER!
Schrijf je vandaag nog in en zorg dat je erbij bent.
Plaatsen zijn beperkt.
```

---

### Sectie: `what-is-it`

**Veld: Title**
```
Wat is Deur Den Bocht?
```

**Veld: Content** *(als Portable Text)*

Paragraaf 1:
```
Deur Den Bocht — The 500 is een all-day challenge ride waarbij je 500+ kilometer rijdt door België, Noord-Frankrijk en de Ardennen. Geen wedstrijd, geen tijdslimiet, geen snelwegen.
```

Paragraaf 2:
```
Je rijdt de mooiste bochten van onze regio's, op jouw tempo, via een zorgvuldig uitgestippelde GPX-route. Onderweg passeer je 4 rally zones waar je optioneel kunt inchecken, uitdagingen aanvaarden en foto's maken met de community.
```

Paragraaf 3:
```
Het evenement wordt georganiseerd door VZW Deur Den Bocht — een groep motorliefhebbers die overtuigd zijn dat de mooiste ritten gedeelde ritten zijn.
```

*(De ✓-lijstjes onder dit blok worden automatisch getoond als fallback. Als je de Content invult via Portable Text, worden die lijstjes vervangen door jouw tekst.)*

---

### Sectie: `rally-intro`

**Veld: Title**
```
Hoe werkt de Rally?
```

**Veld: Content** *(als Portable Text)*
```
De route van Deur Den Bocht is opgebouwd uit 4 rally zones — elk een regio met zijn eigen karakter. Groen, geel, oranje en rood: van de vlakke Vlaamse weiden naar de steilste Ardense bochten.

Binnen elke zone vind je route tips: GPX-bestanden, hoogtepunten, en optionele uitdagingen. Check in via je telefoon, maak foto's, en volg je vrienden live op de kaart.

De zones zijn optioneel. De rit is vrij. Maar wie alle 4 zones haalt — die verdient de titel.
```

---

## 1.3 — STATISTIEKEN (`stats`)

In Sanity Studio, ga naar **Statistieken** (of Stats) en maak de volgende 4 items aan:

| Icon (emoji) | Value | Label |
|---|---|---|
| 🏍️ | `500+` | `Kilometer rijplezier` |
| 🗺️ | `4` | `Rally zones` |
| 🏆 | `2` | `Rijformules` |
| 👥 | `150` | `Deelnemers max.` |

*(Pas de cijfers aan naargelang de actuele editie. Het `icon`-veld verwacht een enkel emoji-karakter.)*

---

## 1.4 — FEATURE CARDS (`featureCards`, groep: `rally-features`)

In Sanity Studio, ga naar **Feature Cards** en maak cards aan met de tag/groep `rally-features`. Dit zijn de 3 à 6 blokken die op de homepage getoond worden onder het "Wat is het?" blok.

**Card 1**

| Veld | Waarde |
|------|--------|
| `title` | `Je eigen tempo` |
| `description` | `Geen startschot, geen tijdslimiet. Jij vertrekt wanneer jij wil en rijdt de rit op jouw manier.` |
| `icon` | `motorcycle` |

**Card 2**

| Veld | Waarde |
|------|--------|
| `title` | `500+ km bochten` |
| `description` | `Een uitgestippelde GPX-route door de mooiste wegen van België, Noord-Frankrijk en de Ardennen. Geen snelwegen.` |
| `icon` | `road` |

**Card 3**

| Veld | Waarde |
|------|--------|
| `title` | `4 Rally Zones` |
| `description` | `Optionele checkpoints doorheen de route. Check in, voltooi uitdagingen en ontgrendel achievements.` |
| `icon` | `flag` |

**Card 4**

| Veld | Waarde |
|------|--------|
| `title` | `Community` |
| `description` | `Deel foto's, volg je rijmaten live op de kaart en schrijf je eigen verhaal in het ritboek van de dag.` |
| `icon` | `users` |

**Card 5**

| Veld | Waarde |
|------|--------|
| `title` | `Achievements` |
| `description` | `Verdien badges voor elke zone die je aandoet, elke foto die je deelt, elke uitdaging die je voltooit.` |
| `icon` | `trophy` |

**Card 6**

| Veld | Waarde |
|------|--------|
| `title` | `Inclusief ontbijt` |
| `description` | `Elke deelnemer start de dag met een stevig ontbijt. Kies de volledige formule en geniet ook van de warme maaltijd bij aankomst.` |
| `icon` | `coffee` |

---

## 1.5 — SPONSORS (`sponsors`)

In Sanity Studio, ga naar **Sponsors** en voeg de sponsors van de editie toe. Elk sponsor-record bevat:
- `name`: Naam van het bedrijf
- `logo`: Afbeelding (400×200px, PNG op witte achtergrond)
- `website`: URL
- `order`: Volgorde (1, 2, 3, ...)

*(Geen sponsors nog? Maak een placeholder aan met `"Sponsor ons evenement"` en het emailadres `vzwddb@gmail.com`.)*

---

## 1.6 — PRIJSFORMULES (`pricingTiers`)

In Sanity Studio, ga naar **Prijsformules**. Er zijn twee formules:

**Formule 1: Met alle maaltijden**

| Veld | Waarde |
|------|--------|
| `name` | `Met alle maaltijden` |
| `price` | `45` |
| `description` | `Ontbijt bij de start en een warme maaltijd bij aankomst inbegrepen.` |
| `features` | `Ontbijt bij start`, `Warme maaltijd bij aankomst`, `GPX-route en Bochtenboek`, `Toegang tot alle rally zones`, `Deelnemer-badge` |
| `highlighted` | `true` (dit is de aanbevolen formule) |
| `badge` | `Meest gekozen` |

**Formule 2: Enkel ontbijt**

| Veld | Waarde |
|------|--------|
| `name` | `Enkel ontbijt` |
| `price` | `25` |
| `description` | `Inclusief ontbijt bij de start. Maaltijd bij aankomst niet inbegrepen.` |
| `features` | `Ontbijt bij start`, `GPX-route en Bochtenboek`, `Toegang tot alle rally zones`, `Deelnemer-badge` |
| `highlighted` | `false` |

---

## 1.7 — ABOUT PAGINA: EVENT STORIES (`eventStory`)

Dit zijn de grote inhoudelijke blokken op de About-pagina. Ze verschijnen als afwisselende secties met beeld links/rechts. Maak de volgende 4 stories aan in Sanity Studio onder **Event Stories**.

Zorg dat elke story gekoppeld is aan de actieve editie via het `edition`-veld.

---

### Story 1 — "Zo werkt het"

| Veld | Waarde |
|------|--------|
| `title` | `Zo werkt het` |
| `subtitle` | `Jouw dag, jouw regels` |
| `order` | `1` |

**Content** *(Portable Text — meerdere alinea's)*:

```
Deur Den Bocht is geen georganiseerde stoet en geen wedstrijd. Het is een vrije dag op twee wielen, met een gemeenschappelijke route en een gemeenschappelijk eindpunt.

Op de dag zelf kies jij wanneer je vertrekt. De GPX-route staat klaar in je dashboard. Die downloadt je naar je GPS of telefoon en dan ben je weg. Er is geen startschot, geen marshal, niemand die je begeleidt. Enkel de weg voor je neus.

Onderweg passeer je 4 rally zones. Dat zijn gebieden — geen exacte punten — waar je via de app kunt inchecken met je QR-code. Binnen elke zone vind je route tips: aanbevolen ritten met optionele uitdagingen op bestimmte locaties. Je kiest zelf welke je volgt.

Aan het einde rij je naar het eindpunt in Aalter. Café Den Belami. Een pint, een maaltijd, en verhalen uitwisselen over de rit. Dat is Deur Den Bocht.
```

**Highlights** *(korte bulletpunten naast de afbeelding)*:
```
Vrije rit — jouw tempo
500+ km via mooiste wegen
4 optionele rally zones
Eindpunt: Café Den Belami, Aalter
```

**Afbeelding:** Bovenaanzicht van een motorrijder op een kronkelende weg door een groen landschap. Of twee motoren naast elkaar op een landweg.

---

### Story 2 — "De Route"

| Veld | Waarde |
|------|--------|
| `title` | `De Route` |
| `subtitle` | `500 kilometer zonder snelweg` |
| `order` | `2` |

**Content** *(Portable Text)*:

```
De GPX-route van Deur Den Bocht is elk jaar opnieuw uitgestippeld met één doel: zoveel mogelijk bochten, zoveel mogelijk mooie wegen, zo weinig mogelijk rechte stukken.

De rit vertrekt vanuit de Vlaamse Ardennen, trekt richting de Franse grens, doorsnijdt de Sambre-vallei en eindigt in de Hoge Ardennen rond Spa en Malmedy. Over de terugrit — via de Maas-vallei en de heuvels van Haspengouw — ga je begrijpen waarom mensen jaar na jaar terugkomen.

Geen snelwegen. Nooit. Dat is geen regel die we opleggen uit principe — het is gewoon logisch. Op een snelweg rij je kilometer na kilometer. Op een landweg rij je bocht na bocht.

De volledige GPX-route staat beschikbaar in je dashboard na inschrijving. Je kiest zelf hoe je die volgt: met een GPS op het stuur, op je telefoon, of gewoon met gevoel en de route tips als leidraad.
```

**Highlights**:
```
België, Noord-Frankrijk, Ardennen
Nul snelwegen — 100% bochten
Route beschikbaar als GPX-download
Twee varianten: Adventure Track & Scenic Route
```

**Afbeelding:** Luchtfoto van een slingerende bergweg in de Ardennen, liefst met een motorrijder zichtbaar.

---

### Story 3 — "Rally Zones & Uitdagingen"

| Veld | Waarde |
|------|--------|
| `title` | `Rally Zones & Uitdagingen` |
| `subtitle` | `Voor wie meer wil dan rijden` |
| `order` | `3` |

**Content** *(Portable Text)*:

```
De 4 rally zones zijn het avontuurlijke hart van Deur Den Bocht. Elke zone is een regio met zijn eigen karakter: van de zachte heuvels van het Hageland tot de rotsige kammen van de Hoge Venn.

Bij elke zone hoort een QR-code check-in, een set route tips en een reeks optionele uitdagingen. Die uitdagingen kunnen van alles zijn: een foto nemen op een bepaalde locatie, een historisch gebouw herkennen, een uitzichtpunt bereiken dat je zonder de tip nooit zou gevonden hebben.

Wie alle 4 zones aandoet en de uitdagingen voltooit, kan de volledige rally voltooien — en dat telt. Niet voor een prijs, maar voor de voldoening. En voor de Achievements die je verdient.

De zones zijn altijd optioneel. Je mag ook gewoon doorrijden. Niemand kijkt. Maar als je ze ooit eens gedaan hebt, rij je ze de volgende keer niet meer voorbij.
```

**Highlights**:
```
4 zones, elk eigen karakter
Check-in via QR-code in de app
Optionele uitdagingen per locatie
Achievements te verdienen
```

**Afbeelding:** Foto van iemand die zijn telefoon toont met de app open bij een bord of monument. Of een groep motoren geparkeerd bij een pittoresk uitzichtpunt.

---

### Story 4 — "De Community"

| Veld | Waarde |
|------|--------|
| `title` | `De Community` |
| `subtitle` | `Alleen op de weg, samen in het verhaal` |
| `order` | `4` |

**Content** *(Portable Text)*:

```
Deur Den Bocht is een vrije rit — maar het is geen solo-avontuur. De community is wat het evenement jaar na jaar doet groeien.

Via de app deel je foto's die verschijnen in de galerij van alle deelnemers. Je ziet wie er op de rit is, waar ze zijn inchecked, en welke uitdagingen ze al voltooid hebben. Je kunt rijmaten koppelen als "Naftgenoten" en elkaars locatie volgen op de live kaart.

Aan het einde van de dag schrijf je een verhaal. Een paar zinnen of een heel verslag — dat bepaal jij. Die verhalen worden verzameld in het digitale ritboek van de editie: een herinnering die blijft, lang nadat de motoren terug in de garage staan.

Deur Den Bocht begon als een avond tussen vrienden. Het is uitgegroeid tot een community van mensen die allemaal hetzelfde geloven: de mooiste wegen zijn de bochtige.
```

**Highlights**:
```
Foto's delen in de live galerij
Naftgenoten koppelen & live volgen
Verhalen schrijven in het ritboek
Elk jaar een groeiende community
```

**Afbeelding:** Groepsfoto van deelnemers bij de aankomst in Aalter. Motoren op de achtergrond, bierglazen geheven. Of een evening shot bij het eindpunt.

---

## 1.8 — ABOUT PAGINA: DAG-PROGRAMMA (`scheduleItem`)

In Sanity Studio, ga naar **Programma** en maak de volgende items aan. Elk item heeft: `time`, `title`, `description`, `icon`, `order`.

| Time | Title | Description | Icon |
|------|-------|-------------|------|
| `Vanaf 07:00` | `Registratie & Ontbijt` | `Kom langs bij het startpunt in Aalter. Je registreert je aan de balie, ontvangt je materiaal en geniet van het startontbijt. Geen haast — je vertrekt wanneer jij wil.` | `coffee` |
| `08:00 – 11:00` | `Start van de rit` | `Deelnemers vertrekken in hun eigen tempo. De GPX-route staat klaar in de app. Volg de route, rij je eigen lijn, en kijk naar de zone-indicaties op de kaart.` | `motorcycle` |
| `Doorlopend` | `Rally Zones aandoen` | `Onderweg passeer je 4 rally zones. Check in via je QR-code, volg de route tips en doe de uitdagingen als je wil. Of sla ze gewoon over — het is jouw rit.` | `flag` |
| `Doorlopend` | `Foto's & Verhalen` | `Deel je mooiste momenten in de app. Foto's verschijnen live in de galerij voor alle deelnemers. Elk uur een nieuw hoogtepunt van iemand anders.` | `camera` |
| `Vanaf 16:00` | `Aankomst Eindpunt` | `Rij richting Café Den Belami in Aalter. Zet je motor af, neem een welverdiende pint en wissel de verhalen van de dag uit.` | `home` |
| `17:00 – 20:00` | `Nafeest & Maaltijd` | `Deelnemers met de volledige formule genieten van een warme maaltijd. Achievements worden ontgrendeld, de foto van de dag wordt gekozen, en de Bochtenkoning wordt bekendgemaakt.` | `trophy` |

---

## 1.9 — ABOUT PAGINA: VOORDELEN (`benefitItem`)

In Sanity Studio, ga naar **Voordelen**. Elk item heeft een `category` (ofwel `everyone` ofwel `winner`).

### Categorie: `everyone` — Wat krijgt elke deelnemer?

| Title | Description | Icon |
|-------|-------------|------|
| `Volledig uitgestippelde GPX-route` | `De complete route downloadbaar voor je GPS of telefoon. Inclusief alle rally zones en route tips.` | `map` |
| `Startontbijt` | `Een stevig ontbijt bij de start — want op een lege maag rij je geen 500 km.` | `coffee` |
| `Digitaal Bochtenboek` | `Het officiële roadbook van de editie met alle route-informatie, zones en highlights. Downloadbaar als PDF.` | `book-open` |
| `Deelnemer-QR badge` | `Je persoonlijke QR-code voor check-ins bij de rally zones. Jouw uniek ticket voor de dag.` | `award` |
| `Toegang tot de app` | `Real-time kaart, live galerij, achievement-tracker en naftgenoten-functie. Alles voor een vlotte rit.` | `phone` |
| `Community & Galerij` | `Deel foto's, lees verhalen van andere deelnemers en herbeleef de dag in de live galerij.` | `users` |

### Categorie: `winner` — Wat verdient de Bochtenkoning?

| Title | Description | Icon |
|-------|-------------|------|
| `De Bochtenkoning-trofee` | `Handgemaakt, uniek, en elk jaar anders. De winnaar neemt hem mee naar huis.` | `trophy` |
| `Eeuwige roem op de Hall of Fame` | `Je naam en foto staan permanent op de websit — editie na editie.` | `crown` |
| `Gratis inschrijving volgend jaar` | `De winnaar mag gratis terugkomen voor de volgende editie. Dat is het enige voordeel — de rit is de beloning.` | `gift` |

---

## 1.10 — ABOUT PAGINA: FAQ (`faqItem`)

In Sanity Studio, ga naar **FAQ**. Elk item heeft een `question` en een `answer`.

---

**Vraag 1**
- **Question:** `Is Deur Den Bocht een wedstrijd?`
- **Answer:** `Nee, absoluut niet. Er is geen tijdmeting, geen startrangschikking en geen juryposten. De "Bochtenkoning" is een eretitel voor de deelnemer die alle 4 rally zones aandoet en de meeste uitdagingen voltooit — maar er hangt geen prijs aan vast. De rit is de beloning.`

**Vraag 2**
- **Question:** `Moet ik de volledige route rijden?`
- **Answer:** `Nee. Je rijdt zoveel of zo weinig als je wil. De GPX-route is 500+ km, maar niemand dwingt je om alles af te rijden. Sommige deelnemers rijden enkel de zones die ze willen aandoen, anderen rijden de volledige route. Alles is toegestaan.`

**Vraag 3**
- **Question:** `Wat als ik een panne heb of niet verder kan?`
- **Answer:** `Ernstige technische of medische problemen meld je via de noodknop in de app of via de WhatsApp-groep van de dag. De organisatoren zijn bereikbaar en er zijn locaties langs de route waar je terecht kunt. Zorg dat je je motor goed controleert voor de rit en dat je een basisgereedschap meeneemt.`

**Vraag 4**
- **Question:** `Wat is het verschil tussen Adventure Track en Scenic Route?`
- **Answer:** `Adventure Track is de volledige beleving: je hebt toegang tot de rally zones, kunt inchecken via QR-code, en doet mee aan de uitdagingen en achievements. Scenic Route is de pure rijbeleving: dezelfde GPX-route, maar zonder check-ins of challenges. Perfect als je gewoon wil rijden zonder gedoe.`

**Vraag 5**
- **Question:** `Moet ik een motorrijbewijs A hebben?`
- **Answer:** `Je hebt een geldig motorrijbewijs nodig — A of A2. Je motor moet wettelijk in orde zijn: geldig rijbewijs, verzekering en keuring. Minimumleeftijd is 18 jaar.`

**Vraag 6**
- **Question:** `Kan ik met een passagier rijden?`
- **Answer:** `Dat is mogelijk als je motor er geschikt voor is en je een passagierszadel en -voetsteunen hebt. Let op: de passagier is niet apart ingeschreven en telt niet mee voor de rally zones. Zorg wel dat je passagier een helm draagt die voldoet aan de normen.`

**Vraag 7**
- **Question:** `Wanneer krijg ik de GPX-route?`
- **Answer:** `De GPX-route wordt beschikbaar gesteld in je dashboard kort voor de dag van het evenement. Je kiest zelf of je de route laad op een GPS, smartphone of via een app als Google Maps of Waze. We raden een dedicated GPS aan voor langere ritten.`

**Vraag 8**
- **Question:** `Wat is inbegrepen in mijn inschrijving?`
- **Answer:** `Beide formules bevatten: startontbijt, digitaal Bochtenboek, GPX-route, toegang tot alle rally zones en je persoonlijke QR-badge. De formule "Met alle maaltijden" bevat daarnaast ook een warme maaltijd bij aankomst in Aalter.`

**Vraag 9**
- **Question:** `Kan ik mijn inschrijving annuleren?`
- **Answer:** `Annulering tot 30 dagen voor het evenement geeft recht op 50% terugbetaling. Annulering binnen 30 dagen voor het evenement geeft geen recht op terugbetaling. Stuur je annulering altijd per e-mail naar vzwddb@gmail.com.`

**Vraag 10**
- **Question:** `Hoe werkt het papieren roadbook?`
- **Answer:** `Het papieren roadbook is een optionele add-on bij registratie. Je ontvangt het fysieke boekje aan de start in Aalter. Het bevat alle route-informatie, zone-overzichten en tips — ideaal als je liever niet met je telefoon rijdt of als aanvulling op de GPS.`

---

## 1.11 — RALLY ZONES (`rallyZone`)

In Sanity Studio, ga naar **Rally Zones**. Er zijn 4 zones. Elke zone heeft een `title`, `description`, `color`, `order`, en de bijbehorende route tips.

> **Noot:** De kleuren corresponderen met de kleur-badge in de UI: groen → eenvoudiger/start, geel → gemiddeld, oranje → uitdagend, rood → zwaarste zone.

---

### Zone 1 — Groene Zone

| Veld | Waarde |
|------|--------|
| `title` | `De Vlaamse Ardennen` |
| `color` | `green` |
| `order` | `1` |
| `is_open` | `true` |

**Description:**
```
De eerste rally zone voert je door de typische Vlaamse Ardennen: korte maar steile hellingen, pittoreske landbouwwegen en uitzichten over de Scheldemeersen. Dit is het thuisgebied — bekend, maar nooit saai. Wie hier goed start, heeft de juiste mindset voor de rest van de dag.
```

**Route Tips (voorbeelden — aan te vullen met echte GPX-data):**

*Route Tip 1.1:*
- Naam: `Kluisberg Lus`
- Beschrijving: `De klassieke motorfietslus over de Kluisberg en door de Ronde van Vlaanderen-beklimmingen. Technisch maar toegankelijk.`
- Moeilijkheidsgraad: `easy`

*Route Tip 1.2:*
- Naam: `Hotond & Muziekbos`
- Beschrijving: `Een slingerende lus door het Muziekbos met uitzicht op de Vlaamse heuvels. Stop bij de Hotondtoren voor een foto.`
- Moeilijkheidsgraad: `easy`

---

### Zone 2 — Gele Zone

| Veld | Waarde |
|------|--------|
| `title` | `Het Haspengouw` |
| `color` | `yellow` |
| `order` | `2` |
| `is_open` | `true` |

**Description:**
```
Haspengouw in de lente is één groot fruitboomlandschap. De witte bloesems in mei geven de trage bochtige provinciale wegen een bijna magische sfeer. Langzaam rijden is hier geen zwakheid — het is de enige logische keuze.
```

*Route Tip 2.1:*
- Naam: `Bloesemroute`
- Beschrijving: `De beroemde bloesemroute van Sint-Truiden naar Borgloon langs de fruitgaarden. In mei een must.`
- Moeilijkheidsgraad: `easy`

*Route Tip 2.2:*
- Naam: `Maaslandse Hellingen`
- Beschrijving: `Weg van de bloesems, richting de Maas. Korte maar venijnige hellingen en een panoramisch zicht op de rivier.`
- Moeilijkheidsgraad: `medium`

---

### Zone 3 — Oranje Zone

| Veld | Waarde |
|------|--------|
| `title` | `De Ardennen` |
| `color` | `orange` |
| `order` | `3` |
| `is_open` | `true` |

**Description:**
```
Hier begint de rit pas echt. De Ardennen zijn het hart van elke longrechtse motorier: dichte wouden, diep ingesneden rivierdalen, onverwachte bochten en wegen die amper breder zijn dan je stuur. Verplichte stop: de Ourthe-vallei.
```

*Route Tip 3.1:*
- Naam: `Ourthe Lus`
- Beschrijving: `Een grotelus langs de Ourthe van La Roche naar Hotton. De weg volgt elke bocht van de rivier. Technisch, smal en absoluut spectaculair.`
- Moeilijkheidsgraad: `hard`

*Route Tip 3.2:*
- Naam: `Roche-en-Ardenne Panorama`
- Beschrijving: `De weg boven La Roche geeft een panoramisch uitzicht op het kasteel en de rivier. Stop hier voor de verplichte foto.`
- Moeilijkheidsgraad: `medium`

---

### Zone 4 — Rode Zone

| Veld | Waarde |
|------|--------|
| `title` | `De Hoge Venn` |
| `color` | `red` |
| `order` | `4` |
| `is_open` | `true` |

**Description:**
```
De rode zone is de klap op de vuurpijl. Het Hoge Venn, Malmedy, de Circuit de Spa-Francorchamps — dit zijn wegen die motorlegenda's schreven. Wie hier aankomt, weet dat 500 km rijden geen mythe is. De rode zone is zwaar. Terecht.
```

*Route Tip 4.1:*
- Naam: `Spa-Malmedy Ring`
- Beschrijving: `De klassieke lus over de publieke wegen rond het Spa-Francorchamps circuit. Niet de piste zelf — maar de wegen errond die even snel aanvoelen.`
- Moeilijkheidsgraad: `hard`

*Route Tip 4.2:*
- Naam: `Hoog Venn Traverse`
- Beschrijving: `Dwars door het Venn via de N676. Open landschap, geen beschutting, en een wind die je doet vergeten dat je in België bent. Spectaculair bij elke weersomstandigheid.`
- Moeilijkheidsgraad: `hard`

---

---

## DEEL 2: STATISCHE PAGINA-CONTENT

> De volgende pagina's hebben content die rechtstreeks in de React-code staat. Een developer moet de teksten aanpassen in de corresponderende bestanden.

---

## 2.1 — INSCHRIJVEN (`/registration`)

**Bestand:** `apps/web/app/routes/registration._index.tsx`

Deze pagina bevat een inschrijfformulier. De teksten zijn in grote mate al aanwezig, maar de volgende secties behoeven verbetering of aanvulling:

---

### Hero / Intro van de pagina

Momenteel is er geen duidelijke hero-intro op de registratiepagina. Voeg boven het formulier het volgende toe:

**Hoofdtitel:**
```
Schrijf je in voor Deur Den Bocht 2026
```

**Subtitle:**
```
Zondag 16 mei 2026 · Aalter · 500+ km · Geen snelwegen · Puur rijplezier
```

**Introductietekst (klein, grijze tekst):**
```
Vul je gegevens hieronder in. Na betaling ontvang je onmiddellijk je bevestiging en QR-code per e-mail. Je kunt dan direct inloggen op je dashboard.
```

---

### Formulier Sectietitels & Hulpteksten

De formuliersecties hebben al titels maar kunnen meer context gebruiken:

**Sectie: "Persoonlijke gegevens"**
- *Geen wijzigingen nodig.*

**Sectie: "Je motor"**
- Hulptekst (onder de sectietitel): `We gebruiken je motorgegevens voor administratie en om je QR-badge te personaliseren.`

**Sectie: "Kies je formule"**
Bij elke formule-kaart wordt de prijs getoond. Zorg dat de volgende teksten aanwezig zijn:

*Formule "Met alle maaltijden" — €45:*
```
Inbegrepen: startontbijt + warme maaltijd bij aankomst
```

*Formule "Enkel ontbijt" — €25:*
```
Inbegrepen: startontbijt
Eigen rekening bij aankomst.
```

**Sectie: "Kies je route voorkeur"**
De huidige tekst is goed. Geen aanpassingen nodig.

**Sectie: "Extra optie" (Papieren Roadbook)**
Als de feature flag actief is:
```
Ik wil een papieren roadbook ontvangen (+€0)
```
*(Voeg toe of verwijder de prijs naargelang de keuze van de organisator.)*

---

### Spotsresterende Banner

Als er nog spots beschikbaar zijn, toont de pagina al een teller. De teksten die hierbij horen:

```
Snel erbij! Nog [X] plaatsen beschikbaar.
```

Als de spots bijna op zijn (< 10%):
```
⚠️ Bijna vol! Slechts [X] plaatsen meer.
```

---

## 2.2 — INSCHRIJVING GESLAAGD (`/registration/success`)

**Bestand:** `apps/web/app/routes/registration.success.tsx`

Deze pagina is functioneel. De bestaande content is correct maar kan warmer. Vervang/verbeter:

**Bestaande h1:**
```
Inschrijving geslaagd!
```
*(Goed — behouden.)*

**Bestaande subtitle:**
```
Welkom bij Deur Den Bocht, [Voornaam]!
```
*(Goed — behouden.)*

**Vervang de "Volgende stappen" lijst door:**

```
Stap 1: Check je inbox
Je hebt zojuist een bevestigingsmail ontvangen op [e-mailadres]. Daarin staat je QR-code en alle informatie voor de dag zelf.

Stap 2: Log in op je dashboard
Gebruik het wachtwoord dat je net aanmaakte. In je dashboard vind je de GPX-route, je Bochtenboek, en alle updates van de organisatie.

Stap 3: Sla je QR-code op
Jouw persoonlijke QR-code is je toegangsticket voor de rally zones. Sla hem op je telefoon op of print hem uit als backup.

Stap 4: Bereid je voor
Download de GPX-route op je GPS. Controleer je remdistance — letterlijk. En volg ons op sociale media voor updates in de aanloop naar 16 mei.
```

**Knop tekst:**
```
Naar mijn dashboard →
```

---

## 2.3 — INLOGGEN (`/login`)

**Bestand:** `apps/web/app/routes/login.tsx`

De loginpagina is minimalistisch en functioneel. Kleine aanpassingen voor betere sfeer:

**Bestaande h1:**
```
🏍 Deur Den Bocht
```

**Vergroot dit naar:**
```
Deur Den Bocht
```
*(Verwijder de emoji uit de h1 — zet hem liever als standalone afbeelding of logo.)*

**Bestaande subtitle:**
```
Inloggen op je account
```

**Vervang door:**
```
Welkom terug. Log in op je dashboard.
```

**Link "Nog geen account?":**
```
Nog geen account? Schrijf je in voor de rit van je leven →
```

**Foutmelding (bij verkeerde credentials):**
```
Ongeldige inloggegevens. Controleer je e-mail en wachtwoord. Vergeten? Gebruik "Wachtwoord vergeten".
```

---

## 2.4 — WACHTWOORD VERGETEN (`/forgot-password`)

**Bestand:** `apps/web/app/routes/forgot-password.tsx`

**Bestaande h1:**
```
Wachtwoord vergeten
```
*(Goed — behouden.)*

**Bestaande subtitle:**
```
We sturen je een link om je wachtwoord te resetten.
```

**Verbeter naar:**
```
Geen nood. Geef je e-mailadres en we sturen je een reset-link.
```

**Succesmelding:**
```
Als dit e-mailadres bij ons bekend is, ontvang je over enkele minuten een bericht met een resetlink. Controleer ook je spamfolder.
```

**Link terug naar login:**
```
← Terug naar inloggen
```

---

## 2.5 — FOTOGALERIJ (`/gallery`)

**Bestand:** `apps/web/app/routes/gallery.tsx`

De galerij is een besloten sectie (enkel voor ingelogde deelnemers). De texten op de pagina:

**Paginatitel:**
```
Fotogalerij — Deur Den Bocht 2026
```

**Lege staat — als er nog geen foto's zijn:**
```
Geen foto's gevonden.
De galerij wordt gevuld naarmate deelnemers foto's uploaden op de dag van het event. Kom terug op 16 mei!
```

**Upload-knop:**
```
+ Foto uploaden
```

**Upload-dialoog titel:**
```
Deel je moment
```

**Upload-dialoog subtitle:**
```
Leg vast wat je ziet. Van een spectaculair bergpad tot de maaltijd bij aankomst — elk beeld telt.
```

**Upload-constraints info:**
```
Max. 10 MB per foto. Enkel JPG of PNG.
EXIF-locatiedata wordt automatisch verwijderd voor je privacy.
```

**Like-knop tooltip:**
```
Like deze foto
```

**Tag-knop tooltip:**
```
Tag een naftgenoot
```

---

## 2.6 — ACHIEVEMENTS (`/achievements`)

**Bestand:** `apps/web/app/routes/achievements.tsx`

**Paginatitel:**
```
Achievements — Deur Den Bocht 2026
```

**Intro tekst (boven de achievement-grid):**
```
Verdien badges door de rit te voltooien, zones aan te doen en uitdagingen te proberen. Achievements worden aan het einde van de dag berekend. Sommige zijn makkelijk — sommige vereisen dat je de volledige route rijdt.
```

**Sectietitel voor vergrendelde achievements:**
```
Nog te verdienen
```

**Sectietitel voor ontgrendelde achievements:**
```
Jouw badges
```

**Lege staat (als er nog geen achievements zijn ontgrendeld):**
```
Je hebt nog geen achievements ontgrendeld.
Start de rit op 16 mei en verdien je eerste badge!
```

### Achievement Namen & Beschrijvingen

De volgende achievements zijn voorzien in het systeem. Elke achievement heeft een naam, beschrijving en een geheime hint.

| ID | Naam | Beschrijving | Hint |
|----|------|-------------|------|
| `first_checkin` | `Eerste Check-in` | `Je hebt je eerste rally zone aangedaan. De rit is begonnen.` | `Bezoek je eerste zone en scan de QR-code.` |
| `half_complete` | `Halverwege` | `2 van de 4 zones aangedaan. Je bent over de helft.` | `Doe 2 rally zones aan.` |
| `zone_master` | `Zonenmeester` | `Alle 4 rally zones aangedaan. Je hebt de volledige route gereden.` | `Doe alle 4 zones aan op dezelfde dag.` |
| `perfect_score` | `Bochtenkoning` | `Alle zones aangedaan en alle uitdagingen voltooid. Absoluut.` | `Voltooi alle uitdagingen in alle zones.` |
| `early_bird` | `Vroege Vogel` | `Je was er als een van de eersten bij. Voor 9u ingecheckt.` | `Check in bij je eerste zone voor 9:00 uur.` |
| `night_rider` | `Avondrit` | `Je reed door tot na de schemering.` | `Rij door na 20:00 uur.` |
| `half_way` | `500 Km Club` | `Je hebt de volledige route afgelegd. 500+ km. Gedaan.` | `Volg de volledige GPX-route.` |

---

## 2.7 — LIVE MAP (`/live-map`)

**Bestand:** `apps/web/app/routes/live-map.tsx`

De live map is enkel toegankelijk op de evenementdag (of voor admins). Als een deelnemer voor de dag probeert in te loggen, wordt hij doorgestuurd naar het dashboard.

**Paginatitel:**
```
Live Kaart — Deur Den Bocht 2026
```

**Kaart intro banner (boven de kaart):**
```
📍 Live — Deelnemers actief op de route
Check-ins worden in real-time geüpdatet. Locatie wordt enkel gedeeld als de deelnemer toestemming gaf.
```

**Geen deelnemers zichtbaar:**
```
Nog geen check-ins. De kaart wordt gevuld naarmate deelnemers inchecken bij de rally zones.
```

**Legend-labels:**
- `Groene punt` → `Check-in zone 1`
- `Gele punt` → `Check-in zone 2`
- `Oranje punt` → `Check-in zone 3`
- `Rode punt` → `Check-in zone 4`

---

## 2.8 — VOLG DEELNEMERS (`/volg-deelnemers`)

**Bestand:** `apps/web/app/routes/volg-deelnemers.tsx`

Deze pagina is publiek toegankelijk en laat iedereen toe een specifieke deelnemer te volgen op basis van nummerplaat + e-mail.

**Paginatitel:**
```
Volg Deelnemers — Deur Den Bocht 2026
```

**Pagina intro:**
```
Ben je thuis en wil je weten waar je vriend op de rit staat? Zoek op nummerplaat en e-mailadres om de voortgang van een deelnemer te bekijken.

Enkel deelnemers die toestemming gaven voor locatiedeling zijn zichtbaar.
```

**Formulier labels:**
- Nummerplaat veld label: `Nummerplaat (bv. 1-ABC-234)`
- E-mail veld label: `E-mailadres van de deelnemer`
- Zoek-knop: `Zoeken`

**Geen resultaat:**
```
Geen deelnemer gevonden met deze gegevens.
Zorg dat de nummerplaat en het e-mailadres exact overeenkomen. Heeft de deelnemer locatiedeling ingeschakeld?
```

**Deelnemer gevonden — kaart header:**
```
[Voornaam Achternaam] — onderweg op Deur Den Bocht 2026
```

**Laatste check-in label:**
```
Laatste check-in:
```

**Geen check-ins:**
```
Nog geen zones aangedaan.
```

---

## 2.9 — EVENT ALBUMS (`/event-albums`)

**Bestand:** `apps/web/app/routes/event-albums.tsx`

De event albums-pagina toont foto's per rally zone, gegroepeerd per album.

**Paginatitel:**
```
Foto Albums — Deur Den Bocht 2026
```

**Intro:**
```
Foto's genomen door deelnemers onderweg. Elk album hoort bij een rally zone. Bekijk hoe de rit eruit zag door hun ogen.
```

**Geen Albums:**
```
De albums worden opengesteld naarmate de zones worden afgerond op de dag van het evenement. Kom later op de dag terug!
```

**Album header (per zone):**
```
[Zone naam] — [Aantal] foto's
```

**Lege album:**
```
Nog geen foto's in dit album.
```

---

## 2.10 — DASHBOARD (`/dashboard`)

**Bestand:** `apps/web/app/routes/dashboard._index.tsx`

Het dashboard is de persoonlijke startpagina van elke ingeschreven deelnemer.

**Paginatitel:**
```
Mijn Dashboard — Deur Den Bocht 2026
```

**Welkomsttekst (boven aan de pagina):**
```
Goeiedag, [Voornaam] 👋
Welkom op je persoonlijk dashboard. Hier vind je alles wat je nodig hebt voor de rit van 16 mei.
```

**Sectietitel — Route & Documenten:**
```
Jouw Route & Materiaal
```

**GPX-download label:**
```
GPX Route downloaden
```

**GPX info tekst:**
```
Zet de route op je GPS voor de rit. Ondersteund door Garmin, TomTom, Wahoo en alle GPX-compatibele apparaten.
```

**Sectietitel — Jouw zones:**
```
Rally Zones
```

**Zone niet aangedaan:**
```
Nog niet aangedaan
```

**Zone aangedaan:**
```
✓ Aangedaan
```

**Sectietitel — Crew & Naftgenoten:**
```
Jouw Crew
```

**Geen naftgenoten:**
```
Je hebt nog geen naftgenoten gekoppeld.
Zoek andere deelnemers op en stuur een verzoek om samen te rijden.
```

**Sectietitel — Jouw Achievements:**
```
Achievements
```

**Gesloten (voor de dag):**
```
Achievements worden ontgrendeld op de dag van het evenement, 16 mei 2026.
```

**Sectietitel — Live Feed:**
```
Live Activiteit
```

**Geen activiteit:**
```
Nog geen activiteit. Op de dag van het event verschijnen hier de check-ins en foto's van je naftgenoten.
```

---

## 2.11 — DASHBOARD: BLOG / VERHALEN (`/dashboard/blog`)

**Bestand:** `apps/web/app/routes/dashboard.blog.tsx`

**Paginatitel:**
```
Ritboek — Deur Den Bocht 2026
```

**Intro:**
```
Het digitale ritboek van de editie. Schrijf je eigen verhaal van de dag en lees wat andere deelnemers beleefden.
```

**Schrijf een verhaal — knop:**
```
+ Schrijf jouw verhaal
```

**Nieuw verhaal — formulier titel:**
```
Jouw verhaal van de dag
```

**Nieuwe verhaal — placeholder:**
```
Hoe was je rit? Wat was het mooiste moment? Welke weg vergeet je niet meer? Schrijf het neer — voor jezelf, en voor de rest.
```

**Verhaal ingediend:**
```
Je verhaal wordt nagekeken door de organisatie en verschijnt binnenkort in het ritboek.
```

**Lege staat (geen verhalen):**
```
Nog geen verhalen. Wees de eerste die schrijft over zijn of haar beleving op Deur Den Bocht 2026.
```

---

## 2.12 — DASHBOARD: NAFTGENOTEN (`/dashboard/riding-buddies`)

**Bestand:** `apps/web/app/routes/dashboard.riding-buddies.tsx`

**Paginatitel:**
```
Naftgenoten — Deur Den Bocht 2026
```

**Intro:**
```
Koppel rijmaten en volg elkaar live op de kaart. Naftgenoten zien elkaars check-ins en foto's als eerste.
```

**Sectie: Mijn Naftgenoten**
```
Jouw gekoppelde rijmaten voor de rit van 16 mei.
```

**Sectie: Verzoeken versturen**
```
Zoek een andere deelnemer op en stuur een koppelverzoek. Ze ontvangen een melding om te accepteren.
```

**Geen naftgenoten:**
```
Je hebt nog geen naftgenoten. Stuur een verzoek naar iemand die je kent!
```

**Koppelverzoek versturen — placeholder:**
```
E-mailadres van de deelnemer
```

**Verzoek verstuurd:**
```
Koppelverzoek verstuurd! Je naftgenoot ontvangt een melding.
```

**Verzoek geaccepteerd:**
```
✓ Gekoppeld — jullie zien elkaars activiteit op de dag van de rit.
```

---

## 2.13 — DASHBOARD: PROFIEL BEWERKEN (`/dashboard/profile-edit`)

**Bestand:** `apps/web/app/routes/dashboard.profile-edit.tsx`

**Paginatitel:**
```
Mijn Profiel — Deur Den Bocht 2026
```

**Sectie: Profielfoto**
```
Upload een profielfoto die verschijnt in de galerij en bij je check-ins.
```

**Sectie: Locatiedeling**
```
Sta andere deelnemers en familie toe om je voortgang te volgen via de "Volg Deelnemers"-pagina.
```

**Locatiedeling aan:**
```
✓ Locatiedeling ingeschakeld
```

**Locatiedeling uit:**
```
Locatiedeling is uitgeschakeld. Enkel jij ziet je eigen locatie.
```

---

## 2.14 — DASHBOARD: EMERGENCY CONTACTS (`/dashboard/emergency-contacts`)

**Bestand:** `apps/web/app/routes/dashboard.emergency-contacts.tsx`

**Paginatitel:**
```
Noodcontacten — Deur Den Bocht 2026
```

**Intro:**
```
Voeg noodcontacten toe voor het geval er iets mocht gebeuren onderweg. De organisatie kan deze contacteren in geval van nood.

Dit is sterk aanbevolen — zeker als je alleen rijdt.
```

**Voeg noodcontact toe — knop:**
```
+ Noodcontact toevoegen
```

**Geen noodcontacten:**
```
Nog geen noodcontacten ingevoerd. We raden sterk aan om minstens één contactpersoon toe te voegen.
```

---

## 2.15 — DASHBOARD: CHECKLIST (`/dashboard/checklist`)

**Bestand:** `apps/web/app/routes/dashboard.checklist.tsx`

**Paginatitel:**
```
Voorbereiding Checklist — Deur Den Bocht 2026
```

**Intro:**
```
Gebruik deze checklist om zeker te zijn dat je klaar bent voor 16 mei. Vink af wat je al gedaan hebt.
```

**Checklistgroepen & items:**

*Groep: "Administratief"*
- `Inschrijving + betaling in orde`
- `E-mailbevestiging ontvangen`
- `QR-code opgeslagen op telefoon`
- `Noodcontacten ingesteld`
- `Rijbewijs + verzekeringsdocumenten mee`

*Groep: "Route & Navigatie"*
- `GPX-route gedownload op GPS`
- `Bochtenboek gedownload als PDF`
- `Offline kaart gedownload (voor slechte connectiviteit)`
- `Starttijdstip gekozen`

*Groep: "Motor"*
- `Remmen gecontroleerd`
- `Banden op druk en profiel nagekeken`
- `Olie en koelvloeistof op peil`
- `Verlichting werkt`
- `Sleutel + reservesleutel bij`

*Groep: "Uitrusting"*
- `Helm (goedgekeurd en in orde)`
- `Jas, handschoenen, laarzen`
- `Regenkleding in de koffer`
- `Noodset gereedschap`
- `Oplader en powerbank voor smartphone`

---

## 2.16 — DASHBOARD: PRIVACY INSTELLINGEN (`/dashboard/privacy`)

**Bestand:** `apps/web/app/routes/dashboard.privacy.tsx`

**Paginatitel:**
```
Privacy Instellingen — Deur Den Bocht 2026
```

**Sectie: Locatiedeling**
```
Kies of andere deelnemers en familie je kunnen volgen via de "Volg Deelnemers"-pagina. Je coördinaten worden nooit publiek gedeeld — enkel mensen met jouw nummerplaat + e-mailadres kunnen je vinden.
```

**Sectie: Foto's in galerij**
```
Foto's die jij uploadt verschijnen standaard in de galerij voor alle ingelogde deelnemers. Wil je dat niet, kan je dit hier uitschakelen.
```

**Sectie: Account verwijderen**
```
Als je je account en alle bijbehorende data wilt verwijderen, kan je dit hier aanvragen. Account-verwijdering is definitief en onomkeerbaar.
```

**Verwijder account knop:**
```
Mijn account en data verwijderen
```

**Bevestigingsdialoog:**
```
Ben je zeker?
Dit verwijdert je account, je geregistreerde data, je foto's en je check-ins permanent. Er is geen weg terug.
```

---

## 2.17 — PRIVACYBELEID (`/privacy-policy`)

**Bestand:** `apps/web/app/routes/privacy-policy.tsx`

De huidige tekst is juridisch in orde. Voeg aan het begin (na de h1) een menselijke intro toe:

**Nieuwe intro-alinea (boven sectie 1):**
```
Bij VZW Deur Den Bocht gaan we respectvol om met je gegevens. We vragen enkel wat nodig is om het evenement te organiseren, we bewaren het zo kort als mogelijk, en we verkopen nooit iets aan derden.

Hieronder leggen we alles uit in klare taal.
```

**Voeg toe aan sectie 2 "Verantwoordelijke":**
```
VZW Deur Den Bocht
E-mail: vzwddb@gmail.com
Website: deurdenbochtmotorrit.be
KBO-nummer: [in te vullen]
```

*(De rest van het document is al goed — geen verdere aanpassingen nodig.)*

---

## 2.18 — ALGEMENE VOORWAARDEN (`/terms`)

**Bestand:** `apps/web/app/routes/terms.tsx`

De huidige tekst is juridisch in orde. Voeg toe:

**Voeg toe aan sectie 1 "Definities":**
```
"App": De webapplicatie op deurdenbochtmotorrit.be die deelnemers gebruiken tijdens het evenement.
"GPX-route": Het digitale routebestand beschikbaar voor deelnemers.
"Bochtenboek": Het officiële route-roadbook van de editie.
```

**Voeg een sectie "13. Contact" toe op het einde:**
```
13. Contact

Voor vragen over deze voorwaarden of het evenement:

VZW Deur Den Bocht
E-mail: vzwddb@gmail.com
Website: deurdenbochtmotorrit.be
```

---

## 2.19 — COOKIEVERKLARING (`/cookie-policy`)

**Bestand:** `apps/web/app/routes/cookie-policy.tsx`

De huidige tekst is in orde. Voeg toe op het einde:

**Voeg een sectie "Contact" toe:**

```
Contact

Heb je vragen over ons cookiebeleid? Stuur een mail naar vzwddb@gmail.com.

Laatste update: maart 2026
```

---

## DEEL 3: E-MAILS

> De e-mails worden verstuurd via **Resend**. De templates staan in de code (of worden gegenereerd). De volgende teksten moeten in elke e-mail verwerkt worden.

---

### E-mail 1: Inschrijvingsbevestiging

**Onderwerp:**
```
Welkom bij Deur Den Bocht 2026 — Inschrijving bevestigd, [Voornaam]!
```

**Broodtekst:**

```
Dag [Voornaam],

Je inschrijving voor Deur Den Bocht 2026 is ontvangen en je betaling is verwerkt. 

JOUW GEGEVENS
—————————
Naam: [Voornaam Achternaam]
Motor: [Merk] [Model] ([Nummerplaat])
Formule: [Formule]
Route voorkeur: [Adventure Track / Scenic Route]

JOUW QR-CODE
—————————
[QR-code weergave of code: XXXXX]

Bewaar deze code goed. Je hebt hem nodig bij de registratiebalie op de ochtend van het evenement en om in te checken bij de rally zones.

VOLGENDE STAPPEN
—————————
1. Log in op je dashboard: deurdenbochtmotorrit.be/dashboard
2. Download de GPX-route en het Bochtenboek voor 16 mei
3. Stel noodcontacten in in je profiel
4. Koppel naftgenoten als je samen rijdt

Tot op, a zondag 16 mei in Aalter!

VZW Deur Den Bocht
vzwddb@gmail.com
deurdenbochtmotorrit.be
```

---

### E-mail 2: Herinnering (7 dagen voor het event)

**Onderwerp:**
```
7 dagen te gaan — Ben je klaar voor Deur Den Bocht?
```

**Broodtekst:**

```
Dag [Voornaam],

Over precies 7 dagen vertrek je op de rit van je leven.

Nog even checken:

✓ GPX-route gedownload op je GPS?
✓ Bochtenboek geopend?
✓ Noodcontacten ingevoerd?
✓ Motor gecontroleerd?

Als je nog iets wil nalezen, alles staat op deurdenbochtmotorrit.be/dashboard.

Tot zondag!

VZW Deur Den Bocht
```

---

## DEEL 4: SOCIALE MEDIA CONTENT

> Dit zijn kant-en-klare teksten voor Instagram, Facebook en WhatsApp ter promotie van het evenement.

---

### Aankondigingspost (3-4 maanden voor het event)

**Caption:**
```
📣 Het is officieel.

Deur Den Bocht 2026 — The 500 — is bevestigd.
📅 Zondag 16 mei 2026
📍 Start & Aankomst: Aalter
🏍️ 500+ km · 4 Rally Zones · Geen snelwegen

Inschrijvingen zijn open. Plaatsen beperkt.
➡️ deurdenbochtmotorrit.be

#DeurDenBocht #Motorrit #Belgium #Ardennen #Motorrijden #VZWDeurDenBocht
```

---

### Inschrijvingspost (bij opening registraties)

**Caption:**
```
🟢 INSCHRIJVINGEN ZIJN OPEN

Deur Den Bocht 2026 — jouw dag op twee wielen.
Geen race. Geen tijdsdruk. Enkel de weg.

Schrijf je in via deurdenbochtmotorrit.be
Plaatsen zijn beperkt — wees er snel bij.

#DeurDenBocht #MotorRally #GadeeMee
```

---

### Countdown post (1 week voor het event)

**Caption:**
```
⏳ 7 dagen nog.

Banden op druk? GPS geladen? Regenjas mee?
De Ardennen wachten niet.

Deur Den Bocht 2026 — 16 mei.
➡️ deurdenbochtmotorrit.be/dashboard

#DeurDenBocht #NogEenWeek #Motorrijden
```

---

### Dag-van post (ochtend van het event)

**Caption:**
```
🏁 VANDAAG IS HET ZOVER.

Deur Den Bocht 2026 is begonnen.
500+ deelnemers. 500+ km. Eén route.

Veilige kilometers aan iedereen 🏍️

#DeurDenBocht2026 #TheRide #Belgium #Motorrit
```

---

## DEEL 5: DRUKWERK & MATERIAAL

> Teksten voor fysiek materiaal dat uitgedeeld wordt op het startpunt.

---

### Startbriefing (uitgedeeld of voorgelezen aan het startpunt)

*(Gebaseerd op BRIEFING.md en aangevuld)*

```
STARTBRIEFING — DEUR DEN BOCHT 2026
Zondag 16 mei · Aalter

Goedemorgen allemaal. Welkom bij Deur Den Bocht 2026.

Vandaag gaat het over rijden, ontdekken en genieten.
Dit is géén race. Er is geen tijdslimiet. Er is geen marshal.

DE ROUTE
De volledige GPX-route staat in je app en op je GPS. Je rijdt 500+ km door België, Noord-Frankrijk en de Ardennen. Geen snelwegen. Nooit.

DE RALLY ZONES
Onderweg zijn er 4 rally zones. Elke zone heeft een check-in punt waar je je QR-badge scant. Binnen de zones vind je route tips en optionele uitdagingen. Die uitdagingen zijn voor de fun — nooit verplicht.

DE VRIJHEID
Je vertrekt wanneer jij wil. Je stopt wanneer jij wil. Je rijdt wat je wil en laat wat je wil. Niemand oordeelt.

HET EINDPUNT
Café Den Belami in Aalter. Rij erheen wanneer je er klaar voor bent. Maaltijd voor wie dat in zijn formule heeft.

VAN BELANG
· Respecteer altijd de verkeersregels — snelheidslimiet, voorrang, alles
· In geval van nood: noodknop in de app of WhatsApp-groep
· Rij defensief — de weg is ook voor anderen

Dat is het. De rest weet je al.
Veilige kilometers, geniet van de wegen.
We zien jullie vanavond.

— VZW Deur Den Bocht
```

---

### QR-Badge (sticker of kaartje)

**Voorzijde:**
```
DEUR DEN BOCHT 2026
[Naam deelnemer]
[QR-code]
```

**Achterzijde:**
```
[Nummerplaat]
[Formule]
deurdenbochtmotorrit.be
```

---

### Bochtenboek — Cover

```
BOCHTENBOEK
DEUR DEN BOCHT 2026
THE 500

Zondag 16 mei 2026
VZW Deur Den Bocht
```

**Binnenste flap:**
```
Dit is jouw roadbook voor de rit van vandaag.

Het bevat alle route-informatie, een overzicht van de 4 rally zones, en praktische info voor onderweg.

Heb je vragen of hulp nodig?
WhatsApp-groep: [link of QR-code]
E-mail: vzwddb@gmail.com
Website: deurdenbochtmotorrit.be

Veilige kilometers.
```

---

## SAMENVATTING: PRIORITEITENLIJST

Hieronder staat wat écht meteen moet af voor de site volledig klaar is:

| Prioriteit | Actie | Waar |
|-----------|-------|------|
| 🔴 KRITIEK | Homepage sections aanmaken in Sanity | Sanity Studio → Pagina Content |
| 🔴 KRITIEK | 4 Event Stories maken voor About pagina | Sanity Studio → Event Stories |
| 🔴 KRITIEK | Dag-programma aanmaken (Schedule Items) | Sanity Studio → Programma |
| 🔴 KRITIEK | FAQ aanmaken (10 items) | Sanity Studio → FAQ |
| 🟠 URGENT | Stats aanmaken (4 blokken) | Sanity Studio → Stats |
| 🟠 URGENT | Pricing tiers aanmaken | Sanity Studio → Prijsformules |
| 🟠 URGENT | Feature cards aanmaken | Sanity Studio → Feature Cards |
| 🟠 URGENT | Benefits aanmaken | Sanity Studio → Voordelen |
| 🟡 GEWENST | Rally Zone content updaten | Sanity Studio → Rally Zones |
| 🟡 GEWENST | Site Configuratie invullen | Sanity Studio → Site Config |
| 🟢 LATER | Sponsors aanmaken | Sanity Studio → Sponsors |
| 🟢 LATER | Login- en auth-pagina teksten verfijnen | Code aanpassingen |
| 🟢 LATER | Dashboard teksten verfijnen | Code aanpassingen |

---

*Document aangemaakt: maart 2026 — VZW Deur Den Bocht*  
*Versie: 1.0*
