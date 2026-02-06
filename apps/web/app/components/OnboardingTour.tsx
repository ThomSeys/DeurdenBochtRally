import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingTourProps {
  /** Forceer de tour te starten, zelfs als deze al eerder is gezien */
  forceStart?: boolean;
  /** Callback wanneer de tour eindigt */
  onComplete?: () => void;
}

const TOUR_STORAGE_KEY = 'ddb-onboarding-completed';

export function OnboardingTour({ forceStart = false, onComplete }: OnboardingTourProps) {
  useEffect(() => {
    // Check of de tour al is gezien (tenzij forceStart true is)
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
    
    if (!forceStart && hasSeenTour === 'true') {
      return;
    }

    // Kleine delay zodat de pagina volledig geladen is
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        popoverClass: 'ddb-tour-popover',
        nextBtnText: 'Volgende',
        prevBtnText: 'Vorige',
        doneBtnText: 'Klaar!',
        progressText: '{{current}} van {{total}}',
        steps: [
          {
            element: 'body',
            popover: {
              title: 'Welkom bij Deur Den Bocht',
              description: 'Laat me je even rondleiden door de belangrijkste features van de app. Deze tour duurt ongeveer 1 minuut.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '[data-tour="profile-section"]',
            popover: {
              title: 'Jouw Profiel',
              description: 'Hier zie je je persoonlijke informatie en rally statistieken. Je kunt je profiel bewerken door op "Profiel bewerken" te klikken.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '[data-tour="qr-code"]',
            popover: {
              title: 'Jouw Persoonlijke QR Code',
              description: 'Dit is jouw unieke QR code. Toon deze aan checkpoints om in te checken of je paper roadbook op te halen.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '[data-tour="rally-zones"]',
            popover: {
              title: 'Rally Zones',
              description: 'Ontdek alle rally zones op de kaart. Elke zone heeft unieke kenmerken en verhalen die je kunt ontdekken tijdens je rit.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '[data-tour="route-preference"]',
            popover: {
              title: 'Route Voorkeur',
              description: 'Kies je route type: Sport voor snelle wegen of Adventure voor bochtige, pittoreske routes. Je kunt dit altijd later aanpassen.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '[data-tour="notifications"]',
            popover: {
              title: 'Notificaties',
              description: 'Activeer push notificaties om belangrijke updates te ontvangen over het evenement, rally zones en noodsituaties.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '[data-tour="gallery"]',
            popover: {
              title: 'Fotogalerie',
              description: 'Bekijk foto\'s van het evenement en deel je eigen rally ervaringen met de community.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '[data-tour="ride-stories"]',
            popover: {
              title: 'Ritverhalen',
              description: 'Deel jouw persoonlijke rally verhalen en lees die van andere deelnemers. Maak herinneringen voor het leven!',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '[data-tour="documents"]',
            popover: {
              title: 'Documenten',
              description: 'Vind alle belangrijke documenten zoals het reglement, routes, en praktische info.',
              side: 'top',
              align: 'start',
            },
          },
          {
            element: '[data-tour="emergency-button"]',
            popover: {
              title: 'Noodknop',
              description: 'In geval van nood kun je deze knop gebruiken om onmiddellijk hulp in te roepen. Druk 3 seconden lang om te activeren.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: 'body',
            popover: {
              title: 'Je bent klaar!',
              description: 'Je kent nu de belangrijkste features. Veel plezier met Deur Den Bocht! Je kunt deze tour altijd opnieuw starten via het help-icoon.',
              side: 'top',
              align: 'center',
            },
          },
        ],
        onDestroyed: () => {
          // Markeer de tour als voltooid
          if (!forceStart) {
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
          }
          onComplete?.();
        },
      });

      driverObj.drive();
    }, 500);

    return () => clearTimeout(timer);
  }, [forceStart, onComplete]);

  return null;
}

/** Start de onboarding tour handmatig */
export function startOnboardingTour() {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    popoverClass: 'ddb-tour-popover',
    nextBtnText: 'Volgende',
    prevBtnText: 'Vorige',
    doneBtnText: 'Klaar!',
    progressText: '{{current}} van {{total}}',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Welkom terug!',
          description: 'Laat me je opnieuw rondleiden door de belangrijkste features van de app.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="profile-section"]',
        popover: {
          title: 'Jouw Profiel',
          description: 'Hier zie je je persoonlijke informatie en rally statistieken.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="qr-code"]',
        popover: {
          title: 'Jouw Persoonlijke QR Code',
          description: 'Dit is jouw unieke QR code. Toon deze aan checkpoints om in te checken.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '[data-tour="rally-zones"]',
        popover: {
          title: 'Rally Zones',
          description: 'Ontdek alle rally zones op de kaart.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="route-preference"]',
        popover: {
          title: 'Route Voorkeur',
          description: 'Kies je route type: Sport of Adventure.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="notifications"]',
        popover: {
          title: 'Notificaties',
          description: 'Activeer push notificaties voor belangrijke updates.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="gallery"]',
        popover: {
          title: 'Fotogalerie',
          description: 'Bekijk en deel foto\'s van het evenement.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="ride-stories"]',
        popover: {
          title: 'Ritverhalen',
          description: 'Deel jouw rally verhalen met de community.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="documents"]',
        popover: {
          title: 'Documenten',
          description: 'Vind alle belangrijke documenten hier.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="emergency-button"]',
        popover: {
          title: 'Noodknop',
          description: 'Voor noodsituaties. Druk 3 seconden lang om te activeren.',
          side: 'left',
          align: 'center',
        },
      },
    ],
  });

  driverObj.drive();
}

/** Reset de onboarding status (voor testing) */
export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}

/** Start de Rally pagina tour - Zones, check-ins, en route tips */
export function startRallyTour() {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    popoverClass: 'ddb-tour-popover',
    nextBtnText: 'Volgende',
    prevBtnText: 'Vorige',
    doneBtnText: 'Klaar!',
    progressText: '{{current}} van {{total}}',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Rally Route Rondleiding',
          description: 'Laat me je uitleggen hoe je rally zones kunt verkennen, inchecken en route tips kunt bekijken.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="rally-how-it-works"]',
        popover: {
          title: 'Hoe werkt het?',
          description: 'Hier zie je een overzicht van hoe de rally werkt: kies je avontuur, download routes, check in bij zones, doe challenges en deel je verhaal.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="rally-checkin-info"]',
        popover: {
          title: 'Check-in Uitleg',
          description: 'Check-ins zijn optioneel! Je kunt QR codes scannen bij zones om je reis te tracken, maar het is geen verplichting.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="rally-segments"]',
        popover: {
          title: 'Rally Segmenten',
          description: 'Hier zie je alle beschikbare rally zones. Elk segment heeft zijn eigen karakter, route tips en challenges.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="rally-tips"]',
        popover: {
          title: 'Route Tips',
          description: 'Elk segment heeft route tips die je interessante plaatsen tonen. Klik op de kaart om tips te bekijken met beschrijvingen en foto\'s.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="rally-checkin-button"]',
        popover: {
          title: 'Check In Button',
          description: 'Klik hier om in te checken bij een zone. Dit opent een QR scanner of handmatige check-in optie.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Klaar voor de Rally!',
          description: 'Je weet nu hoe je zones kunt verkennen en inchecken. Veel plezier onderweg!',
          side: 'top',
          align: 'center',
        },
      },
    ],
  });

  driverObj.drive();
}

/** Start de Zone detail pagina tour - Check-in proces en locatie info */
export function startZoneTour() {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    popoverClass: 'ddb-tour-popover',
    nextBtnText: 'Volgende',
    prevBtnText: 'Vorige',
    doneBtnText: 'Klaar!',
    progressText: '{{current}} van {{total}}',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Zone Detail Rondleiding',
          description: 'Laat me je uitleggen hoe je kunt inchecken bij deze rally zone.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="zone-locations"]',
        popover: {
          title: 'Check-in & Check-out Locaties',
          description: 'Hier zie je waar je moet inchecken (start) en uitchecken (eind). Elke locatie heeft een duidelijke beschrijving.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="zone-checkin-form"]',
        popover: {
          title: 'Check-in Formulier',
          description: 'Dit is waar je incheckt bij de zone. Normaal scan je een QR code op locatie, maar je kunt ook handmatig inchecken.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="zone-checkin-button"]',
        popover: {
          title: 'Check In Knop',
          description: 'Klik op deze knop om je check-in te bevestigen. Je locatie wordt automatisch opgeslagen als bewijs.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Klaar!',
          description: 'Je weet nu hoe je incheckt bij een zone. Na check-in krijg je toegang tot challenges en verdien je punten!',
          side: 'top',
          align: 'center',
        },
      },
    ],
  });

  driverObj.drive();
}

/** Start de Live Map pagina tour - Event markers toevoegen */
export function startLiveMapTour() {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    popoverClass: 'ddb-tour-popover',
    nextBtnText: 'Volgende',
    prevBtnText: 'Vorige',
    doneBtnText: 'Klaar!',
    progressText: '{{current}} van {{total}}',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Live Kaart Rondleiding',
          description: 'Laat me je uitleggen hoe je de live kaart gebruikt en event markers kunt toevoegen.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="event-marker-button"]',
        popover: {
          title: 'Event Marker Toevoegen',
          description: 'Klik op deze knop om een event marker toe te voegen. Dit kan bijvoorbeeld een waarschuwing zijn voor een wegafzetting, ongeluk, overstroming of andere situatie die andere deelnemers moeten weten.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Help Anderen!',
          description: 'Door event markers te delen help je andere deelnemers op de hoogte te blijven van situaties onderweg. Bedankt!',
          side: 'top',
          align: 'center',
        },
      },
    ],
  });

  driverObj.drive();
}
