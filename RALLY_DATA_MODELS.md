# Rally Platform — Data Models & Domain Entities

# Doel van dit document

Dit document definieert:

* alle kernentities
* relationele modellen
* edition-aware relaties
* realtime state boundaries
* ownership regels
* persistence strategie.

Dit document moet beschouwd worden als:

* database blueprint
* domain contract
* backend truth source.

---

# Kernarchitectuurprincipe

Vrijwel alle entities zijn:

* edition-aware.

Dat betekent:

* historische data blijft bestaan
* meerdere eventedities zijn mogelijk
* replaybaarheid blijft behouden
* analytics worden mogelijk.

---

# Naming Filosofie

Entities moeten:

* expliciet
* domeingedreven
* leesbaar
  zijn.

Geen generieke namen zoals:

* Data
* Item
* Content.

---

# Entity — Edition

# Doel

Vertegenwoordigt één volledige eventeditie.

Edition is de root context van:

* routes
* teams
* missions
* leaderboards
* realtime sessions.

---

# Edition Entity

```txt
Edition
- id
- slug
- name
- description
- status
- start_date
- end_date
- registration_open
- active_flag
- branding_theme
- created_at
- updated_at
```

---

# Edition Statuses

## DRAFT

Nog in configuratie.

---

## PUBLISHED

Registraties geopend.

---

## ACTIVE

Event live.

---

## COMPLETED

Event afgelopen.

---

## ARCHIVED

Historische opslag.

---

# Waarom Edition-Aware Architectuur Kritisch Is

Zonder edition-scoping:

* moet data verwijderd worden
* ontstaat state pollution
* worden analytics moeilijk
* ontstaan migratieproblemen.

---

# Entity — Rider

# Doel

Vertegenwoordigt de identiteit van een deelnemer.

Een rider bestaat:

* over meerdere edities
* onafhankelijk van eventstatus.

---

# Rider Entity

```txt
Rider
- id
- auth_provider_id
- display_name
- first_name
- last_name
- avatar_url
- bio
- country_code
- emergency_contact_name
- emergency_contact_phone
- riding_style
- experience_level
- active_vehicle_id
- created_at
- updated_at
```

---

# Riding Styles

* TOURING
* SPORT
* ADVENTURE
* CRUISER
* MIXED.

---

# Experience Levels

* BEGINNER
* INTERMEDIATE
* ADVANCED.

---

# UX Impact

Rider metadata ondersteunt:

* identity
* communitygevoel
* personalization
* team dynamics.

---

# Entity — RiderVehicle

# Doel

Vertegenwoordigt een motorfiets gekoppeld aan een rider.

Motoren zijn een essentieel onderdeel van:

* identiteit
* event presence
* communitygevoel.

---

# RiderVehicle Entity

```txt
RiderVehicle
- id
- rider_id
- manufacturer
- model
- year
- engine_cc
- category
- nickname
- color
- license_plate_hash
- photo_url
- active_flag
- created_at
```

---

# Vehicle Categories

* ADVENTURE
* SPORT
* NAKED
* TOURING
* CRUISER
* ENDURO
* SUPERMOTO.

---

# Privacyprincipe

Volledige nummerplaten mogen niet opgeslagen worden.

Gebruik:

* hashing
* of gedeeltelijke masking.

---

# Waarom Aparte Vehicle Entity

Ondersteunt later:

* meerdere motoren
* sponsorintegraties
* bike showcases
* analytics
* historiek.

---

# Entity — RiderEdition

# Doel

Koppelt rider aan specifieke editie.

Deze entity bevat:

* event-specifieke state
* progressie
* score
* deelnamegegevens.

---

# RiderEdition Entity

```txt
RiderEdition
- id
- rider_id
- edition_id
- team_id
- role
- check_in_status
- started_at
- finished_at
- final_score
- status
```

---

# Waarom Tussenentity Belangrijk Is

Een rider kan:

* meerdere events rijden
* verschillende teams hebben
* verschillende resultaten hebben.

---

# Roles

* LEADER
* MEMBER
* ORGANIZER.

---

# RiderEdition Statuses

* REGISTERED
* CHECKED_IN
* ACTIVE
* FINISHED
* DISQUALIFIED.

---

# Entity — Team

# Doel

Vertegenwoordigt een groep riders binnen een editie.

---

# Team Entity

```txt
Team
- id
- edition_id
- name
- invite_code
- leader_rider_id
- current_route_segment_id
- current_state
- total_score
- created_at
```

---

# Waarom current_route_segment_id Belangrijk Is

Realtime synchronization vereist:

* één authoritative progression state.

---

# Team States

* WAITING
* READY
* ACTIVE
* PAUSED
* FINISHED.

---

# Entity — RouteSegment

# Doel

Kleinste unlockbare navigatie-eenheid.

---

# RouteSegment Entity

```txt
RouteSegment
- id
- edition_id
- name
- route_type
- gpx_file_url
- geometry_json
- estimated_duration_minutes
- start_checkpoint_id
- end_checkpoint_id
- decision_point_id
- next_route_segment_id
- created_at
```

---

# Route Types

* MAIN
* ADVENTURE
* REJOIN
* SECRET.

---

# Waarom geometry_json

Voor:

* kaart rendering
* previews
* geofencing
* checkpoint proximity.

