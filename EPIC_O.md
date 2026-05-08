# Rally Platform — EPIC 0 — Foundation & Project Setup

# Doel van deze Epic

Deze epic definieert:

* de volledige technische fundering van het platform
* projectstructuur
* architecturale standaarden
* development workflows
* infrastructuursetup
* realtime basisarchitectuur.

Deze epic is kritisch.

Een zwakke fundering veroorzaakt later:

* realtime chaos
* technische schuld
* synchronization bugs
* deploymentproblemen
* moeilijk onderhoud.

---

# Filosofie

Dit platform is géén simpele CRUD-app.

Het is:

* een realtime multiplayer experience
* een event orchestration platform
* een cinematic mobile-first quest system.

De fundering moet daarom:

* realtime-first zijn
* SOLID respecteren
* domain-driven zijn
* mobile-first zijn
* offline-tolerant zijn
* websocket-centric zijn.

---

# Technologische Fundamenten

## Frontend

* React 19
* React Router 7
* TypeScript
* Tailwind CSS
* Zustand
* Framer Motion
* Socket.IO Client
* Mapbox GL JS.

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

# Architectuurprincipes

# SOLID Verplicht

Alle development moet:

* SOLID volgen
* bounded contexts respecteren
* infrastructuur abstraheren.

---

# Backend Authority

Frontend mag nooit:

* progression bepalen
* routes unlocken
* scores berekenen.

Backend blijft authoritative.

---

# Edition-Aware Architectuur

Vrijwel alle entities bevatten:

* edition_id.

Waarom:

* meerdere eventedities
* historiek
* analytics
* replaybaarheid.

---

# Realtime-First Filosofie

Realtime synchronization is:

* geen extra feature
* maar een kernonderdeel van immersion.

---

# User Story 0.1 — Monorepo Structuur Opzetten

## Businessdoel

Een consistente codebasestructuur creëren die:

* schaalbaar blijft
* development versnelt
* LLM-assisted development ondersteunt.

---

## User Story

Als developer
wil ik een duidelijke monorepo-structuur
zodat frontend, backend en shared contracts consistent georganiseerd blijven.

---

## Technische Doelen

De repository moet:

* domain-driven zijn
* dependency boundaries afdwingen
* gedeelde types ondersteunen
* realtime contracts centraliseren.

---

## Aanbevolen Structuur

```txt
/apps
  /web
  /worker

/packages
  /shared-types
  /shared-events
  /shared-utils
  /ui

/docs
```

---

# Waarom Monorepo

Voordelen:

* gedeelde websocket contracts
* gedeelde DTO’s
* consistente typing
* minder duplication.

---

# Frontend Structuur

```txt
/src
  /domains
  /routes
  /components
  /stores
  /services
  /providers
  /hooks
```

---

# Backend Structuur

```txt
/src
  /domains
  /infrastructure
  /workers
  /durable-objects
  /adapters
  /shared
```

---

# SOLID Implicaties

Geen:

* globale util chaos
* gigantische services
* mixed responsibilities.

---

# Realtime Implicaties

Shared websocket contracts moeten:

* type-safe zijn
* gedeeld worden tussen frontend/backend.

---

# Foutscenario’s

## Scenario — Contract Drift

Frontend en backend events divergeren.

---

# Mitigatie

Gebruik:

* gedeelde TypeScript contracts.

---

# User Story 0.2 — TypeScript Strict Mode Configureren

## Businessdoel

Typeveiligheid afdwingen om realtime bugs te minimaliseren.

---

## Waarom Dit Kritisch Is

Realtime systemen produceren snel:

* state mismatches
* undefined behavior
* websocket inconsistencies.

---

## Technische Vereisten

TypeScript moet draaien met:

```json
{
  "strict": true
}
```

---

# Verplichte Configuraties

* noImplicitAny
* strictNullChecks
* noUncheckedIndexedAccess
* exactOptionalPropertyTypes.

---

# Waarom Belangrijk

Voorkomt:

* runtime websocket crashes
* invalid payloads
* synchronization fouten.

---

# Frontend Impact

Zustand stores moeten:

* volledig getypeerd zijn.

---

# Backend Impact

Alle DTO’s moeten:

* expliciet gevalideerd worden.

---

# User Story 0.3 — Shared Event Contract Systeem Opzetten

## Businessdoel

Realtime contracts centraliseren.

---

## User Story

Als developer
wil ik gedeelde websocket event types
zodat frontend en backend realtime consistent blijven.

---

# Waarom Dit Kritisch Is

Realtime systems breken snel door:

* payload drift
* event mismatch
* naming inconsistencies.

---

# Architectuur

```txt
/packages/shared-events
```

---

# Voorbeelden

```ts
RouteSegmentUnlockedEvent
MissionCompletedEvent
DecisionAvailableEvent
```

---

# Waarom Shared Contracts

Voorkomt:

* duplicatie
* inconsistenties
* runtime parsing chaos.

---

# Realtime Impact

Socket payloads worden:

* type-safe
* consistent
* valideerbaar.

---

# Security Impact

Payload validation wordt eenvoudiger.

---

# User Story 0.4 — Cloudflare Worker Basisarchitectuur

