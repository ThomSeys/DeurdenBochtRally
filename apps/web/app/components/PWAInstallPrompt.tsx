import { useEffect, useState } from 'react';
import { Icon } from './Icon';

const PWA_INSTALL_DISMISSED_KEY = 'ddb-pwa-install-dismissed';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      
      // Only show if not previously dismissed
      const isDismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === 'true';
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] Installation accepted');
    } else {
      console.log('[PWA] Installation dismissed by user');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
  };

  const handleShowAgain = () => {
    localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
    setShowPrompt(true);
  };

  if (isInstalled) return null;

  if (showPrompt && deferredPrompt) {
    return (
      <div
        data-tour="pwa-install"
        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-sm shadow-lg p-6 mb-8 text-white"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Icon name="download" className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-1">Installeer de App</h3>
              <p className="text-sm text-blue-50">
                Installeer Deur Den Bocht op je smartphone voor snellere toegang en offline ondersteuning!
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              Installeer
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-blue-400 hover:bg-blue-600 font-semibold rounded-sm transition-colors whitespace-nowrap"
            >
              Niet Nu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Hook to re-show the prompt if needed
export function useShowPWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const showAgain = () => {
    localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
    setShowPrompt(true);
  };

  return { showAgain };
}
