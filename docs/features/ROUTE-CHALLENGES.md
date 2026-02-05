# Route Challenges Systeem

Implementatie van optionele opdrachten op route locations binnen rally zones.

## 📋 Overzicht

Deelnemers kunnen nu bij specifieke locations op de route opdrachten voltooien:
- **Foto opdrachten**: "Maak een foto van het uitzicht"
- **Tekst vragen**: "Wat staat er op de kerk?"
- **Multiple choice**: Kies het juiste antwoord
- **Getal**: "Hoeveel traptreden telt de toren?"

## 🎯 Features

### Voor Deelnemers
- Opdrachten worden getoond bij route tips
- Verschillende opdracht types met eigen input
- Automatische validatie waar mogelijk
- Punten verdienen voor correcte antwoorden
- Progress tracking (voltooide opdrachten)

### Voor Admin
- Opdrachten toevoegen via Sanity Studio
- Handmatige validatie van submissions
- Statistieken per deelnemer
- Flexibele punten toekenning

## 🔧 Installatie

### 1. Database Setup

Run de SQL migratie:

```bash
psql -h [YOUR_SUPABASE_HOST] -U postgres -d postgres -f scripts/add-route-challenges.sql
```

Of via Supabase Dashboard → SQL Editor:
```sql
-- Kopieer inhoud van scripts/add-route-challenges.sql
```

### 2. Sanity Schema

Het schema is al bijgewerkt. Deploy naar Sanity:

```bash
cd sanity-studio
npm run deploy
```

### 3. TypeScript Types (Optioneel)

Regenereer types als nodig:

```bash
cd apps/web
npm run generate-types
```

## 📝 Gebruik in Sanity Studio

### Opdracht Toevoegen

1. Open een Rally Zone
2. Ga naar Route Tips
3. Bij een Location, scroll naar "Opdracht"
4. Vul in:
   - **Type**: Foto/Tekst/Multiple Choice/Getal
   - **Vraag**: De opdracht instructie
   - **Hint**: Optionele hint voor deelnemers
   - **Opties**: Voor multiple choice
   - **Correct Antwoord**: Voor automatische validatie (optioneel)
   - **Punten**: Hoeveel punten te verdienen
   - **Actief**: Schakel opdracht in/uit

### Voorbeelden

#### Foto Opdracht
```
Type: Foto Opdracht
Vraag: Maak een foto van het uitzicht vanaf deze locatie
Hint: Loop naar het uitkijkpunt voor het beste zicht
Punten: 5
```

#### Tekst Vraag (Auto-validatie)
```
Type: Tekst Vraag
Vraag: Wat staat er op de kerktoren?
Correct Antwoord: 1876
Punten: 10
```

#### Multiple Choice
```
Type: Multiple Choice
Vraag: In welk jaar werd dit gebouw gebouwd?
Opties: ["1850", "1876", "1902", "1923"]
Correct Antwoord: 1876
Punten: 8
```

## 🔍 Admin Validatie

### Handmatige Controle

