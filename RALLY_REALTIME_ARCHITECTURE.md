# Rally Platform — Realtime Architecture & WebSocket Contracts

# Doel van dit document

Dit document beschrijft:

* de volledige realtime architectuur
* websocket orchestration
* synchronization strategie
* room isolation
* reconnect recovery
* realtime event contracts
* multiplayer state handling.

Dit document moet beschouwd worden als:

* realtime blueprint
* multiplayer contract
* synchronization waarheid.

---

# Kritische Platformrealiteit

Realtime synchronization is geen extra feature.

Het is:

* de kern van de groepsbeleving
* de kern van immersion
* de kern van pacing.

Zonder sterke realtime architectuur:

* voelt het event statisch
* breekt groepsgevoel
* voelt progression traag.

---

# Filosofie

Het platform is:

* event-driven
* websocket-first
* multiplayer-centric.

Polling is onvoldoende.

---

# Waarom WebSockets Essentieel Zijn

De app moet onmiddellijk reageren op:

* route unlocks
* team decisions
* mission completion
* organizer broadcasts
* readiness changes
* live synchronization.

Elke delay vermindert:

* spanning
* cinematic pacing
* groepsgevoel.

---

# Definitieve Stack

## Realtime Transport

* Socket.IO

---

## Stateful Coordination

* Cloudflare Durable Objects.

---

## Persistence

* Supabase PostgreSQL.

---

# Waarom Socket.IO

Socket.IO ondersteunt:

* reconnect recovery
* fallback handling
* event acknowledgements
* room abstractions.

Dit vermindert:

* edge-case complexiteit
* mobiele netwerkproblemen.

---

# Waarom Durable Objects

Durable Objects zijn ideaal voor:

* room ownership
* multiplayer synchronization
* authoritative realtime state.

Elke team-room krijgt:

* één state owner.

Dat voorkomt:

* race conditions
* synchronization chaos.

---

# Realtime Architectuur Overzicht

```txt
Client
  ↓
Socket.IO
  ↓
Cloudflare Worker
  ↓
Durable Object Room
  ↓
Supabase Persistence
```

---

# Room Architectuur

# Filosofie

Realtime state moet geïsoleerd zijn.

Waarom:

* veiligheid
* eenvoud
* schaalbaarheid
* debugging.

---

# Edition Room

## Structuur

```txt
/event/{editionId}
```

---

## Verantwoordelijkheden

* globale announcements
* event-wide updates
* weather alerts
* leaderboard refreshes.

---

# Team Room

## Structuur

```txt
/event/{editionId}/team/{teamId}
```

---

## Verantwoordelijkheden

* route synchronization
* decision propagation
* mission updates
* presence tracking
* progression synchronization.

---

# Waarom Team Rooms Kritisch Zijn

Teams vormen:

* multiplayer units
* synchronization boundaries.

Elke team room heeft:

* eigen realtime state
* eigen progression state.

---

# Admin Room

## Structuur

```txt
/event/{editionId}/admin
```

---

## Verantwoordelijkheden

* organizer controls
* emergency broadcasts
* event orchestration
* moderation.

---

# Durable Object Filosofie

# Kritische Architectuurkeuze

Durable Objects bewaren:

* transient multiplayer state.

Niet PostgreSQL.

---

# Waarom Dit Belangrijk Is

PostgreSQL is niet geschikt voor:

* snelle realtime synchronization
* room coordination
* websocket ownership.

Dat veroorzaakt:

* latency
* lock contention
* scalingproblemen.

---

# Durable Object State

## Team Presence

Bijvoorbeeld:

* connected riders
* active sockets
* readiness states.

---

## Route Progression Locks

Voorkomt:

* duplicate progression
* dubbele unlocks.

---

## Temporary Synchronization State

Bijvoorbeeld:

* pending decisions
* countdown timers
* mission synchronization.

---

# Waarom Transient State Belangrijk Is

Niet alle realtime state moet persistent zijn.

Persistentie gebeurt enkel voor:

* belangrijke progression
* audit trails
* analytics.

---

# Reconnect Filosofie

# Kritische Realiteit

Mobiele netwerken zijn instabiel.

Disconnects zijn gegarandeerd.

Dus:
reconnect recovery is core architecture.

---

# Reconnect Flow

## 1. Socket Disconnect

Frontend detecteert:

* websocket verlies.

---

## 2. UI Degradeert Elegant

Gebruiker behoudt:

* huidige route
* huidige mission
* lokale progression.

---

## 3. Reconnect Attempt

Socket reconnect met:

* session token
* room subscriptions.

---

## 4. State Reconciliation

Backend levert:

* missed events
* latest progression
* current room state.

---

# Waarom Reconciliation Kritisch Is

Gebruikers mogen nooit:

* progression verliezen
* verkeerde route zien
* team state verliezen.

---

# Idempotency Filosofie

# Kritische Realiteit

Mobiele clients kunnen:

* duplicate events sturen
* delayed events sturen
* reconnecten met oude state.

Dus:
alle realtime events moeten:

* idempotent zijn
* duplicate-safe zijn.

