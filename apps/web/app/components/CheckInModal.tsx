import { Form } from 'react-router';
import { Icon } from '~/components/Icon';
import CSRFInput from '~/components/CSRFInput';
import MapView from '~/components/MapView';
import { useEffect, useState, useMemo } from 'react';
import { useHaptics } from '~/lib/haptics';

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
        lat: number;
        lng: number;
    };
    start_location?: {
      name?: string;
      landmark_description?: string;
      lat: number;
      lng: number;
    };
    skipRoute?: {
      instructions?: string;
      gpxFile?: { asset?: { url?: string } };
      startPoint?: { lat?: number; lng?: number };
      endPoint?: { lat?: number; lng?: number };
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
  csrfToken: string;
  buddies?: Array<{ buddy_id: string; buddy: { id: string; first_name: string; last_name: string } }>;
  buddyCheckins?: Record<string, string[]>;
}

export default function CheckInModal({
  isOpen,
  onClose,
  zone,
  actionData,
  isSubmitting,
  action = 'CHECKIN',
  qrCode,
  csrfToken,
  buddies,
  buddyCheckins
}: CheckInModalProps) {
  const [selectedBuddies, setSelectedBuddies] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { tap, success: hapticSuccess, error: hapticError } = useHaptics();

  // Haptic feedback on action result
  useEffect(() => {
    if (actionData?.success) hapticSuccess();
    else if (actionData?.error) hapticError();
  }, [actionData]);

  // Deduplicate buddies by `buddy_id` and expose a stable list
  const uniqueBuddies = useMemo(() => {
    if (!buddies || buddies.length === 0) return [];
    const m = new Map<string, any>();
    for (const b of buddies) {
      if (!m.has(b.buddy_id)) m.set(b.buddy_id, b);
    }
    return Array.from(m.values());
  }, [buddies]);

  // Filter out buddies that are already checked in for this zone
  const filteredBuddies = useMemo(() => {
    if (!uniqueBuddies || uniqueBuddies.length === 0) return [];
    if (!zone?._id) return uniqueBuddies;
    const zid = zone._id as string;
    const map = (buddyCheckins || {});
    return uniqueBuddies.filter(b => {
      const checked = map[b.buddy_id] || [];
      return !checked.includes(zid);
    });
  }, [uniqueBuddies, buddyCheckins, zone]);

  const getBuddyPhoto = (buddy: any) => {
    // Support multiple shapes returned from different loaders
    return (
      buddy?.buddy_profile_photo_url ||
      buddy?.buddy?.profile_photo_url ||
      buddy?.buddy?.photo_url ||
      buddy?.buddy?.photoUrl ||
      buddy?.buddy?.photo ||
      null
    );
  };

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
  const coordinates = 
    (locationInfo?.lat && locationInfo?.lng ? { lat: locationInfo.lat, lng: locationInfo.lng } : null);

  // Calculate distance and check if user is nearby (within 500m)
  const distance = userLocation && coordinates 
    ? calculateDistance(userLocation.lat, userLocation.lng, coordinates.lat, coordinates.lng)
    : null;
  const isNearby = distance !== null && distance <= 0.5;

  // GPX url & filename for hazepad
  const gpxUrl = zone.skipRoute?.gpxFile?.asset?.url ?? null;
  const gpxFilename = gpxUrl ? decodeURIComponent((gpxUrl.split('/').pop() as string) || 'route.gpx') : null;

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
              onClick={() => { tap(); onClose(); }}
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
                skipGpxUrl={zone.skipRoute?.gpxFile?.asset?.url ?? null}
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
            <CSRFInput token={csrfToken} />
            {zone._id && <input type="hidden" name="zoneId" value={zone._id} />}
            {action && <input type="hidden" name="action" value={action} />}
            {qrCode && <input type="hidden" name="qrCode" value={qrCode} />}
            {userLocation && (
              <>
                <input type="hidden" name="latitude" value={userLocation.lat} />
                <input type="hidden" name="longitude" value={userLocation.lng} />
              </>
            )}

            {/* Include selected buddies in form submission */}
            {selectedBuddies.length > 0 && (
              <input type="hidden" name="selectedBuddies" value={selectedBuddies.join(',')} />
            )}

            {/* Hazepad option */}
            {zone.skipRoute && (
              <div className="mb-4 p-4 bg-gray-50 rounded-sm border border-gray-200">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="useSkipRoute"
                    value="1"
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold">Gebruik hazepad (skip route)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Kies dit als je het hazepad wilt gebruiken — je kunt dan geen routetips of challenges
                      indienen voor deze zone. {zone.skipRoute.instructions ? zone.skipRoute.instructions : ''}
                    </div>
                    {gpxUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="text-xs text-gray-700">GPX bestand: <span className="font-medium text-gray-800">{gpxFilename}</span></div>
                        <a
                          href={gpxUrl}
                          download={gpxFilename ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Download ${gpxFilename}`}
                          className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200"
                        >
                          <Icon name="download" className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}
            {/* Buddy selector (if provided and nearby) */}
            {buddies && buddies.length > 0 && (
              <div className="mt-6 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="users" className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Check ook je naftgenoten in</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Rijd je samen? Selecteer wie er bij je is om hen ook in te checken.</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filteredBuddies.map((buddy) => {
                    const photo = getBuddyPhoto(buddy);
                    return (
                      <label key={buddy.buddy_id} className="flex items-center gap-3 p-2 rounded hover:bg-blue-100 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedBuddies.includes(buddy.buddy_id)}
                          onChange={(e) => {
                            tap();
                            if (e.target.checked) {
                              setSelectedBuddies([...selectedBuddies, buddy.buddy_id]);
                            } else {
                              setSelectedBuddies(selectedBuddies.filter(id => id !== buddy.buddy_id));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <div className="flex items-center gap-2">
                          {photo ? (
                            <img src={photo} alt={`${buddy.buddy.first_name || ''} ${buddy.buddy.last_name || ''}`} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <Icon name="user" className="w-6 h-6 text-gray-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">{buddy.buddy.first_name} {buddy.buddy.last_name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedBuddies.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                    <Icon name="info" className="w-4 h-4 inline mr-1" />
                    {selectedBuddies.length} naftgenoot{selectedBuddies.length > 1 ? 'en' : ''} worden ook ingecheckt
                  </div>
                )}
                {/* Inform user about hidden buddies that are already checked in */}
                {uniqueBuddies.length > filteredBuddies.length && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800">
                    <Icon name="info" className="w-4 h-4 inline mr-1" />
                    {uniqueBuddies.length - filteredBuddies.length} naftgenoot{uniqueBuddies.length - filteredBuddies.length > 1 ? 'en' : ''} zijn al ingecheckt in deze zone en worden niet getoond
                  </div>
                )}
              </div>
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
                // Require geolocation and proximity to location when coordinates are known
                disabled={
                  isSubmitting || !userLocation || (coordinates ? !isNearby : false)
                }
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
          ) : null
          }
        </div>
      </div>
    </div>
  );
}
