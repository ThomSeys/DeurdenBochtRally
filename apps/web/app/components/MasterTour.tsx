import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

type TourStep = {
  page: string;
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  action?: () => void | Promise<void>;
};

const TOUR_STORAGE_KEY = 'ddb-master-tour-active';
const TOUR_STEP_KEY = 'ddb-master-tour-step';
const TOUR_MODE_KEY = 'ddb-master-tour-mode'; // 'full' or 'page'
const TOUR_START_PAGE_KEY = 'ddb-master-tour-start-page'; // where page tour started
const TOUR_COMPLETED_KEY = 'ddb-master-tour-completed'; // has user seen tour before?

const tourSteps: TourStep[] = [
  // Dashboard
  {
    page: '/dashboard',
    element: 'body',
    title: 'Welkom bij Deur Den Bocht',
    description: 'Laat me je rondleiden door alle features van de app. Deze tour duurt ongeveer 3 minuten en gaat over meerdere pagina\'s.',
    side: 'top',
    align: 'center',
  },
  {
    page: '/dashboard',
    element: '[data-tour="pwa-install"]',
    title: 'Installeer de App',
    description: 'Je kunt deze app op je smartphone installeren! Dat geeft je snellere toegang en offline ondersteuning. Klik op "Installeer" als je het nu wilt doen.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="notifications"]',
    title: 'Schakel Meldingen In',
    description: 'Krijg notificaties over rally updates, zone check-ins, en buddy activiteiten. Super handig om alles lopende te houden!',
    side: 'bottom',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="profile-section"]',
    title: 'Jouw Profiel',
    description: 'Hier zie je je persoonlijke informatie en rally statistieken.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="qr-code"]',
    title: 'Jouw QR Code',
    description: 'Dit is je unieke QR code. Toon deze aan checkpoints om in te checken bij zones.',
    side: 'left',
    align: 'center',
  },
  {
    page: '/dashboard',
    element: '[data-tour="rally-zones"]',
    title: 'Rally Zones',
    description: 'Hier zie je een overzicht van alle 4 rally zones die je kunt bezoeken.',
    side: 'top',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="gallery"]',
    title: 'Fotogalerij',
    description: 'Deel je eigen rally foto\'s en bekijk momenten van andere deelnemers!',
    side: 'top',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="ride-stories"]',
    title: 'Ride Stories',
    description: 'Schrijf en lees verhalen over de rally ervaringen van iedereen!',
    side: 'top',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="achievements"]',
    title: 'Achievements',
    description: 'Ontgrendel toffe badges door zones te bezoeken en challenges te voltooien!',
    side: 'top',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="my-profile"]',
    title: 'Mijn Profiel',
    description: 'Bewerk je persoonlijke gegevens, motorinformatie en route voorkeuren hier.',
    side: 'top',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="emergency-contacts"]',
    title: 'Noodcontacten',
    description: 'Voeg noodcontacten toe voor als er wat gebeurt tijdens het event. Super belangrijk!',
    side: 'top',
    align: 'start',
  },
  {
    page: '/dashboard',
    element: '[data-tour="my-checklist"]',
    title: 'Mijn Checklist',
    description: 'Een persoonlijke checklist om je voor te bereiden op de rally. Zorg dat je alles hebt!',
    side: 'top',
    align: 'start',
  },
  // Rally Page
  {
    page: '/rally',
    element: '[data-tour="rally-how-it-works"]',
    title: 'Hoe Werkt de Rally?',
    description: 'De rally bestaat uit 8 segmenten met verschillende route tips. Je kunt ze in je eigen tempo verkennen.',
    side: 'top',
    align: 'start',
  },
  {
    page: '/rally',
    element: '[data-tour="rally-segments"]',
    title: 'Rally Segmenten',
    description: 'Elk segment heeft zijn eigen karakter en moeilijkheidsgraad. Klik erop om details en route tips te zien.',
    side: 'top',
    align: 'start',
  },
  {
    page: '/rally',
    element: '[data-tour="rally-tips"]',
    title: 'Route Tips',
    description: 'Elk segment heeft interessante route tips - panoramische uitzichten, technische passages, et cetera. Klik op de kaart om ze te bekijken.',
    side: 'top',
    align: 'start',
  },
  {
    page: '/rally',
    element: '[data-tour="rally-checkin-button"]',
    title: 'Check In bij Zones',
    description: 'Klik hier om in te checken wanneer je een zone bereikt. Dit toont je locatie en voltooit challenges.',
    side: 'top',
    align: 'center',
  },
  // Riding Buddies Page
  {
    page: '/dashboard/riding-buddies',
    element: 'body',
    title: 'Naftgenoten',
    description: 'Hier kun je je ritgenoten vinden en beheren. Stuur uitnodigingen en volg je naftgenoten!',
    side: 'top',
    align: 'center',
  },
  {
    page: '/dashboard/riding-buddies',
    element: '[data-tour="add-buddy-button"]',
    title: 'Ritgenoot Toevoegen',
    description: 'Klik hier om een andere deelnemer als ritgenoot toe te voegen. Dan kunnen jullie elkaar volgen op de kaart!',
    side: 'top',
    align: 'center',
  },
  // Live Map Page
  {
    page: '/live-map',
    element: 'body',
    title: 'Live Kaart & Meldingen',
    description: 'Op de live kaart zie je realtime info over rally zones, event markers, en buddy locations. Je kunt ook zelf een meldingen toevoegen.',
    side: 'top',
    align: 'center',
  },
  {
    page: '/live-map',
    element: '[data-tour="event-marker-button"]',
    title: 'Event Marker Toevoegen',
    description: 'Klik op deze knop om een melding toe te voegen - bijvoorbeeld voor een wegafzetting, ongeluk, of waarschuwing. Dit helpt andere deelnemers!',
    side: 'left',
    align: 'center',
  },
  // Final step
  {
    page: '/dashboard',
    element: 'body',
    title: 'Je bent klaar!',
    description: 'Je kent nu alle features van de app. Veel plezier op de rally 🏍️ Klik op het help-icoon om deze tour opnieuw te starten.',
    side: 'top',
    align: 'center',
  },
];

