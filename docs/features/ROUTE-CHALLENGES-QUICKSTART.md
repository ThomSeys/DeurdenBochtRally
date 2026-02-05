# 🚀 Route Challenges - Quick Start

## Direct Testen (5 minuten)

### 1️⃣ Database Setup (VERPLICHT)

Voer de SQL migratie uit in Supabase:

```bash
# Optie A: Via command line
supabase db push

# Optie B: Via Supabase Dashboard
# 1. Ga naar https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql
# 2. Open scripts/add-route-challenges.sql
# 3. Kopieer en plak de inhoud
# 4. Klik "Run"
```

### 2️⃣ Testdata Toevoegen

Run het script om challenges toe te voegen:

```bash
cd scripts/sanity
npx tsx add-test-challenges.ts
```

Dit voegt 5 test challenges toe:
- 📸 **Paterberg**: Foto opdracht (10 punten)
- ✍️ **Oudenaarde Stadhuis**: Jaartal vraag (8 punten) - auto-validate
- ☑️ **Kluisberg**: Multiple choice hoogte (6 punten) - auto-validate
- 📸 **Condroz**: Landschap foto (8 punten)
- ✍️ **Durbuy**: Inwoners vraag (5 punten)

### 3️⃣ Test op Website

```bash
# Start dev server als die nog niet loopt
npm run dev

# Open browser
open http://localhost:5173/rally
```

**Wat te testen:**
1. Scroll naar een zone (bijv. Vlaamse Ardennen)
2. Open een route tip
3. Zie "Opdrachten op deze route" sectie onderaan
4. Klik op een challenge
5. Vul in en submit!

### 4️⃣ Check Submissions

In Supabase SQL Editor:

```sql
-- Bekijk alle submissions
SELECT 
  p.name,
  rcs.zone_id,
  rcs.challenge_type,
  rcs.is_correct,
  rcs.points_awarded,
  rcs.submitted_at
FROM route_challenge_submissions rcs
JOIN participants p ON p.id = rcs.participant_id
ORDER BY rcs.submitted_at DESC;
```

## 🎨 Eigen Challenges Toevoegen (via Sanity Studio)

### Stap 1: Open Sanity Studio

```bash
cd sanity-studio
npm run dev
```

Of ga naar: https://deur-den-bocht.sanity.studio

### Stap 2: Navigeer naar een Rally Zone

1. Klik op "Rally Zone" in het menu
2. Selecteer een zone (bijv. "Hoge Venen")
3. Scroll naar "Route Tips"
4. Open een route tip

### Stap 3: Voeg Challenge toe aan een Location

1. Scroll naar "Route Punten" (locations)
2. Klik op een punt of voeg nieuwe toe
3. Scroll naar "Opdracht" sectie
4. Klik "Add item"

**Vul in:**
- **Type Opdracht**: Foto/Tekst/Multiple Choice/Getal
- **Vraag/Instructie**: Wat moet de deelnemer doen?
- **Hint**: Optionele tip (verschijnt in modal)
- **Antwoord Opties**: Voor multiple choice
- **Correct Antwoord**: Voor automatische validatie (optioneel!)
- **Punten**: Hoeveel punten te verdienen
- **Actief**: ✅ aan voor live challenges

### Stap 4: Publish

Klik "Publish" rechtsonder in Sanity Studio.

## 📊 Admin: Handmatige Validatie

Voor foto's en vragen zonder correct antwoord:

```sql
-- Zie pending submissions
SELECT 
  rcs.id,
  p.name,
  rcs.challenge_type,
  rcs.text_answer,
  rcs.photo_url,
  rcs.submitted_at
FROM route_challenge_submissions rcs
JOIN participants p ON p.id = rcs.participant_id
WHERE rcs.is_validated = FALSE
ORDER BY rcs.submitted_at;

-- Valideer een submission (goedkeuren)
UPDATE route_challenge_submissions
SET 
  is_validated = TRUE,
  is_correct = TRUE,
  points_awarded = 10,  -- Pas aan naar gewenste punten
  validated_at = NOW(),
  admin_notes = 'Mooie foto!'
WHERE id = '[SUBMISSION_ID_HIER]';

-- Valideer een submission (afkeuren)
UPDATE route_challenge_submissions
SET 
  is_validated = TRUE,
  is_correct = FALSE,
  points_awarded = 0,
  validated_at = NOW(),
  admin_notes = 'Foto niet duidelijk genoeg'
WHERE id = '[SUBMISSION_ID_HIER]';
```

## 🎁 Rewards Setup

### Gratis Drinken voor Alle Challenges

Query om winnaars te vinden:

```sql
-- Deelnemers die alles correct hebben
SELECT 
  p.name,
  p.email,
  COUNT(*) as challenges_completed,
  SUM(rcs.points_awarded) as total_points
FROM participants p
JOIN route_challenge_submissions rcs ON rcs.participant_id = p.id
WHERE rcs.is_correct = TRUE
GROUP BY p.id, p.name, p.email
HAVING COUNT(*) >= 5  -- Pas aan naar totaal aantal challenges
ORDER BY p.name;
```

Print deze lijst uit op de rally dag!

## 🔧 Troubleshooting

### "Challenge already submitted" error
Je hebt deze challenge al ingestuurd. Elke challenge kan maar 1x per participant.

### Foto upload faalt
- Check bestandsgrootte < 5MB
- Check Supabase Storage bucket "participant-photos" bestaat
- Check RLS policies op bucket

### Challenges niet zichtbaar op website
- Check of `isActive` = true in Sanity
- Check of je de zone hebt gepublisheid
- Hard refresh browser (Cmd+Shift+R)

### Auto-validatie werkt niet
- Check of `correctAnswer` field is ingevuld in Sanity
- Antwoorden worden vergeleken zonder hoofdletters en spaties
- Voor getallen: "400" matcht met "400" (text)

## 📱 Pro Tips

1. **Start klein**: Begin met 1-2 challenges per zone
2. **Mix types**: Afwisseling houdt het leuk
3. **Test zelf**: Doe de challenge voordat je 'm live zet
4. **Duidelijke vragen**: Vermijd verwarring
5. **Eerlijke punten**: Moeilijker = meer punten
6. **Hint toevoegen**: Helpt zonder direct antwoord te geven
7. **Communiceer**: Vertel deelnemers over de rewards!

## 🎯 Snelle Check: Werkt het?

✅ Database tabel bestaat → Run `SELECT * FROM route_challenge_submissions LIMIT 1;`
✅ Challenges in Sanity → Open Studio, check een zone
✅ Challenges zichtbaar → Open /rally, zie je opdrachten?
✅ Submit werkt → Test met een challenge, check database
✅ Auto-validate werkt → Test met tekst vraag die correct antwoord heeft

## 📞 Need Help?

Check:
- [Volledige documentatie](./ROUTE-CHALLENGES.md)
- Sanity Studio preview
- Browser console voor errors
- Supabase logs

---

**Geschatte tijd om te starten: 5 minuten** ⏱️
**Eerste test challenge: 2 minuten** 🎯
**Eigen challenges maken: 5 minuten per challenge** ✨

Succes! 🏍️💨
