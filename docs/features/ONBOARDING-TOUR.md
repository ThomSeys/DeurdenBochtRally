# Onboarding Tour / Rondleiding

Een geïntegreerde first-time user experience rondleiding die nieuwe gebruikers door de belangrijkste features van de app leidt.

## Technologie

- **Library**: [Driver.js](https://driverjs.com/) - Modern, lightweight (5KB), framework agnostic
- **Geen dependencies**: Driver.js heeft geen externe dependencies
- **TypeScript support**: Volledig getypeerd

## Features

### Automatische First-Time Tour
- Start automatisch wanneer een nieuwe gebruiker het dashboard bezoekt
- Gebruikt localStorage om bij te houden of de tour al is gezien
- Kan overgeslagen worden met de "close" knop

### Handmatige Tour
Gebruikers kunnen de tour opnieuw starten via:
- Desktop: User menu → "Rondleiding"
- Mobile: Hamburgermenu → "Rondleiding"

### Tour Highlights

De tour laat de volgende elementen zien:

1. **Welkom** - Introductie
2. **Profiel** - Persoonlijke info en rally stats
3. **QR Code** - Unieke check-in code
4. **Rally Zones** - Interactieve kaart
5. **Route Voorkeur** - Sport vs Adventure keuze
6. **Notificaties** - Push notification setup
7. **Fotogalerie** - Foto's delen en bekijken
8. **Ritverhalen** - Community verhalen
9. **Documenten** - Belangrijke bestanden
10. **Noodknop** - Emergency SOS functie

## Implementatie

### Component Structuur

```typescript
// OnboardingTour.tsx
<OnboardingTour />                  // Automatisch bij eerste bezoek
<OnboardingTour forceStart={true} /> // Forceer start

// Of handmatig via functie
startOnboardingTour()
```

### Data Attributen

Elk element in de tour heeft een `data-tour` attribuut:

```tsx
<div data-tour="profile-section">...</div>
<div data-tour="qr-code">...</div>
<div data-tour="rally-zones">...</div>
// etc.
```

### Styling

Custom styling in [app.css](../../apps/web/app/app.css):
- Dark theme met primary blue accenten
- Smooth animations en transitions
- Responsive ontwerp

```css
.ddb-tour-popover {
  --driver-popover-bg-color: #1e293b;
  --driver-popover-text-color: #f1f5f9;
  --driver-popover-border-color: #3b82f6;
}
```

## Gebruik voor Developers

### Nieuwe Tour Step Toevoegen

1. Voeg een `data-tour` attribuut toe aan het element:
```tsx
<div data-tour="nieuwe-feature">
  {/* Je content */}
</div>
```

2. Voeg een step toe in [OnboardingTour.tsx](../../apps/web/app/components/OnboardingTour.tsx):
```typescript
{
  element: '[data-tour="nieuwe-feature"]',
  popover: {
    title: '✨ Nieuwe Feature',
    description: 'Beschrijving van je nieuwe feature.',
    side: 'bottom',
    align: 'start',
  },
}
```

### Tour Reset (voor development)

```typescript
import { resetOnboardingTour } from '~/components/OnboardingTour';

// Reset in console
resetOnboardingTour();
```

## LocalStorage

De tour gebruikt deze localStorage key:
- `ddb-onboarding-completed`: 'true' wanneer tour is voltooid

## Browser Support

Driver.js werkt in alle moderne browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Toekomstige Verbeteringen

Mogelijke uitbreidingen:
- Contextual tours per feature (bijv. "Rally Zones Tour")
- Multi-step tours voor complexe features
- Analytics tracking (hoeveel gebruikers voltooien de tour?)
- A/B testing van verschillende tour flows
- Tooltips voor nieuwe features (feature announcements)
- Video's of animaties in tour steps

## Troubleshooting

### Tour start niet automatisch
- Check of localStorage item `ddb-onboarding-completed` niet op 'true' staat
- Reset via `localStorage.removeItem('ddb-onboarding-completed')`

### Element niet gevonden
- Zorg dat het `data-tour` attribuut exact overeenkomt
- Check of het element wel zichtbaar is op de pagina
- Sommige elementen zijn conditioneel (bijv. alleen voor adventure route)

### Styling issues
- Driver.js CSS wordt geïmporteerd in de component
- Custom styles in app.css kunnen overschreven worden

## Links

- [Driver.js Documentatie](https://driverjs.com/)
- [Driver.js GitHub](https://github.com/kamranahmedse/driver.js)
