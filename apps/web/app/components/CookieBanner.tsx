import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useHaptics } from '~/lib/haptics';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const { tap, success } = useHaptics();

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    tap();
    localStorage.setItem('cookie-consent', JSON.stringify({
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    }));
    // Trigger storage event for other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cookie-consent',
      newValue: JSON.stringify({
        analytics: true,
        functional: true,
        timestamp: new Date().toISOString(),
      }),
    }));
    setIsHiding(true);
    success();
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleAcceptEssential = () => {
    tap();
    localStorage.setItem('cookie-consent', JSON.stringify({
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    }));
    // Trigger storage event for other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cookie-consent',
      newValue: JSON.stringify({
        analytics: false,
        functional: false,
        timestamp: new Date().toISOString(),
      }),
    }));
    setIsHiding(true);
    success();
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t-4 border-accent-500 p-4 sm:p-6 shadow-2xl z-[1000] transition-all duration-300 ${isHiding ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              🍪 Cookies & Privacy
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              We gebruiken cookies om je ervaring te verbeteren. Essentiële cookies zijn nodig voor authenticatie en functionaliteit. 
              <Link to="/cookie-policy" className="text-primary-600 hover:text-primary-700 ml-1 font-medium underline">
                Lees meer over cookies
              </Link>
              {' '}en ons{' '}
              <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-700 font-medium underline">
                privacybeleid
              </Link>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleAcceptEssential}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-sm transition-colors font-bold uppercase tracking-wide"
            >
              Alleen essentieel
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-sm transition-colors font-bold uppercase tracking-wide shadow-lg"
            >
              Alles accepteren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
