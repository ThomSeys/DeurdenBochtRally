# Rally Platform — EPIC 2 — Team Systems & Multiplayer Coordination

# Doel van deze Epic

Deze epic definieert:

* team creation
* multiplayer groepsdynamiek
* realtime team synchronization
* invite systems
* team readiness
* groepsprogression
* multiplayer authority.

Deze epic vormt:

* de kern van de sociale ervaring
* de basis van groepscoördinatie
* de multiplayerlaag van het platform.

---

# Filosofie

Teams zijn geen simpele user groups.

Teams zijn:

* realtime multiplayer units
* progression containers
* gedeelde adventure groups.

De architectuur moet daarom:

* realtime-first zijn
* synchronization-safe zijn
* reconnect tolerant zijn
* authoritative progression ondersteunen.

---

# Kritisch UX-Principe

Teams moeten voelen als:

* een rally crew
* een adventure squad
* een gezamenlijke missie.

Niet als:

* een Slack group
* een generieke multiplayer lobby.

---

# Architectuurdoelen

Deze epic moet:

* realtime groepsgevoel creëren
* synchronization stabiliteit garanderen
* groepsprogression ondersteunen
* cinematic readiness ondersteunen
* reconnect recovery ondersteunen.

---

# Technologische Fundamenten

## Realtime

* Socket.IO
* Durable Objects.

---

## Persistence

* Supabase PostgreSQL.

---

## Frontend State

* Zustand.

---

# Kernarchitectuurprincipe

Een team heeft:

* één authoritative realtime state.

Die state leeft in:

* Durable Objects.

---

# Waarom Dit Kritisch Is

Voorkomt:

* race conditions
* duplicate progression
* synchronization conflicts.

---

# User Story 2.1 — Team Aanmaken

## Businessdoel

Riders toelaten hun eigen groep te vormen.

---

## User Story

Als rider
wil ik een team kunnen aanmaken
zodat ik samen met anderen het event kan rijden.

---

# Team Entity

```txt
Team
- id
- edition_id
- name
- invite_code
- leader_rider_id
- current_state
```

---

# Frontend Flow

## 1. Teamnaam invoeren

---

## 2. Team creëren

---

## 3. Invite code genereren

---

## 4. Team lobby openen

---

# UX Filosofie

Het creëren van een team moet voelen als:

* het vormen van een rally squad.

Niet als:

* een database entry creëren.

---

# Backend Verantwoordelijkheden

Backend moet:

* invite code genereren
* leader toewijzen
* edition koppeling maken.

---

# Security Implicaties

Invite codes moeten:

* random zijn
* moeilijk voorspelbaar zijn.

---

# Realtime Implicaties

Na creatie:

* automatisch team room join.

---

# User Story 2.2 — Team Join Via Invite Code

## Businessdoel

Snelle team onboarding mogelijk maken.

---

## User Story

Als rider
wil ik een invite code gebruiken
zodat ik snel bij een team kan aansluiten.

---

# Frontend Flow

## 1. Invite code invoeren

---

## 2. Team preview tonen

Toon:

* teamnaam
* riders
* bikes.

---

## 3. Join bevestigen

---

# Waarom Team Preview Belangrijk Is

Versterkt:

* identiteit
* groepsgevoel
* anticipation.

---

# Backend Validatie

Controleer:

* edition consistency
* invite validity
* team capacity.

---

# Realtime Implicaties

Bij join:

* realtime presence update broadcasten.

---

# WebSocket Event

## team.joined

```json
{
  "teamId": "uuid",
  "rider": {
    "displayName": "string",
    "vehicle": {
      "manufacturer": "BMW",
      "model": "GS"
    }
  }
}
```

---

# User Story 2.3 — Team Lobby Realtime Synchronization

## Businessdoel

Een levende multiplayer lobby creëren.

---

## Waarom Dit Belangrijk Is

Voor het event start moet al ontstaan:

* spanning
* groepsgevoel
* team presence.

---

# Frontend Vereisten

Realtime tonen:

* connected riders
* readiness
* bike identity
* leader indicator.

---

# Durable Object Verantwoordelijkheden

Beheren van:

* room members
* socket ownership
* readiness state.

---

# Waarom Durable Objects Ideaal Zijn

Elke team room heeft:

* één state owner.

Dit voorkomt:

* synchronization chaos.

---

# Realtime Events

## team.presence.updated

```json
{
  "members": []
}
```

---

## team.rider.connected

```json
{
  "riderId": "uuid"
}
```

---

## team.rider.disconnected

```json
{
  "riderId": "uuid"
}
```

---

# UX Filosofie

Lobby moet voelen als:

* een crew die zich voorbereidt op vertrek.

---

# User Story 2.4 — Team Readiness Systeem

## Businessdoel

Vertrekcoördinatie ondersteunen.

---

## User Story

Als team
willen we een gezamenlijke ready-state hebben
zodat vertrek synchroon verloopt.

