# Rally Platform — System Architecture

# Doel van dit document

Dit document beschrijft de volledige systeemarchitectuur van het Rally-platform.

Het doel is:

* een consistente technische visie definiëren
* development agents aansturen
* architecturale grenzen vastleggen
* realtime gedrag structureren
* toekomstige schaalbaarheid bewaken.

Dit document moet gelezen worden als:

* architecturale waarheid
* implementation blueprint
* technische referentie.

---

# Platform Filosofie

Het platform is géén traditionele route-app.

Het platform is:

* een realtime multiplayer quest system
* een event orchestration platform
* een cinematic adventure experience.

De technische architectuur moet daarom:

* realtime-first zijn
* mobile-first zijn
* event-driven zijn
* immersion ondersteunen
* lage latency hebben
* offline degradatie ondersteunen.

---

# Definitieve Stack

## Frontend

* React 19
* React Router 7
* TypeScript
* Tailwind CSS
* Zustand
* Framer Motion
* Mapbox GL JS
* Socket.IO Client
* PWA capabilities.

---

## Backend

* Cloudflare Workers
* Hono
* Durable Objects.

---

## Database

* Supabase PostgreSQL
* Supabase Auth.

---

## Storage

* Supabase Storage
  OF
* Cloudflare R2.

---

# Waarom React Router 7

React Router 7 sluit beter aan bij:

* app-first architectuur
* realtime synchronization
* state-heavy UX
* websocket-centric behavior.

Het platform vereist:

* weinig SEO
* weinig server rendering
* weinig content rendering.

Dus:
React Router 7 geeft:

* eenvoudiger client state management
* minder framework abstractions
* betere websocket controle
* betere mentale eenvoud.

---

# Waarom Cloudflare Workers

Workers passen uitstekend bij:

* event-driven workloads
* burst traffic
* realtime orchestration
* lage operationele kost.

Belangrijk:

* geen serverbeheer
* edge runtime
* schaalbaar zonder complex deployment model.

---

# Waarom Durable Objects

Durable Objects zijn cruciaal voor:

* realtime team synchronization
* room-based state
* multiplayer coordination
* temporary authoritative state.

Het concept mapt natuurlijk naar:

* één realtime room per team
* één authoritative state owner per team.

---

# Waarom Supabase

Supabase levert:

* PostgreSQL
* authentication
* storage
* row-level security
* snelle MVP velocity.

Belangrijk:
Supabase wordt gebruikt voor:

* persistence
* auth
* storage.

Niet voor:

* gameplay orchestration
* realtime game authority.

---

# High-Level Architectuur

```txt
Frontend (React Router 7)
        ↓
Cloudflare Edge
        ↓
Workers + Hono
        ↓
Durable Objects
        ↓
Supabase PostgreSQL
        ↓
Storage (R2/Supabase)
```

---

# Frontend Architectuur

# Filosofie

Frontend is:

* state-heavy
* realtime-driven
* mobile-first.

De frontend moet:

* immersive aanvoelen
* reconnect tolerant zijn
* websocket interruptions overleven
* offline degradeerbaar zijn.

---

# Frontend Modules

## Authentication Module

Verantwoordelijk voor:

* login
* session restore
* token refresh
* auth guards.

---

## Team Module

Verantwoordelijk voor:

* team creation
* invites
* readiness state
* live presence.

---

## Route Module

Verantwoordelijk voor:

* kaart rendering
* GPX visualization
* route unlock rendering
* navigation handoff.

---

## Mission Module

Verantwoordelijk voor:

* challenge UX
* mission progression
* uploads
* mission state.

---

## Realtime Module

Verantwoordelijk voor:

* websocket lifecycle
* reconnect logic
* synchronization recovery
* realtime event routing.

---

# Zustand Architectuur

# Waarom Zustand

Zustand is ideaal voor:

* transient realtime state
* lage boilerplate
* snelle MVP ontwikkeling.

Redux zou:

* teveel ceremony introduceren
* development vertragen.

---

# Aanbevolen Stores

## authStore

Bevat:

* session
* rider
* token state.

---

## teamStore

Bevat:

* active team
* presence
* leader state
* readiness.

---

## routeStore

Bevat:

* unlocked segments
* active segment
* route previews
* checkpoint progress.

---

## missionStore

Bevat:

* active missions
* submissions
* completion state.

---

## realtimeStore

Bevat:

* websocket status
* reconnect attempts
* room subscriptions.

---

# Backend Architectuur

# Filosofie

Backend blijft:

* authoritative
* deterministic
* state-validating.

Frontend mag nooit:

* progression bepalen
* scores berekenen
* route unlocks beslissen.

---

# Domain-Driven Structuur

```txt
/src
  /domains
    /edition
    /route
    /mission
    /team
    /rider
    /leaderboard
    /realtime

  /shared
  /infrastructure
  /adapters
```

---

# Waarom Domain Structuur

Niet structureren per:

* controllers
* services
* utils.

Maar per businessdomein.

Waarom:

* duidelijke ownership
* lagere coupling
* betere schaalbaarheid
* betere LLM-context.

---

# SOLID Verplicht

Elke service moet:

* één duidelijke verantwoordelijkheid hebben
* infrastructuur abstraheren
* event contracts respecteren.

---

# Voorbeeld Services

## RouteProgressionService

Verantwoordelijk voor:

* progression checks
* route unlocks
* reconnect recovery.

---

## DecisionEngineService

Verantwoordelijk voor:

* route branching
* timeout handling
* choice validation.

