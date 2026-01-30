import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface EmergencySOSButtonProps {
  participantId?: number;
  participantName?: string;
  participantPhone?: string;
}

export function EmergencySOSButton({
  participantId,
  participantName,
  participantPhone,
}: EmergencySOSButtonProps = {}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleTrigger = () => {
      handleSOSClick();
    };

    window.addEventListener('trigger-emergency-sos', handleTrigger);
    return () => window.removeEventListener('trigger-emergency-sos', handleTrigger);
  }, []);

  const getCurrentLocation = () => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Locatiebepaling wordt niet ondersteund door je browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        setShowConfirmation(true);
      },
      (err) => {
        setError('Kan je locatie niet ophalen');
        setIsLocating(false);
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSOSClick = () => {
    getCurrentLocation();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setLocation(null);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!location) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/emergency-sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Kon noodoproep niet versturen');
      }

      setSuccess(true);
      setTimeout(() => {
        setShowConfirmation(false);
        setLocation(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending SOS:', err);
      setError('Kon noodoproep niet versturen. Probeer het opnieuw.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <button
        type="button"
        onClick={handleSOSClick}
        disabled={isLocating}
        className="fixed bottom-24 right-8 z-[1000] bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        aria-label="Nood SOS"
      >
        {isLocating ? (
          <Icon name="loader" className="w-8 h-8 animate-spin" />
        ) : (
          <div className="relative">
            <Icon name="alert-triangle" className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
        )}
        <span className="sr-only">Nood SOS</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirmation && location && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <Icon name="alert-triangle" className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Nood SOS</h2>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                Dit stuurt een noodmelding naar de organisatie met je huidige locatie.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Locatie:</span>
                  <span className="font-medium text-gray-900">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                De organisatie wordt onmiddellijk op de hoogte gebracht en kan contact met je opnemen of hulp naar je locatie sturen.
              </p>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded text-sm">
                  ✓ Noodoproep succesvol verstuurd!
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSending || success}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Icon name="loader" className="w-4 h-4 animate-spin" />
                    Versturen...
                  </>
                ) : success ? (
                  'Verstuurd!'
                ) : (
                  'Verstuur SOS'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-24 right-6 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-2">
            <Icon name="alert-circle" className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Locatiefout</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