---

# Voorbeelden

## GOED

Mission completion kan veilig opnieuw gestuurd worden.

---

## SLECHT

Dubbele progression unlock.

---

# Race Condition Preventie

# Kritische Multiplayeruitdaging

Meerdere riders kunnen:

* simultaan actions uitvoeren.

Bijvoorbeeld:

* dubbele decision submissions
* dubbele checkpoint hits.

---

# Oplossing

Gebruik:

* Durable Object locking
* authoritative progression owner.

---

# WebSocket Event Naming Filosofie

Events moeten:

* expliciet
* domeingedreven
* semantisch duidelijk
  zijn.

Geen:

* vague event names
* generic actions.

---

# Event Namespace Structuur

```txt
team.*
route.*
mission.*
decision.*
leaderboard.*
admin.*
system.*
```

---

# Team Events

# team.joined

## Doel

Realtime presence update.

---

## Payload

```json
{
  "teamId": "uuid",
  "riderId": "uuid",
  "displayName": "string",
  "vehicle": {
    "manufacturer": "BMW",
    "model": "GS 1250"
  }
}
```

---

# team.readiness.updated

## Doel

Synchronisatie van ready states.

---

## Payload

```json
{
  "teamId": "uuid",
  "riderId": "uuid",
  "isReady": true
}
```

---

# Route Events

# route.segment.unlocked

## Doel

Nieuwe route onthullen.

---

## Payload

```json
{
  "segmentId": "uuid",
  "routeType": "ADVENTURE",
  "navigationPayload": {
    "gpxUrl": "string"
  },
  "missionPayload": {
    "missionId": "uuid"
  }
}
```

---

# Waarom Dit Event Kritisch Is

Dit event vormt:

* één van de meest cinematic momenten van het platform.

Latency moet minimaal zijn.

---

# route.progress.updated

## Doel

Synchronisatie van teamprogress.

---

## Payload

```json
{
  "teamId": "uuid",
  "activeSegmentId": "uuid",
  "checkpointProgress": 0.7
}
```

---

# Mission Events

# mission.available

## Doel

Nieuwe quest onthullen.

---

## Payload

```json
{
  "missionId": "uuid",
  "title": "string",
  "missionType": "PHOTO",
  "rewardPoints": 100
}
```

---

# mission.completed

## Doel

Mission synchronization.

---

## Payload

```json
{
  "missionId": "uuid",
  "teamId": "uuid",
  "completedBy": "uuid",
  "awardedPoints": 100
}
```

---

# Decision Events

# decision.available

## Doel

Decision point activeren.

---

## Payload

```json
{
  "decisionId": "uuid",
  "countdown": 60,
  "mainRoutePreview": {},
  "adventureRoutePreview": {}
}
```

---

# decision.selected

## Doel

Routekeuze bevestigen.

---

## Payload

```json
{
  "decisionId": "uuid",
  "selectedRouteType": "ADVENTURE",
  "selectedBy": "uuid"
}
```

---

# Organizer Events

# admin.broadcast

## Doel

Globale organizercommunicatie.

---

## Payload

```json
{
  "messageType": "ALERT",
  "title": "Storm Warning",
  "content": "Heavy rain incoming"
}
```

---

# System Events

# system.reconnect.required

## Doel

Client forceren tot resync.

---

## Payload

```json
{
  "reason": "STATE_MISMATCH"
}
```

---

# Presence Filosofie

Presence verhoogt:

* groepsgevoel
* immersion
* multiplayer awareness.

---

# Presence Data

Bijvoorbeeld:

* online state
* active riders
* bike identity
* readiness.

---

# Waarom Presence Belangrijk Is

De app moet voelen alsof:

* je deel bent van een levende groep.

---

# Offline Filosofie

# Kritische Realiteit

Volledige realtime kan niet gegarandeerd worden.

Dus:
het platform moet degradeerbaar zijn.

---

# Offline Toegestaan

Frontend bewaart lokaal:

* unlocked routes
* mission state
* laatste progression.

---

# Niet Offline Ondersteund

* nieuwe unlocks
* live leaderboard
* organizer pushes.

---

# Performance Filosofie

# Kritische Mobile Constraints

De app draait:

* onderweg
* mobiel
* op wisselende netwerken.

Dus:

* kleine payloads
* beperkte frequentie
* throttled updates.

---

# GPS Strategie

Geen continue streaming.

Gebruik:

* checkpoint-gebaseerde progression
* throttled updates.

---

# Security Filosofie

# Backend Authority Verplicht

Frontend mag nooit:

* realtime progression bepalen
* scores manipuleren
* geheime routes kennen.

---

# WebSocket Authenticatie

Alle socket connections vereisen:

* gevalideerde Supabase session.

---

# Hidden Route Protection

Adventure routes mogen:

* niet preloaden
* niet in frontend state bestaan voor unlock.

---

# Kritisch UX-Principe

Realtime is geen technische gimmick.

Realtime bestaat om:

* spanning te creëren
* groepsdynamiek te versterken
* cinematic reveals mogelijk te maken
* quest immersion te ondersteunen.
