import { useState } from 'react';
import { Form } from 'react-router';
import { Icon } from './Icon';

interface EmergencySOSButtonProps {
  participantId: number;
  participantName: string;
  participantPhone?: string;
}

export function EmergencySOSButton({
  participantId,
  participantName,
  participantPhone,
}: EmergencySOSButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
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
        setError('Unable to retrieve your location');
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
  };

  return (
    <>
      {/* Floating SOS Button */}
      <button
        type="button"
        onClick={handleSOSClick}
        disabled={isLocating}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        aria-label="Emergency SOS"
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
        <span className="sr-only">Emergency SOS</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirmation && location && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <Icon name="alert-triangle" className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Emergency SOS</h2>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                This will send an emergency alert to event administrators with your current location.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{participantName}</span>
                </div>
                {participantPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{participantPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Event administrators will be notified immediately and may contact you or send help to your location.
              </p>
            </div>

            <Form method="post" action="/api/emergency-sos">
              <input type="hidden" name="participantId" value={participantId} />
              <input type="hidden" name="latitude" value={location.lat} />
              <input type="hidden" name="longitude" value={location.lng} />
              <input type="hidden" name="participantName" value={participantName} />
              <input type="hidden" name="participantPhone" value={participantPhone || ''} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Send SOS
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-24 right-6 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-2">
            <Icon name="alert-circle" className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Location Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