Voor opdrachten zonder correct antwoord (vooral foto's):

```sql
-- Bekijk pending submissions
SELECT 
  rcs.*,
  p.name as participant_name,
  p.email
FROM route_challenge_submissions rcs
JOIN participants p ON p.id = rcs.participant_id
WHERE rcs.is_validated = FALSE
ORDER BY rcs.submitted_at DESC;

-- Valideer een submission
UPDATE route_challenge_submissions
SET 
  is_validated = TRUE,
  is_correct = TRUE,  -- of FALSE
  points_awarded = 5,  -- of 0
  validated_by = '[ADMIN_USER_ID]',
  validated_at = NOW(),
  admin_notes = 'Mooie foto!'
WHERE id = '[SUBMISSION_ID]';
```

### Via Code (TODO: Admin Panel)

Een admin interface kan gebouwd worden met:
- `/admin/challenges/pending` - Lijst van te valideren submissions
- Foto preview voor foto opdrachten
- Approve/Reject knoppen
- Punten aanpassen

## 📊 Statistieken

### Deelnemer Stats

```sql
SELECT * FROM get_participant_challenge_stats('[PARTICIPANT_ID]');
```

Geeft terug:
- `total_submitted`: Aantal ingediende opdrachten
- `total_validated`: Aantal gevalideerde opdrachten
- `total_correct`: Aantal correcte opdrachten
- `total_points_earned`: Totaal verdiende punten
- `completion_percentage`: Percentage correct

### Leaderboard

```sql
SELECT 
  p.name,
  p.email,
  COUNT(*) FILTER (WHERE rcs.is_correct = TRUE) as challenges_completed,
  SUM(rcs.points_awarded) as total_points
FROM route_challenge_submissions rcs
JOIN participants p ON p.id = rcs.participant_id
WHERE rcs.is_validated = TRUE
GROUP BY p.id, p.name, p.email
ORDER BY total_points DESC
LIMIT 20;
```

## 🎁 Rewards Integratie

### Gratis Drinken Voorbeeld

```sql
-- Deelnemers die ALLE challenges correct hebben
SELECT 
  p.name,
  p.email,
  COUNT(*) as completed_challenges,
  SUM(rcs.points_awarded) as total_points
FROM participants p
JOIN route_challenge_submissions rcs ON rcs.participant_id = p.id
WHERE rcs.is_correct = TRUE
GROUP BY p.id, p.name, p.email
HAVING COUNT(*) = (
  -- Totaal aantal actieve challenges
  SELECT COUNT(*) 
  FROM route_challenge_submissions 
  WHERE is_validated = TRUE
)
ORDER BY p.name;
```

### Achievement Integratie

Dit systeem kan gekoppeld worden aan het achievements systeem:

```sql
-- Add achievement
INSERT INTO achievements (
  name,
  title,
  description,
  icon,
  category,
  points,
  criteria
) VALUES (
  'challenge_master',
  'Challenge Master',
  'Voltooide alle route opdrachten',
  '🎯',
  'challenges',
  50,
  '{"type": "all_challenges_completed"}'
);
```

## 🔌 API Endpoints

### Submit Challenge
```typescript
POST /api/challenges/submit
Content-Type: multipart/form-data

{
  zoneId: string,
  locationKey: string,
  challengeType: 'photo' | 'text' | 'multiple_choice' | 'number',
  textAnswer?: string,
  photoUrl?: string,
  correctAnswer?: string,  // Voor auto-validatie
  points: number
}

Response:
{
  success: true,
  submission: {
    id: string,
    isValidated: boolean,
    isCorrect: boolean | null,
    pointsAwarded: number,
    needsManualValidation: boolean
  }
}
```

### Get My Submissions
```typescript
GET /api/challenges/my-submissions

Response:
{
  submissions: Array<ChallengeSubmission>,
  stats: {
    total_submitted: number,
    total_validated: number,
    total_correct: number,
    total_points_earned: number,
    completion_percentage: number
  }
}
```

### Upload Photo
```typescript
POST /api/upload-photo
Content-Type: multipart/form-data

{
  file: File,
  type: 'challenge'
}

Response:
{
  success: true,
  url: string,
  filename: string
}
```

## 🎨 UI Components

### ChallengeModal
Modal voor het voltooien van opdrachten:
- Toont opdracht details
- Input gebaseerd op type
- Photo upload met preview
- Success/error feedback
- Auto-validatie resultaat

### ZoneRouteTips (Updated)
- Toont opdrachten per route
- Challenge iconen en punten
- Completed state
- Click om modal te openen

## 🔒 Security

- RLS policies: Users kunnen alleen eigen submissions zien
- Photo upload: Max 5MB, alleen images
- Rate limiting: Via Supabase (optional)
- Admin-only validatie

## 📱 Mobile Considerations

- Photo upload werkt met camera op mobiel
- Responsive modal design
- Touch-friendly buttons
- Offline mode (TODO): Queue submissions

## 🚀 Future Enhancements

- [ ] Admin panel voor validatie
- [ ] Foto gallery per location
- [ ] Social sharing van voltooide challenges
- [ ] Time-based challenges
- [ ] Team challenges
- [ ] Achievement integratie
- [ ] Push notificaties bij validatie
- [ ] Offline support
- [ ] QR code scanning voor auto-checkin

## 📸 Gallery Feature

Foto's kunnen later in een gallery getoond worden:

```typescript
// Haal alle goedgekeurde foto's op per zone
SELECT 
  rcs.photo_url,
  rcs.zone_id,
  rcs.location_key,
  p.name as participant_name
FROM route_challenge_submissions rcs
JOIN participants p ON p.id = rcs.participant_id
WHERE 
  rcs.challenge_type = 'photo'
  AND rcs.is_validated = TRUE
  AND rcs.is_correct = TRUE
ORDER BY rcs.submitted_at DESC;
```

## 🐛 Troubleshooting

### Foto upload faalt
- Check Supabase Storage bucket "participant-photos" bestaat
- Check RLS policies op bucket
- Check file size < 5MB

### Auto-validatie werkt niet
- Check of `correctAnswer` is ingevuld in Sanity
- Antwoorden worden genormaliseerd (trim + lowercase)

### Submissions niet zichtbaar
- Check RLS policies
- Check participant_id is correct
- Check user is ingelogd

## 📄 Database Schema

```sql
route_challenge_submissions
├── id (uuid, PK)
├── participant_id (uuid, FK)
├── zone_id (text)
├── location_key (text)
├── challenge_type (enum)
├── text_answer (text)
├── photo_url (text)
├── submitted_at (timestamp)
├── is_correct (boolean)
├── is_validated (boolean)
├── validated_by (uuid)
├── validated_at (timestamp)
├── admin_notes (text)
└── points_awarded (integer)
```

## 💡 Tips

1. **Test eerst met weinig opdrachten** - Start met 2-3 opdrachten per zone
2. **Mix opdracht types** - Varieer tussen foto's en vragen
3. **Duidelijke instructies** - Schrijf heldere opdrachten
4. **Eerlijke punten** - Moeilijkere opdrachten = meer punten
5. **Validatie planning** - Reserveer tijd voor handmatige checks
6. **Communicatie** - Vertel deelnemers over de rewards!

---

**Status**: ✅ Geïmplementeerd en klaar voor gebruik
**Versie**: 1.0
**Datum**: 5 februari 2026