---

## MissionValidationService

Verantwoordelijk voor:

* challenge completion
* submission validation
* scoring.

---

## TeamRealtimeCoordinator

Verantwoordelijk voor:

* websocket broadcasts
* room synchronization
* presence state.

---

# Realtime Architectuur

# Filosofie

Realtime synchronization is een kernonderdeel van:

* immersion
* groepsgevoel
* pacing.

Polling is onvoldoende.

---

# Room Structuur

## Edition Room

```txt
/event/{editionId}
```

Globale broadcasts.

---

## Team Room

```txt
/event/{editionId}/team/{teamId}
```

Realtime team synchronization.

---

## Admin Room

```txt
/event/{editionId}/admin
```

Organizer orchestration.

---

# Waarom Room Isolation

Voorkomt:

* state leakage
* verkeerde broadcasts
* cross-event contamination.

---

# Reconnect Strategie

# Kritische Realiteit

Mobiele netwerken zijn instabiel.

Reconnects zijn gegarandeerd.

Dus:

* websocket recovery is core architecture.

---

# Reconnect Flow

## 1. Disconnect detectie

Frontend markeert:

* realtime degraded state.

---

## 2. Lokale state blijft actief

Laatste route state blijft zichtbaar.

---

## 3. Automatische reconnect

Socket reconnect met:

* session token
* room subscriptions.

---

## 4. State reconciliation

Backend levert:

* missed events
* latest progression
* room state.

---

# Waarom Idempotency Belangrijk Is

Mobiele clients kunnen:

* duplicate events sturen
* delayed events versturen
* reconnecten met oude state.

Dus:
alle progression events moeten:

* veilig herhaalbaar zijn
* duplicate-safe zijn.

---

# GPX Architectuur

# Filosofie

Routes worden:

* vooraf ontworpen
* als GPX opgebouwd
* segment-based georkestreerd.

Het platform genereert geen routes.

Het platform:

* onthult
* synchroniseert
* dramatiseert.

---

# GPX Upload Flow

## 1. Admin upload GPX

Bijvoorbeeld:

* main-stage-1.gpx
* forest-adventure.gpx.

---

## 2. Worker parseert GPX

Gebruik:

* gpxparser
  OF
* togeojson.

---

## 3. Geometry normalisatie

Opslag:

* JSON coordinate arrays.

---

## 4. RouteSegment entity creëren

Segment wordt gekoppeld aan:

* edition
* checkpoints
* missions
* decision points.

---

# Waarom Segment-Based Routing

Het platform toont:

* geen volledige route.

Maar:

* unlockbare stukken.

Dat ondersteunt:

* suspense
* branching
* discovery.

---

# Navigation Filosofie

De app bouwt geen custom navigation engine.

De app:

* onthult route
* previewt segment
* handoff naar navigation app.

Bijvoorbeeld:

* Google Maps
* Waze.

---

# Waarom Geen Eigen Navigatie

Een custom navigation engine vereist:

* rerouting
* voice guidance
* traffic awareness
* road closure handling.

Dat is buiten MVP scope.

---

# Edition Architectuur

# Filosofie

Het platform moet meerdere eventedities ondersteunen.

Dus:
vrijwel alle entities zijn:

* edition-aware.

---

# Waarom Dit Kritisch Is

Zonder edition architecture:

* verlies je historiek
* verlies je analytics
* moet data verwijderd worden.

---

# Edition States

## DRAFT

Nog in opbouw.

---

## PUBLISHED

Registraties open.

---

## ACTIVE

Live event.

---

## COMPLETED

Event beëindigd.

---

## ARCHIVED

Historische opslag.

---

# Security Architectuur

# Filosofie

Backend authority is verplicht.

Frontend wordt beschouwd als:

* niet betrouwbaar.

---

# Anti-Cheat Principes

Frontend mag nooit:

* scores bepalen
* progression bepalen
* geheime routes kennen.

---

# Token Validatie

Alle websocket connections vereisen:

* Supabase session validation.

---

# Hidden Route Protection

Adventure routes mogen:

* niet preloaden
* niet zichtbaar zijn in frontend state.

Route unlocks gebeuren pas:

* na backend validatie.

---

# Performance Filosofie

# Kritische Mobile Constraints

De app draait:

* mobiel
* onderweg
* met wisselende connectiviteit.

Dus:

* bandwidth minimaliseren
* GPS throttlen
* websocket payloads klein houden.

---

# GPS Strategie

Geen permanente live streaming.

Gebruik:

* throttled updates
* checkpoint proximity
* event-driven synchronization.

---

# Offline Filosofie

# Doel

De app moet degradeerbaar blijven:

* bij slechte connectie.

---

# Offline Capability

Frontend bewaart lokaal:

* unlocked routes
* mission state
* laatste team state.

---

# Niet Ondersteund Offline

Niet offline beschikbaar:

* realtime sync
* nieuwe route unlocks
* live leaderboards.

---

# UX Filosofie

# Kritisch Principe

De app mag nooit aanvoelen als:

* logistieke tooling
* fleet software
* GPX manager.

Het moet voelen als:

* een cinematic mission system
* een interactieve rally
* een live quest.

---

# UX Kernwoorden

* suspense
* discovery
* momentum
* immersion
* team tension
* narrative pacing.

---

# Belangrijkste Architectuurdoel

Elke technische beslissing moet bijdragen aan:

* spanning
* flow
* groepsdynamiek
* realtime beleving
* cinematic progression.