function getTourStepsForPage(pathname: string): TourStep[] {
  return tourSteps.filter(step => {
    // Exact match
    if (step.page === pathname) return true;
    // Zone page - matches /zone/xxx
    if (step.page === '/zone' && pathname.startsWith('/zone/')) return true;
    return false;
  });
}

export function useMasterTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const active = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    const step = parseInt(localStorage.getItem(TOUR_STEP_KEY) || '0', 10);

    if (active) {
      setIsActive(true);
      setCurrentStep(step);
    }
  }, []);

  const startFullTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    localStorage.setItem(TOUR_STEP_KEY, '0');
    localStorage.setItem(TOUR_MODE_KEY, 'full');
    setIsActive(true);
    setCurrentStep(0);
    navigate('/dashboard');
  };

  const startPageTour = (pageRoute: string) => {
    // Find the first step for this page
    const pageSteps = tourSteps.filter(step => {
      if (step.page === pageRoute) return true;
      if (pageRoute.startsWith('/zone') && step.page === '/zone') return true;
      return false;
    });

    if (pageSteps.length === 0) return;

    const firstStepIndex = tourSteps.indexOf(pageSteps[0]);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    localStorage.setItem(TOUR_STEP_KEY, firstStepIndex.toString());
    localStorage.setItem(TOUR_MODE_KEY, 'page');
    localStorage.setItem(TOUR_START_PAGE_KEY, pageRoute);
    setIsActive(true);
    setCurrentStep(firstStepIndex);
  };

  const continueTour = () => {
    if (!isActive) return;

    const mode = localStorage.getItem(TOUR_MODE_KEY) || 'full';
    const startPage = localStorage.getItem(TOUR_START_PAGE_KEY);
    const currentPageSteps = getTourStepsForPage(location.pathname);
    const nextStepGlobal = currentStep + 1;

    // If page tour mode and we've finished all steps on this page, end the tour
    if (mode === 'page' && nextStepGlobal >= tourSteps.length) {
      endTour();
      return;
    }

    if (nextStepGlobal >= tourSteps.length) {
      // Full tour complete
      endTour();
      return;
    }

    const nextStep = tourSteps[nextStepGlobal];

    // Need to navigate to next page
    if (nextStep.page !== location.pathname && !location.pathname.startsWith(nextStep.page.replace(/\/:\w+/, ''))) {
      // In page mode, check if we're moving away from start page
      if (mode === 'page' && nextStep.page !== startPage) {
        endTour();
        return;
      }

      localStorage.setItem(TOUR_STEP_KEY, nextStepGlobal.toString());
      setCurrentStep(nextStepGlobal); // Update state BEFORE navigating
      
      // Navigate to the next page
      if (nextStep.page === '/zone' && nextStepGlobal === 9) {
        navigate('/zone/zone-1');
      } else {
        navigate(nextStep.page);
      }
      return;
    }

    localStorage.setItem(TOUR_STEP_KEY, nextStepGlobal.toString());
    setCurrentStep(nextStepGlobal);
  };

  const endTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(TOUR_STEP_KEY);
    localStorage.removeItem(TOUR_MODE_KEY);
    localStorage.removeItem(TOUR_START_PAGE_KEY);
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true'); // Mark as completed
    setIsActive(false);
  };

  return {
    isActive,
    currentStep,
    startFullTour,
    startPageTour,
    continueTour,
    endTour,
  };
}

