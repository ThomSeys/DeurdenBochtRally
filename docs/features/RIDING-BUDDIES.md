# Riding Buddies Feature - Installatie

Deze feature voegt een compleet riding buddies systeem toe met groepsformatie, achievements en notificaties.

## Overzicht Features

✅ **Buddy Systeem**
- Zoek deelnemers op e-mailadres
- Voeg riding buddies toe/verwijder
- Zie buddy's: motor, route voorkeur, contactgegevens
- Profielfoto's overal zichtbaar

✅ **Buddy Achievements**
- 8 groep achievements (Zone Explorers, 50km Together, etc.)
- Automatische unlock bij check-ins
- Progressie tracking
- Badge systeem met kleuren

✅ **Check-in Notificaties**
- Buddies krijgen push notificatie bij check-in
- Ook notificaties bij check-out
- Automatisch via database triggers

✅ **Admin Statistieken**
- Totaal overzicht buddy connecties
- Groepsgrootte verdeling
- Achievement statistieken
- Top 20 buddy groepen

## Database Migraties

Voer de volgende SQL files uit in deze volgorde in Supabase SQL Editor:

### 1. Buddy Systeem
```bash
scripts/add-riding-buddies.sql
```
- Creëert `riding_buddies` tabel (many-to-many)
- Creëert `participant_buddies` view (bidirectioneel)
- RLS policies voor veiligheid
- Indexes voor performance

### 2. Buddy Achievements
```bash
scripts/add-buddy-achievements.sql
```
- Creëert `buddy_achievements` tabel (achievement definitions)
- Creëert `buddy_group_achievements` tabel (unlocked achievements)
- Creëert `buddy_group_achievement_members` tabel (groepsleden)
- 8 default achievements
- Automatische unlock functie
- Trigger bij check-ins

### 3. Check-in Notificaties
```bash
scripts/add-buddy-notifications.sql
```
- Push notificaties naar buddies bij check-in
- Ook notificaties bij check-out
- Automatische triggers op `rally_zone_checkins`

## Type Generatie

Na het uitvoeren van de SQL migraties:

```bash
bash scripts/generate-supabase-types.sh
```

Dit genereert TypeScript types voor alle nieuwe tabellen.

## Routes

De volgende routes zijn toegevoegd:

- `/dashboard/riding-buddies` - Buddy management voor gebruikers
- `/admin/buddy-stats` - Statistieken dashboard voor admin
- `/api/riding-buddies` - API voor zoeken en toevoegen

## UI Components

### Dashboard Features
- **Stats Grid**: Totaal buddies, achievements, recent check-ins
- **Achievements Section**: Verdiende groep badges met leden
- **Activity Feed**: Recente buddy check-ins bij zones
- **Buddy List**: Uitgebreide cards met:
  - Profielfoto
  - Contact info (email + telefoon klikbaar)
  - Motor informatie (merk + model)
  - Route voorkeur badge (Rally/Scenic/Toertocht)
  - Buddy sinds datum
  - Verwijder knop

### Admin Dashboard
- **Main Stats**: Totaal deelnemers, met buddies, gemiddeld, grootste groep
- **Group Distribution**: Solo, klein, middel, groot
- **Achievement Stats**: Hoeveel groepen per achievement
- **Top 20 Groups**: Grootste buddy groepen met alle leden

## Profielfoto's

De `profile_photo_url` field bestaat al in de `participants` tabel en wordt nu overal gebruikt:
- Dashboard cards
- Buddy lists
- Achievement members
- Admin overzichten
- Search results

Upload functionaliteit kan later toegevoegd worden via profielbewerking.

## Achievement Types

| Achievement | Requirement | Points | Color |
|------------|------------|--------|-------|
| Zone Explorers | Alle zones samen | 50 | purple |
| 50km Together | 50km samen | 20 | blue |
| 100km Together | 100km samen | 40 | indigo |
| Checkpoint Champions | 5 zones samen | 15 | green |
| Rally Masters | 10 zones samen | 30 | emerald |
| 4 Hour Adventure | 4u samen | 25 | orange |
| Early Birds | Check-in voor 08:00 | 20 | yellow |
| Three Musketeers | 3+ buddies | 15 | teal |

## Push Notification Format

Check-in notificaties hebben dit format:

```json
{
  "title": "Buddy Check-in 📍",
  "body": "John Doe heeft ingecheckt bij Zone Alpha",
  "data": {
    "type": "buddy_checkin",
    "buddy_id": "uuid",
    "zone_id": "uuid",
    "zone_name": "Zone Alpha",
    "checkin_id": "uuid"
  }
}
```

Check-out notificaties:

```json
{
  "title": "Buddy Vertrokken 🏍️",
  "body": "John Doe is vertrokken van Zone Alpha",
  "data": {
    "type": "buddy_checkout",
    ...
  }
}
```

## Development Notes

### Bidirectional Buddies
De `participant_buddies` view zorgt ervoor dat buddy relaties altijd bidirectioneel zijn:
- Als A buddy is van B, dan is B automatisch ook buddy van A
- Bij verwijderen worden beide richtingen verwijderd

### Achievement Unlocking
Achievements worden automatisch gecontroleerd na elke check-in via de trigger.
De functie `check_buddy_achievements(participant_id)` kan ook manueel aangeroepen worden.

### RLS Security
Alle tabellen hebben Row Level Security policies:
- Users kunnen alleen hun eigen buddies zien
- Users kunnen alleen buddies toevoegen aan zichzelf
- Achievements zijn zichtbaar voor alle groepsleden

## Testing

1. Voeg buddy's toe via email search
2. Check in bij rally zones
3. Controleer of achievements unlocked worden
4. Test notificaties bij check-in/out
5. Bekijk admin statistieken

## Future Enhancements

Potentiële uitbreidingen:
- Live locatie delen (GPS tracking)
- Groep chat functie
- Voice notes
- Geplande stops op kaart
- Groep foto albums
- Tempo matching algoritme
