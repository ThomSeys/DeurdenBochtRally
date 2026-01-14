import { useState, useEffect } from 'react';
import { Link } from 'react-router';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
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
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleAcceptEssential = () => {
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
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 sm:p-6 shadow-2xl z-[1000] transition-all duration-300 ${isHiding ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">🍪 Cookieverklaring</h3>
            <p className="text-sm text-gray-200">
              We gebruiken cookies om uw ervaring te verbeteren. We gebruiken essentiële cookies voor authenticatie en functionaliteit. 
              <Link to="/cookie-policy" className="text-blue-400 hover:text-blue-300 ml-1 underline">
                Lees meer over onze cookieverklaring
              </Link>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleAcceptEssential}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-sm transition-colors text-sm font-medium"
            >
              Alleen essentieel
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm transition-colors text-sm font-medium"
            >
              Alles accepteren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
