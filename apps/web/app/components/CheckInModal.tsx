import { Form } from 'react-router';
import { Icon } from '~/components/Icon';
import MapView from '~/components/MapView';
import { useEffect, useState } from 'react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: {
    _id?: string;
    title: string;
    location?: string;
    startLocation?: {
      name?: string;
      description?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    start_location?: {
      name?: string;
      landmark_description?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  actionData?: {
    error?: string;
    success?: boolean;
    message?: string;
  };
  isSubmitting: boolean;
  action?: 'CHECKIN' | 'CHECKOUT';
  qrCode?: string;
}

export default function CheckInModal({
  isOpen,
  onClose,
  zone,
  actionData,
  isSubmitting,
  action = 'CHECKIN',
  qrCode,
}: CheckInModalProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's current location
  useEffect(() => {
    if (isOpen && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.log('[CheckInModal] Geolocation error:', error.message);
          setLocationError('Locatie kon niet worden opgehaald');
        }
      );
    }
  }, [isOpen]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  if (!isOpen) return null;

  // Support both Sanity zone structure and legacy structure
  const locationInfo = zone.startLocation || zone.start_location;
  const locationName = locationInfo?.name || zone.location;
  const locationDescription = zone.startLocation?.description || zone.start_location?.landmark_description;
  
  // Handle different coordinate structures:
  // 1. startLocation.coordinates.lat/lng (zone detail page)
  // 2. startLocation.lat/lng (rally page - direct coordinates)
  const coordinates = locationInfo?.coordinates || 
    (locationInfo?.lat && locationInfo?.lng ? { lat: locationInfo.lat, lng: locationInfo.lng } : null);

  // Calculate distance and check if user is nearby (within 500m)
  const distance = userLocation && coordinates 
    ? calculateDistance(userLocation.lat, userLocation.lng, coordinates.lat, coordinates.lng)
    : null;
  const isNearby = distance !== null && distance <= 0.5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white p-6 relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-white opacity-10 rounded-full"></div>
          {/* Modal Header */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tight mb-1">
                {action === 'CHECKIN' ? 'Check In' : 'Check Out'}
              </h3>
              <p className="text-white/90 text-lg font-semibold">{zone.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-sm"
            >
              <Icon name="x" className="w-7 h-7" />
            </button>
          </div>
        </div>
        
        <div className="p-6">

          {/* Location Info */}
          <div className="mb-6 p-5 bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-sm border-2 border-primary-200 shadow-sm">
            <h4 className="font-bold text-primary-900 mb-2 flex items-center gap-2 text-lg">
              <Icon name="map-pin" className="w-5 h-5 text-primary-600" />
              {action === 'CHECKIN' ? 'Check-in Locatie' : 'Check-out Locatie'}
            </h4>
            <p className="text-gray-900 font-semibold">{locationName}</p>
            {locationDescription && (
              <p className="text-sm text-gray-600 mt-1">{locationDescription}</p>
            )}
          </div>
          
          {/* Mini Map */}
          {coordinates && (
            <div className="mb-6">
              <MapView 
                startPoint={coordinates}
                className="h-[280px] rounded-sm border-2 border-primary-300 shadow-lg overflow-hidden"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-3 text-sm font-bold rounded-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <Icon name="external-link" className="w-4 h-4" />
                Open in Google Maps voor navigatie
              </a>
            </div>
          )}

          {/* Distance Check */}
          {distance !== null && (
            <div className={`mb-6 p-5 rounded-sm border-2 shadow-sm ${
              isNearby 
                ? 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-400' 
                : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400'
            }`}>
              <p className={`font-bold flex items-center gap-2 text-lg ${
                isNearby ? 'text-teal-900' : 'text-yellow-900'
              }`}>
                <Icon name={isNearby ? 'check-circle' : 'alert-circle'} className="w-6 h-6" />
                {isNearby ? 'Je bent in de buurt! ✓' : 'Je bent niet bij de check-in locatie'}
              </p>
              <p className={`text-sm mt-2 font-semibold ${
                isNearby ? 'text-teal-800' : 'text-yellow-800'
              }`}>
                📍 Afstand: {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </p>
              {!isNearby && (
                <p className="text-xs text-yellow-700 mt-3 bg-yellow-100 p-2 rounded-sm border border-yellow-300">
                  💡 Je moet binnen 500m van de locatie zijn om in te checken
                </p>
              )}
            </div>
          )}

          {locationError && (
            <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-sm border-2 border-red-300 shadow-sm">
              <p className="text-red-900 font-semibold flex items-center gap-2">
                <Icon name="alert-circle" className="w-5 h-5" />
                {locationError}
              </p>
            </div>
          )}

          {/* Error Message */}
          {actionData?.error && (
            <div className="mb-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-sm p-4 shadow-sm">
              <p className="text-red-900 font-semibold flex items-center gap-2">
                <Icon name="x-circle" className="w-5 h-5" />
                {actionData.error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {actionData?.success && (
            <div className="mb-6 bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-400 rounded-sm p-4 shadow-sm">
              <p className="text-teal-900 font-bold flex items-center gap-2">
                <Icon name="check-circle" className="w-5 h-5" />
                {actionData.message}
              </p>
            </div>
          )}

          {/* Check-in Form */}
          <Form method="post">
            {zone._id && <input type="hidden" name="zoneId" value={zone._id} />}
            {action && <input type="hidden" name="action" value={action} />}
            {qrCode && <input type="hidden" name="qrCode" value={qrCode} />}
            {userLocation && (
              <>
                <input type="hidden" name="latitude" value={userLocation.lat} />
                <input type="hidden" name="longitude" value={userLocation.lng} />
              </>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-sm transition-all border-2 border-gray-300 hover:border-gray-400 shadow-sm"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !userLocation || (action === 'CHECKIN' && !isNearby)}
                className={`flex-1 px-5 py-4 ${
                  action === 'CHECKIN'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
                } text-white font-black uppercase rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-sm`}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="w-5 h-5" />
                    {action === 'CHECKIN' ? 'Check In' : 'Check Out'}
                  </>
                )}
              </button>
            </div>
          </Form>

          {!userLocation ? (
            <p className="text-sm text-gray-600 mt-4 text-center font-semibold flex items-center justify-center gap-2">
              <Icon name="loader" className="w-4 h-4 animate-spin" />
              Locatie wordt opgehaald...
            </p>
          ) : action === 'CHECKIN' && !isNearby && (
            <p className="text-sm text-yellow-700 mt-4 text-center font-semibold flex items-center justify-center gap-2">
              <Icon name="alert-circle" className="w-4 h-4" />
              Je moet binnen 500m van de locatie zijn om in te checken
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
