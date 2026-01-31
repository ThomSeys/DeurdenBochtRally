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