---

# Entity — DecisionPoint

# Doel

Moment waarop route splitst.

---

# DecisionPoint Entity

```txt
DecisionPoint
- id
- edition_id
- name
- description
- checkpoint_id
- main_route_segment_id
- adventure_route_segment_id
- timeout_seconds
- active_flag
```

---

# Waarom timeout_seconds

Ondersteunt:

* pacing
* spanning
* urgency.

---

# Entity — Mission

# Doel

Quest/objective gekoppeld aan een route.

---

# Mission Entity

```txt
Mission
- id
- edition_id
- route_segment_id
- mission_type
- title
- narrative_text
- reward_points
- validation_type
- requires_media
- active_flag
```

---

# Mission Types

* PHOTO
* VIDEO
* TEXT
* QR
* LOCATION.

---

# Validation Types

* MANUAL
* AUTO_LOCATION
* QR_SCAN.

---

# Waarom Narrative Belangrijk Is

Missions moeten aanvoelen als:

* quests
* avonturen
* ontdekkingen.

Niet als:

* formulieren.

---

# Entity — MissionSubmission

# Doel

Bewijs van mission completion.

---

# MissionSubmission Entity

```txt
MissionSubmission
- id
- mission_id
- rider_edition_id
- team_id
- media_url
- text_response
- submission_status
- submitted_at
- validated_at
- validation_notes
```

---

# Submission Statuses

* PENDING
* APPROVED
* REJECTED.

---

# Waarom Moderatie Belangrijk Kan Worden

Foto/video challenges kunnen:

* review vereisen
* frauderisico hebben.

---

# Entity — Checkpoint

# Doel

Locatie waar progression gebeurt.

---

# Checkpoint Entity

```txt
Checkpoint
- id
- edition_id
- name
- latitude
- longitude
- radius_meters
- checkpoint_type
- active_flag
```

---

# Checkpoint Types

* START
* DECISION
* MISSION
* FINISH
* SECRET.

---

# Waarom radius_meters Belangrijk Is

GPS is onnauwkeurig.

Geofencing vereist:

* tolerantie
* drift handling.

---

# Entity — TeamDecision

# Doel

Audit trail van routekeuzes.

---

# TeamDecision Entity

```txt
TeamDecision
- id
- edition_id
- team_id
- decision_point_id
- selected_route_type
- selected_by_rider_id
- selected_at
```

---

# Waarom Audit Trails Kritisch Zijn

Belangrijk voor:

* debugging
* analytics
* replay systems
* dispute handling.

---

# Entity — RouteUnlock

# Doel

Bijhouden welke route-segmenten reeds zichtbaar zijn.

---

# RouteUnlock Entity

```txt
RouteUnlock
- id
- edition_id
- rider_edition_id
- route_segment_id
- unlocked_at
```

---

# Waarom RouteUnlock Bestaat

Belangrijk voor:

* reconnect recovery
* offline persistence
* synchronization recovery.

---

# Entity — LeaderboardEntry

# Doel

Snapshot van ranking.

---

# LeaderboardEntry Entity

```txt
LeaderboardEntry
- id
- edition_id
- team_id
- score
- completed_missions
- adventure_routes_taken
- updated_at
```

---

# Waarom Snapshot-Based Leaderboards

Voorkomt:

* zware recalculaties
* realtime performanceproblemen.

---

# Entity — LiveEventMessage

# Doel

Realtime organizer communicatie.

---

# LiveEventMessage Entity

```txt
LiveEventMessage
- id
- edition_id
- message_type
- title
- content
- priority
- broadcast_at
- expires_at
```

---

# Message Types

* ALERT
* MISSION
* WEATHER
* BONUS
* SYSTEM.

---

# Entity — MediaAsset

# Doel

Centrale opslagreferentie voor uploads.

---

# MediaAsset Entity

```txt
MediaAsset
- id
- edition_id
- uploader_rider_id
- asset_type
- storage_provider
- storage_key
- mime_type
- file_size
- uploaded_at
```

---

# Waarom Centrale Media Entity

Ondersteunt:

* storage abstraction
* moderatie
* analytics
* future CDN migration.

---

# Entity Relaties

```txt
Edition
 ├── Teams
 ├── Missions
 ├── RouteSegments
 ├── Checkpoints
 ├── DecisionPoints
 └── Leaderboards

Rider
 ├── RiderVehicles
 └── RiderEditions

Team
 ├── RiderEditions
 ├── TeamDecisions
 └── LeaderboardEntries
```

---

# Realtime State Filosofie

Niet alle realtime state hoort in PostgreSQL.

Transient multiplayer state hoort in:

* Durable Objects.

---

# Durable Object State

Bijvoorbeeld:

* websocket presence
* active room members
* temporary progression locks
* synchronization state.

---

# Waarom Dit Belangrijk Is

Voorkomt:

* overmatige database writes
* latency
* synchronization chaos.

---

# Persistence Filosofie

PostgreSQL bewaart:

* waarheid
* historiek
* analytics.

Durable Objects beheren:

* tijdelijke realtime orchestration.

---

# Belangrijke Architectuurregel

Frontend mag NOOIT:

* rechtstreeks database waarheid bepalen.

Backend blijft:

* authoritative
* validating
* progression controlling.