export function MasterTourDisplay() {
  const { isActive, currentStep, continueTour, endTour, startFullTour } = useMasterTour();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-start tour for new users on dashboard
  useEffect(() => {
    if (isInitialized || isActive) return;
    
    setIsInitialized(true);
    
    const hasCompletedTour = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    const isTourActive = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    
    // If on dashboard and user hasn't seen tour and tour isn't active, start it
    if (location.pathname === '/dashboard' && !hasCompletedTour && !isTourActive) {
      console.log('[tour] Auto-starting master tour for new user');
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      localStorage.setItem(TOUR_STEP_KEY, '0');
      localStorage.setItem(TOUR_MODE_KEY, 'full');
    }
  }, [isInitialized, isActive, location.pathname]);

  useEffect(() => {
    if (!isActive) return;

    const currentPageSteps = getTourStepsForPage(location.pathname);
    if (currentPageSteps.length === 0) {
      // Current page has no steps, navigate to next
      continueTour();
      return;
    }

    const step = tourSteps[currentStep];
    if (!step) {
      endTour();
      return;
    }

    // Check if this step is for current page
    if (step.page !== location.pathname && !location.pathname.startsWith(step.page.replace(/\/:\w+/, ''))) {
      return; // Wait for navigation
    }

    // Small delay for page to fully load
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        popoverClass: 'ddb-tour-popover',
        nextBtnText: 'Volgende',
        prevBtnText: 'Vorige',
        doneBtnText: currentStep === tourSteps.length - 1 ? 'Klaar!' : 'Volgende',
        progressText: `${currentStep + 1} van ${tourSteps.length}`,
        steps: [
          {
            element: step.element,
            popover: {
              title: step.title,
              description: step.description,
              side: step.side || 'top',
              align: step.align || 'center',
            },
          },
        ],
        onNextClick: () => {
          driverObj.destroy();
          continueTour();
        },
        onPrevClick: () => {
          driverObj.destroy();
          // Go to previous step
          const prevStep = currentStep - 1;
          if (prevStep >= 0) {
            localStorage.setItem('ddb-master-tour-step', prevStep.toString());
            window.location.reload(); // Reload to restart tour
          }
        },
        onDestroyed: () => {
          // Mark as completed when user closes tour
          const isNaturalEnd = currentStep === tourSteps.length - 1;
          if (isNaturalEnd) {
            localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
          }
        },
      });

      driverObj.drive();
    }, 100); // Reduced from 300ms for faster response

    return () => clearTimeout(timer);
  }, [isActive, currentStep, location.pathname, continueTour, endTour]);

  return null;
}

export function startMasterTour() {
  localStorage.removeItem(TOUR_COMPLETED_KEY); // Allow re-running the tour
  localStorage.setItem('ddb-master-tour-active', 'true');
  localStorage.setItem('ddb-master-tour-step', '0');
  localStorage.setItem('ddb-master-tour-mode', 'full');
  
  // Navigate to dashboard where tour starts
  window.location.href = '/dashboard';
}