## Businessdoel

Edge-native backend infrastructuur creëren.

---

## User Story

Als developer
wil ik een schaalbare Cloudflare Worker architectuur
zodat realtime event orchestration performant blijft.

---

# Technische Verantwoordelijkheden

Workers beheren:

* API routing
* auth validation
* websocket upgrades
* Durable Object forwarding.

---

# Waarom Workers Ideaal Zijn

Voordelen:

* lage latency
* automatische schaalbaarheid
* lage operationele kost.

---

# Aanbevolen Structuur

```txt
/src/workers
  api.worker.ts
  websocket.worker.ts
```

---

# Hono Integratie

Hono beheert:

* routes
* middleware
* validation.

---

# Security Implicaties

Workers moeten:

* JWT’s valideren
* websocket auth afdwingen.

---

# Foutscenario’s

## Scenario — Invalid Session

Socket connection probeert reconnect.

---

# Mitigatie

Force reconnect-auth flow.

---

# User Story 0.5 — Durable Object Room Architectuur

## Businessdoel

Realtime multiplayer synchronization structureren.

---

## Waarom Dit Kritisch Is

Teams vereisen:

* gedeelde realtime state
* authoritative progression
* synchronization ownership.

---

# Durable Object Verantwoordelijkheden

* websocket ownership
* room presence
* progression locks
* realtime synchronization.

---

# Room Structuur

```txt
/event/{editionId}/team/{teamId}
```

---

# Waarom Room Isolation

Voorkomt:

* cross-team leakage
* verkeerde broadcasts
* synchronization chaos.

---

# Reconnect Implicaties

Durable Objects moeten:

* reconnect recovery ondersteunen
* room state reconstrueren.

---

# Performance Verwachtingen

Realtime broadcasts moeten:

* sub-second reageren.

---

# User Story 0.6 — Supabase Project Setup

## Businessdoel

Persistence layer opzetten.

---

## User Story

Als developer
wil ik een correcte Supabase setup
zodat auth, storage en persistence stabiel functioneren.

---

# Verantwoordelijkheden

Supabase beheert:

* PostgreSQL
* Auth
* Storage.

Niet:

* realtime gameplay orchestration.

---

# Kritische Tabellen

* editions
* riders
* teams
* missions
* route_segments.

---

# Row Level Security

RLS moet verplicht actief zijn.

---

# Waarom RLS Kritisch Is

Voorkomt:

* datalekken
* ongeautoriseerde queries
* cross-edition access.

---

# Securityregels

Riders mogen enkel:

* eigen edition data zien
* eigen submissions beheren.

---

# User Story 0.7 — Authentication Architectuur

## Businessdoel

Frictionless login experience bouwen.

---

## Ondersteunde Providers

* Google
* Facebook
* Apple.

---

# Waarom Social Login Belangrijk Is

Minimaliseert:

* onboarding friction
* registratiecomplexiteit.

---

# Realtime Implicaties

Websocket auth gebruikt:

* Supabase JWT tokens.

---

# Security Impact

Tokens moeten:

* server-side gevalideerd worden.

---

# User Story 0.8 — Environment Configuratie

## Businessdoel

Veilige environment management structuur creëren.

---

# Configuratiecategorieën

## Frontend

* public API endpoints
* map tokens.

---

## Backend

* Supabase secrets
* Worker secrets
* JWT secrets.

---

# Waarom Belangrijk

Voorkomt:

* secret leakage
* deployment fouten.

---

# User Story 0.9 — Logging & Observability Setup

## Businessdoel

Realtime debugging mogelijk maken.

---

# Waarom Kritisch

Realtime multiplayer bugs zijn:

* moeilijk reproduceerbaar
* timing-afhankelijk.

---

# Logging Vereisten

Log:

* websocket lifecycle
* progression events
* route unlocks
* reconnect flows.

---

# Niet Loggen

Geen:

* gevoelige persoonsgegevens
* volledige GPS history.

---

# Waarom Privacy Belangrijk Is

Platform verwerkt:

* locatiegegevens
* movement patterns.

---

# User Story 0.10 — PWA Fundament Opzetten

## Businessdoel

Mobiele ervaring verbeteren.

---

# Waarom PWA Belangrijk Is

Gebruikers bevinden zich:

* onderweg
* in wisselende netwerken.

---

# Vereisten

PWA moet ondersteunen:

* installability
* offline caching
* splash screens
* mobile persistence.

---

# Offline Strategie

Cache:

* laatste route
* laatste mission
* UI shell.

---

# Niet Offline Ondersteund

Geen:

* nieuwe route unlocks
* live synchronization.

---

# UX Filosofie

De app moet voelen als:

* een native rally companion.

Niet als:

* een website.

---

# Kritische MVP-Doelen

Na deze epic moet bestaan:

* stabiele infrastructuur
* realtime fundering
* websocket architectuur
* auth systeem
* persistence layer
* deployment pipeline
* type-safe contracts
* mobile foundation.

---

# Belangrijkste Architectuurprincipe

Elke funderingsbeslissing moet:

* realtime betrouwbaarheid verhogen
* immersion ondersteunen
* technische schuld minimaliseren
* future scaling mogelijk maken.
