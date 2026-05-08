# Rally Platform — EPIC 1 — Authentication, Rider Identity & Presence

# Doel van deze Epic

Deze epic definieert:

* authentication flows
* rider onboarding
* rider identity management
* vehicle identity
* realtime presence
* session orchestration
* multiplayer visibility.

Deze epic vormt:

* de identiteitslaag van het platform
* de basis van communitygevoel
* de basis van realtime groepsbeleving.

---

# Filosofie

Riders zijn geen gewone users.

Ze vertegenwoordigen:

* identiteit
* presence
* teamdynamiek
* eventparticipatie.

De onboarding en presence-systemen moeten daarom:

* frictionless zijn
* cinematic aanvoelen
* mobile-first zijn
* realtime verbonden voelen.

---

# Kritisch UX-Principe

De app mag nooit voelen als:

* enterprise login software
* administratieve tooling.

De onboarding moet voelen als:

* deelname aan een rally
* toetreden tot een avontuur
* een rider-profiel creëren.

---

# Architectuurdoelen

Deze epic moet:

* social login ondersteunen
* realtime presence ondersteunen
* rider identity persistent maken
* vehicle identity ondersteunen
* reconnect flows ondersteunen.

---

# Definitieve Technologie

## Authentication

* Supabase Auth.

---

## Providers

* Google
* Facebook
* Apple.

---

## Session Handling

* Supabase JWT
* secure cookie persistence.

---

## Presence Synchronization

* Socket.IO
* Durable Objects.

---

# User Story 1.1 — Social Authentication Integreren

## Businessdoel

Frictionless onboarding creëren.

---

## User Story

Als rider
wil ik kunnen inloggen met bestaande social accounts
zodat ik onmiddellijk aan het event kan deelnemen.

---

# Waarom Dit Kritisch Is

MVP-events falen vaak door:

* te complexe registratie
* te veel onboarding friction.

---

# Ondersteunde Providers

## Google

Primaire provider.

---

## Facebook

Ondersteunt bredere toegankelijkheid.

---

## Apple

Belangrijk voor:

* iOS gebruikers
* privacygericht vertrouwen.

---

# Frontend Flow

## 1. Login CTA

Cinematic onboarding scherm.

Niet:

* standaard admin login formulier.

---

## 2. Provider Selectie

Gebruik:

* Supabase OAuth redirect flow.

---

## 3. Callback Verwerking

Frontend verwerkt:

* auth token
* rider session.

---

## 4. Rider Bootstrap

Controleer:

* bestaand rider-profiel
* onboarding status.

---

# Backend Verantwoordelijkheden

Backend valideert:

* JWT token
* rider existence
* session integrity.

---

# Security Implicaties

Nooit vertrouwen op:

* frontend auth state.

Alle websocket connections moeten:

* server-side gevalideerd worden.

---

# Foutscenario’s

## Scenario — OAuth Cancelled

Gebruiker annuleert login.

---

# Verwachte UX

Geen harde error.

Terugkeren naar:

* onboarding scherm.

---

# User Story 1.2 — Rider Profiel Aanmaken

## Businessdoel

Een blijvende rider-identiteit creëren.

---

## User Story

Als rider
wil ik een persoonlijk rider-profiel aanmaken
zodat ik herkenbaar ben binnen het event.

---

# Rider Entity

```txt
Rider
- id
- display_name
- avatar_url
- riding_style
- experience_level
- country_code
```

---

# Waarom Rider Identity Belangrijk Is

Het event moet voelen als:

* een community
* een rally culture.

Niet als:

* anonieme gebruikers.

---

# UX Filosofie

Onboarding moet:

* snel zijn
* emotioneel aanvoelen
* rider identity versterken.

---

# Frontend Vereisten

## Rider Name

Verplicht.

---

## Avatar

Optioneel in MVP.

---

## Riding Style

Bijvoorbeeld:

* ADVENTURE
* TOURING
* SPORT.

---

# Realtime Implicaties

Rider identity wordt gebruikt in:

* presence overlays
* team synchronization
* mission completion events.

---

# User Story 1.3 — Rider Vehicle Registratie

## Businessdoel

Motorfietsidentiteit integreren.

---

## User Story

Als rider
wil ik mijn motorfiets registreren
zodat mijn aanwezigheid persoonlijk en herkenbaar aanvoelt.

---

# Waarom Dit Belangrijk Is

Motoren zijn:

* onderdeel van identiteit
* onderdeel van groepsdynamiek.

---

# RiderVehicle Entity

```txt
RiderVehicle
- manufacturer
- model
- year
- category
- nickname
- color
```

---

# Frontend UX

Vehicle onboarding moet voelen als:

* het voorstellen van je machine.

Niet als:

* een verzekeringsformulier.

---

# Privacyprincipe

Geen volledige nummerplaten opslaan.

Gebruik:

* hash
* of partial masking.

---

# Realtime Implicaties

Vehicle metadata wordt gebruikt voor:

* team lineup
* live presence
* rider overlays.

---

# User Story 1.4 — Session Persistence Implementeren

## Businessdoel

Sessies persistent houden tijdens mobiel gebruik.

---

## Kritische Realiteit

Gebruikers:

* wisselen apps
* verliezen connectie
* sluiten browsers.

---

# Vereisten

Sessions moeten:

* persistent blijven
* veilig hersteld worden.

---

# Frontend Verantwoordelijkheden

Bij app launch:

* restore session
* validate token
* bootstrap rider state.

---

# Backend Verantwoordelijkheden

Backend valideert:

* JWT expiry
* token signature.

---

# Realtime Implicaties

Socket reconnect gebruikt:

* bestaande sessie.

---

# Foutscenario’s

## Scenario — Expired Token

Gebruiker reconnect na lange disconnect.

---

# Verwachte Flow

* silent refresh attempt
* fallback naar login.

---

# User Story 1.5 — Presence Systeem Implementeren

## Businessdoel

Realtime groepsgevoel creëren.

---

## User Story

Als rider
wil ik zien wie online en actief is
zodat het event levend aanvoelt.

---

# Presence Filosofie

Presence verhoogt:

* immersion
* groepsgevoel
* multiplayer awareness.

---

# Presence Data

Bijvoorbeeld:

* online state
* readiness
* actieve riders
* bike metadata.

---

# Durable Object Verantwoordelijkheden

Bijhouden van:

* actieve sockets
* room members
* reconnect states.

---

# Frontend Vereisten

## Team Presence Overlay

Toont:

* rider avatar
* bike model
* readiness status.

---

# Waarom Dit Belangrijk Is

Het event moet voelen alsof:

* je deel bent van een actieve groep.

---

# Realtime Events

## team.joined

```json
{
  "teamId": "uuid",
  "riderId": "uuid"
}
```

---

## team.left

```json
{
  "teamId": "uuid",
  "riderId": "uuid"
}
```

---

## team.presence.updated

```json
{
  "onlineMembers": []
}
```

---

# User Story 1.6 — Reconnect Presence Recovery

## Businessdoel

Realtime continuity behouden.

---

## Kritische Realiteit

Mobiele netwerken zijn instabiel.

Disconnects zijn gegarandeerd.

---

# Vereisten

Bij reconnect:

* room membership herstellen
* presence herstellen
* rider state synchroniseren.

---

# Durable Object Verantwoordelijkheden

Room state reconstrueren.

---

# Frontend Vereisten

UI mag niet:

* volledig resetten
* progression verliezen.

---

# Verwachte UX

Reconnect moet:

* bijna onzichtbaar voelen.

---

# User Story 1.7 — Rider Profile Editing

## Businessdoel

Rider identity persistent onderhoudbaar maken.

---

## User Story

Als rider
wil ik mijn profiel kunnen aanpassen
zodat mijn rider identity actueel blijft.

---

# Bewerkbare Velden

* avatar
* display name
* riding style
* vehicle.

---

# Security Vereisten

Gebruikers mogen enkel:

* eigen profiel aanpassen.

---

# Realtime Implicaties

Profile updates moeten:

* live synchroniseren binnen team rooms.

---

# Voorbeeld

Bike change moet realtime zichtbaar worden.

---

# User Story 1.8 — Rider Onboarding Completion Flow

## Businessdoel

Nieuwe gebruikers begeleiden naar event readiness.

---

## Waarom Dit Belangrijk Is

Onboarding bepaalt:

* eerste indruk
* retention
* event excitement.

---

# Flow

## 1. Login

---

## 2. Rider Identity

---

## 3. Vehicle Setup

---

## 4. Event Join CTA

---

# UX Filosofie

Flow moet voelen als:

* voorbereiding op een avontuur.

Niet als:

* account setup.

---

# Animation Richtlijnen

Gebruik:

* subtle transitions
* cinematic reveals
* motion pacing.

---

# User Story 1.9 — Authentication Guards Implementeren

## Businessdoel

Beschermde routes afdwingen.

---

# Frontend Guards

Bescherm:

* team routes
* event routes
* mission routes.

---

# Backend Guards

Verplicht:

* JWT validation
* edition membership validation.

---

# Security Filosofie

Frontend guards zijn:

* UX convenience.

Backend guards zijn:

* echte security.

---

# Foutscenario’s

## Scenario — Rider Niet In Event

Gebruiker probeert event route te openen.

---

# Verwachte Flow

Redirect:

* event join scherm.

---

# User Story 1.10 — Rider Session Analytics

## Businessdoel

Gebruikersgedrag begrijpen.

---

# Tracking Voorbeelden

* onboarding completion
* provider usage
* reconnect frequency
* session duration.

---

# Waarom Dit Belangrijk Is

Realtime mobiele apps vereisen:

* observability
* UX analytics.

---

# Privacyprincipe

Geen:

* overmatige GPS opslag
* gevoelige persoonsgegevens.

---

# Kritische MVP-Doelen

Na deze epic moet bestaan:

* frictionless auth
* rider identity system
* vehicle identity
* realtime presence
* reconnect persistence
* session orchestration
* onboarding flow
* multiplayer visibility.

---

# Belangrijkste Architectuurprincipe

Identity bestaat niet enkel voor authenticatie.

Identity bestaat om:

* communitygevoel te versterken
* immersion te verhogen
* groepsdynamiek zichtbaar te maken
* riders herkenbaar te maken binnen het event.
