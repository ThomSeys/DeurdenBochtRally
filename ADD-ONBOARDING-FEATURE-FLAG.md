# Onboarding Tour Feature Flag Toevoegen

De onboarding tour is nu geïmplementeerd en afhankelijk van een feature flag.

## Feature Flag Toevoegen in Sanity Studio

1. **Open Sanity Studio**: https://deurdbocht.sanity.studio (of draai lokaal)

2. **Navigeer naar "Feature Flags"**

3. **Klik op "Create" (+ knop)**

4. **Vul de volgende gegevens in:**
   - **Feature naam**: `Onboarding Tour`
   - **Key (technisch)**: `onboarding-tour-enabled`
   - **Ingeschakeld**: ✅ Aan (schakel deze aan)
   - **Beschrijving**: `Interactieve rondleiding voor nieuwe gebruikers op het dashboard. Toont de belangrijkste features en functionaliteit.`
   - **Categorie**: `Algemeen`

5. **Klik op "Publish"**

## ✅ Klaar!

De onboarding tour is nu actief en zal verschijnen voor nieuwe gebruikers op het dashboard.

## Feature Flag Uitschakelen

Om de tour uit te schakelen:
1. Open de "Onboarding Tour" feature flag in Sanity
2. Zet "Ingeschakeld" op **Uit**
3. Klik op "Publish"

## Technische Details

De feature flag wordt geladen in:
- `dashboard._index.tsx` - voor de automatische tour bij eerste bezoek
- `Header.tsx` - voor de "Rondleiding" knop in het menu

### Code Locaties:
- **Tour component**: `apps/web/app/components/OnboardingTour.tsx`
- **Styling**: `apps/web/app/app.css` (zoek naar "Driver.js")
- **Dashboard integratie**: `apps/web/app/routes/dashboard._index.tsx`
- **Header menu**: `apps/web/app/components/Header.tsx`

### Feature Flag Check:
```typescript
const onboardingTourEnabled = await isFeatureEnabled('onboarding-tour-enabled');
```

## Styling Aanpassingen

De tour styling is aangepast naar een clean, modern design:
- Witte achtergrond met subtiele border
- Teal accent kleur (#3798a8) voor buttons
- Geen blur effects op overlay
- Responsive en toegankelijk
