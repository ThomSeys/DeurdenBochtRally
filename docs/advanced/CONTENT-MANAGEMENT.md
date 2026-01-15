# Content Management Handleiding

## 📋 Overzicht

Deze site heeft een **eenvoudig bestandsgebaseerd content systeem**. Alle content kan je beheren door gewoon bestanden te bewerken - geen database nodig!

## 📁 Content Bestanden

### 1. **Sponsors** (`apps/web/app/content/sponsors.ts`)

Hier beheer je alle sponsors:

```typescript
{
  id: 1,
  name: 'Sponsor Naam',
  logo: '/images/sponsors/logo.png', // of externe URL
  website: 'https://sponsor-website.be',
}
```

**Hoe te wijzigen:**
- Open het bestand
- Voeg nieuwe sponsors toe aan de array
- Verwijder sponsors door hun object te verwijderen
- Upload sponsor logo's naar `apps/web/public/images/sponsors/`

### 2. **Site Configuratie** (`apps/web/app/content/config.ts`)

Hier staan alle teksten en instellingen:

- **Event info**: datum, locatie, naam
- **Stats**: cijfers in de stats sectie
- **Prijzen**: formules en prijzen
- **Contact**: email, telefoon, etc.

**Hoe te wijzigen:**
- Open het bestand
- Pas de waarden aan
- Sla op - wijzigingen zijn direct zichtbaar

### 3. **Rally Zones** (`apps/web/app/routes/rally.tsx`)

Rally zone informatie staat in het `rallyZones` array in het bestand.

## 🖼️ Afbeeldingen Beheren

### Sponsors Logos
1. Plaats logo's in: `apps/web/public/images/sponsors/`
2. Update het pad in `sponsors.ts`:
   ```typescript
   logo: '/images/sponsors/sponsor-naam.png'
   ```

### Hero & Sectie Afbeeldingen
1. Plaats afbeeldingen in: `apps/web/public/images/`
2. Update de src in de componenten:
   ```tsx
   src="/images/hero-background.jpg"
   ```

**Aanbevolen formaten:**
- Hero: 1920x1080px (landscape)
- Sponsor logos: 200x80px (landscape, transparante achtergrond)
- Sectie afbeeldingen: 800x600px

## 🎨 Kleuren & Stijl Aanpassen

### Brand Kleuren
In `apps/web/tailwind.config.ts`:

```typescript
primary: {
  600: '#2f7184', // Hoofd teal kleur
  // ... andere tinten
}
```

### CSS Classes
In `apps/web/app/styles/global.css`:
- `.btn-primary` - Primaire knoppen
- `.section-title` - Grote titels
- `.card` - Kaart stijl

## 🚀 Geavanceerde Opties

### Optie 1: Blijf bij bestanden (Aanbevolen voor nu)
✅ Eenvoudig
✅ Geen extra kosten
✅ Volledige controle
❌ Moet code bewerken voor wijzigingen

### Optie 2: Headless CMS (Later)
**Sanity.io** of **Contentful**:
- ✅ Vriendelijke admin interface
- ✅ Niet-technische mensen kunnen content wijzigen
- ✅ Image management
- ❌ Extra setup vereist
- ❌ Kleine maandelijkse kost mogelijk

### Optie 3: Supabase Content Tables
Gebruik je bestaande Supabase database:
- ✅ Al inbegrepen
- ✅ Gratis
- ✅ SQL admin interface
- ❌ Minder gebruiksvriendelijk

## 📝 Quick Edit Checklist

### Sponsor toevoegen:
1. ✅ Upload logo naar `public/images/sponsors/`
2. ✅ Voeg toe aan `content/sponsors.ts`
3. ✅ Test de website

### Prijs wijzigen:
1. ✅ Open `content/config.ts`
2. ✅ Wijzig `pricing.withMeals.price` of `pricing.breakfastOnly.price`
3. ✅ Sla op

### Datum wijzigen:
1. ✅ Open `content/config.ts`
2. ✅ Wijzig `event.date` en `event.dateFormatted`
3. ✅ Update ook `EVENT_DATE` in `.env.local`

## 💡 Tips

- Maak altijd een backup voor grote wijzigingen
- Test wijzigingen lokaal met `npm run dev`
- Commit changes naar git voor versiebeheer
- Upload grote afbeeldingen eerst door tools als TinyPNG

## 🆘 Hulp Nodig?

- Technische vragen → Check TROUBLESHOOTING.md
- Content vragen → Bewerk de `.ts` bestanden
- Design wijzigingen → Pas Tailwind classes aan
