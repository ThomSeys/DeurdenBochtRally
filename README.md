# Rally Platform — Architecture & Development Index

> Master index voor de opgesplitste architectuur- en ontwikkelingsdocumentatie.

---

# Waarom opgesplitst?

Het projectdocument is te groot geworden om nog praktisch beheerd te worden als één enkel bestand.

Daarom wordt het opgesplitst in meerdere gespecialiseerde Markdown-documenten.

Dit heeft bijkomende voordelen:

* betere LLM-contextcontrole
* duidelijkere ownership
* makkelijker onderhoud
* snellere navigatie
* betere engineering onboarding.

---

# Aanbevolen `/docs` Structuur

```txt
/docs
  /product
    vision.md
    gameplay-loop.md
    event-philosophy.md

  /architecture
    system-overview.md
    frontend-architecture.md
    backend-architecture.md
    realtime-architecture.md
    edition-architecture.md
    security-architecture.md
    infrastructure.md

  /data-models
    entities.md
    relationships.md
    realtime-state.md

  /epics
    epic-0-foundation.md
    epic-1-authentication.md
    epic-2-rider-team-management.md
    epic-3-route-orchestration.md
    epic-4-decision-system.md
    epic-5-missions.md
    epic-6-realtime-sync.md
    epic-7-admin-tools.md
    epic-8-event-operations.md

  /technical
    websocket-events.md
    durable-objects.md
    gpx-processing.md
    state-machines.md
    offline-strategy.md
    caching-strategy.md

  /ux
    cinematic-principles.md
    mobile-first.md
    animation-guidelines.md
    emotional-pacing.md
```

---

# Document Beschrijvingen

## `/product`

Beschrijft:

* eventfilosofie
* doelgroep
* gameplay loop
* communitygevoel
* immersion principes.

---

## `/architecture`

Beschrijft:

* globale systeemarchitectuur
* frontendarchitectuur
* backendarchitectuur
* realtime infrastructuur
* edition-scoping
* security modellen.

---

## `/data-models`

Beschrijft:

* relationele modellen
* entity boundaries
* realtime state
* database relaties
* edition-aware data flows.

---

## `/epics`

Bevat:

* implementation-grade epics
* technisch uitgewerkte stories
* realtime flows
* websocket orchestration
* frontend/backend granulariteit.

Elke epic moet geschreven zijn als:

* implementation blueprint
* architecturaal contract
* LLM-uitvoerbare ontwikkelspecificatie.

---

## `/technical`

Beschrijft:

* websocket event contracts
* GPX parsing flows
* Durable Object strategie
* offline synchronisatie
* reconnect behavior
* state recovery.

---

## `/ux`

Beschrijft:

* cinematic UX
* animation systems
* emotional pacing
* mission reveal design
* groepsinteractie.

---

# Definitieve Technologische Beslissingen

## Frontend

* React 19
* React Router 7
* TypeScript
* Tailwind CSS
* Zustand
* Framer Motion
* Socket.IO client
* PWA ondersteuning.

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

## Routing

* GPX-based route orchestration
* segment-driven navigation
* navigation handoff model.

---

# Kritische Architectuurprincipes

## Alles is edition-aware

Vrijwel alle data bevat:

* edition_id.

Waarom:

* meerdere eventedities
* analytics
* historiek
* replaybaarheid
* schaalbaarheid.

---

## Backend blijft authoritative

Frontend bepaalt NOOIT:

* progression
* route unlocks
* scoring
* mission completion.

Waarom:

* anti-cheat
* progression integrity
* hidden route secrecy.

---

## Realtime-first architectuur

Het platform is:

* event-driven
* websocket-centric
* multiplayer-georiënteerd.

Realtime synchronization is een kernonderdeel van de ervaring.

---

## SOLID verplicht

Alle development moet:

* SOLID volgen
* domain-driven georganiseerd zijn
* bounded contexts respecteren.

Waarom:

* realtime systems worden snel chaotisch zonder duidelijke boundaries.

---

# Kritisch UX-principe

De app mag nooit aanvoelen als:

* fleet management software
* route tooling
* logistieke software.

Het moet voelen als:

* een cinematic quest experience
* een live adventure system
* een interactieve rally.

---

# Belangrijke Volgende Stap

De volgende documenten moeten afzonderlijk uitgewerkt worden:

1. volledige systeemarchitectuur
2. volledige datamodellen
3. volledige realtime architectuur
4. volledige GPX pipeline
5. volledig uitgewerkte epics
6. websocket event contracts
7. frontend state architecture
8. admin tooling architecture.