---

# Waarom Dit Belangrijk Is

Readiness verhoogt:

* anticipation
* multiplayer spanning
* groepscoördinatie.

---

# Frontend Vereisten

Toon:

* ready state per rider
* globale team readiness.

---

# Realtime Events

## team.readiness.updated

```json
{
  "riderId": "uuid",
  "isReady": true
}
```

---

# Durable Object Verantwoordelijkheden

Authoritative readiness state bewaren.

---

# Foutscenario’s

## Scenario — Rider Disconnect Tijdens Ready Phase

---

# Verwachte Flow

* ready state behouden
* reconnect recovery uitvoeren.

---

# User Story 2.5 — Team Leader Autoriteit

## Businessdoel

Groepsbeslissingen centraliseren.

---

## Waarom Dit Kritisch Is

Bij decision points moet:

* één authoritative keuze bestaan.

---

# Leader Verantwoordelijkheden

Leader bepaalt:

* route keuzes
* groepsprogression.

---

# Waarom Dit Goed Werkt

Verhoogt:

* groepsdynamiek
* spanning
* accountability.

---

# Backend Validatie

Enkel leaders mogen:

* decision events triggeren.

---

# Securityprincipe

Frontend authority is onvoldoende.

Backend valideert:

* rider role.

---

# Realtime Events

## decision.selected

```json
{
  "selectedRoute": "ADVENTURE"
}
```

---

# User Story 2.6 — Team Progression Synchronisatie

## Businessdoel

Alle riders synchroon houden.

---

## Waarom Dit Kritisch Is

Groepsprogression vormt:

* de kern van multiplayer immersion.

---

# Synchronisatievereisten

Alle teamleden moeten realtime ontvangen:

* route unlocks
* mission updates
* progression state.

---

# Durable Object Verantwoordelijkheden

Authoritative progression owner.

---

# WebSocket Events

## route.segment.unlocked

```json
{
  "segmentId": "uuid"
}
```

---

## route.progress.updated

```json
{
  "activeSegmentId": "uuid"
}
```

---

# Waarom Synchronisatie Belangrijk Is

Teams mogen nooit:

* verschillende route states hebben.

---

# User Story 2.7 — Team Disconnect & Reconnect Recovery

## Businessdoel

Realtime continuity behouden.

---

## Kritische Realiteit

Mobiele netwerken zijn instabiel.

Disconnects zijn gegarandeerd.

---

# Vereisten

Reconnect moet herstellen:

* room membership
* progression state
* readiness state.

---

# Frontend Vereisten

UI mag niet:

* volledig resetten
* progression verliezen.

---

# Backend Vereisten

Durable Objects reconstrueren:

* realtime room state.

---

# UX Filosofie

Reconnect moet bijna:

* onzichtbaar voelen.

---

# User Story 2.8 — Team Presence Overlay

## Businessdoel

Realtime groepsgevoel versterken.

---

# Frontend Vereisten

Overlay toont:

* rider avatars
* bike metadata
* online status
* readiness.

---

# Waarom Dit Belangrijk Is

Het platform moet voelen als:

* een levende multiplayer experience.

---

# Realtime Vereisten

Presence updates moeten:

* low latency hebben
* sub-second aanvoelen.

---

# Performanceprincipe

Presence payloads moeten:

* klein blijven.

---

# User Story 2.9 — Team Lifecycle State Machine

## Businessdoel

Team progression structureren.

---

# Team States

```txt
WAITING
READY
ACTIVE
PAUSED
FINISHED
```

---

# Waarom State Machines Belangrijk Zijn

Voorkomt:

* invalid progression
* synchronization chaos.

---

# Voorbeelden

## Verboden

FINISHED → ACTIVE.

---

## Toegestaan

READY → ACTIVE.

---

# Backend Verantwoordelijkheden

Alle state transitions:

* server-authoritative.

---

# User Story 2.10 — Multiplayer Analytics & Observability

## Businessdoel

Realtime multiplayer gedrag monitoren.

---

# Track Bijvoorbeeld

* reconnect frequency
* average team size
* readiness duration
* disconnect rates.

---

# Waarom Dit Belangrijk Is

Realtime multiplayer systems vereisen:

* observability
* synchronization insights.

---

# Privacyregels

Geen:

* overmatige GPS logging
* gevoelige persoonsgegevens.

---

# Kritische MVP-Doelen

Na deze epic moet bestaan:

* stabiele teams
* realtime multiplayer synchronization
* team progression
* readiness systems
* reconnect recovery
* authoritative rooms
* cinematic multiplayer lobby
* presence systems.

---

# Belangrijkste Architectuurprincipe

Teams bestaan niet enkel om riders te groeperen.

Teams bestaan om:

* groepsspanning te creëren
* multiplayer immersion te versterken
* gedeelde beslissingen mogelijk te maken
* het gevoel van een rally crew te creëren.
