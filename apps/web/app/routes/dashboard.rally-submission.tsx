import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useNavigation, redirect, useActionData } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { sanityClient } from '~/lib/sanity.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { MARKER_COLORS } from '~/lib/constants';

export const meta: MetaFunction = () => {
  return [{ title: 'Rally Zones Inchecken - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  // Redirect scenic route users
  if (user?.route_preference === 'scenic') {
    throw redirect('/dashboard');
  }

  // Fetch all active rally zones
  const zones = await sanityClient.fetch(`
    *[_type == "rallyZone" && is_open == true] | order(order asc) {
      _id,
      title,
      order,
      character,
      difficulty,
      distance_km,
      startPoint,
      endPoint,
      is_open
    }
  `);

  // Fetch user's check-ins
  const { data: checkIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id, checked_in_at')
    .eq('participant_id', userId)
    .order('checked_in_at', { ascending: false });

  // Get unique zone IDs that user has checked into
  const checkedZoneIds = new Set(checkIns?.map(c => c.zone_id) || []);

  // Get check-in counts per zone
  const { data: zoneCounts } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id');
  
  // Count check-ins per zone
  const zoneCheckInCounts: Record<string, number> = {};
  zoneCounts?.forEach((record: any) => {
    zoneCheckInCounts[record.zone_id] = (zoneCheckInCounts[record.zone_id] || 0) + 1;
  });

  // Get user's accepted buddies for group check-in
  const { data: buddies } = await supabaseAdmin
    .from('participant_buddies')
    .select('*')
    .eq('participant_id', userId)
    .eq('status', 'accepted');

  const buddiesList = (buddies || []).map(b => ({
    buddy_id: b.buddy_id,
    buddy: {
      id: b.buddy_id,
      first_name: b.buddy_first_name,
      last_name: b.buddy_last_name
    }
  }));

  return { zones, checkedZoneIds: Array.from(checkedZoneIds), user, zoneCheckInCounts, buddies: buddiesList };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const zoneId = formData.get('zoneId') as string;
  const action = formData.get('action') as string;
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);

  if (!zoneId || !action) {
    return { error: 'Zone ID en actie zijn verplicht' };
  }

  if (!latitude || !longitude) {
    return { error: 'Locatie is vereist om in te checken' };
  }

  // Fetch zone start location
  const zone = await sanityClient.fetch(`
    *[_type == "rallyZone" && _id == $zoneId][0] {
      _id,
      title,
      startPoint
    }
  `, { zoneId });

  if (!zone || !zone.startPoint) {
    return { error: 'Rally zone niet gevonden' };
  }

  // Calculate distance using Haversine formula
  const distance = calculateDistance(
    latitude,
    longitude,
    zone.startPoint.lat,
    zone.startPoint.lng
  );

  // Check if within 100 meters
  if (distance > 100) {
    return { 
      error: `Je bent te ver weg! Je moet binnen 100 meter van het startpunt zijn. (huidige afstand: ${Math.round(distance)}m)` 
    };
  }

  // Get selected buddy IDs from form (comma-separated string)
  const selectedBuddiesStr = formData.get('selectedBuddies') as string;
  const selectedBuddyIds = selectedBuddiesStr ? selectedBuddiesStr.split(',').filter(Boolean) : [];

  // Prepare check-ins array (user + selected buddies)
  const checkInsToCreate = [
    {
      participant_id: userId,
      zone_id: zoneId,
      location_lat: latitude,
      location_lng: longitude,
      checked_in_at: new Date().toISOString(),
      checked_in_by: userId, // Self check-in
    }
  ];

  // Add buddy check-ins (they get same location/time, but marked as checked in by the user)
  for (const buddyId of selectedBuddyIds) {
    checkInsToCreate.push({
      participant_id: buddyId,
      zone_id: zoneId,
      location_lat: latitude,
      location_lng: longitude,
      checked_in_at: new Date().toISOString(),
      checked_in_by: userId, // Checked in by the user, not themselves
    });
  }

  // Insert all check-ins
  const { error } = await supabaseAdmin
    .from('rally_zone_checkins')
    .insert(checkInsToCreate);

  if (error) {
    console.error('[rally-submission] Check-in error:', error);
    return { error: 'Check-in mislukt. Probeer opnieuw.' };
  }

  // Send notifications to buddies who were checked in
  if (selectedBuddyIds.length > 0) {
    try {
      const { data: checkerInfo } = await supabaseAdmin
        .from('participants')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const zoneInfo = await sanityClient.fetch(`
        *[_type == "rallyZone" && _id == $zoneId][0] {
          title
        }
      `, { zoneId });

      for (const buddyId of selectedBuddyIds) {
        const { data: subscriptions } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('participant_id', buddyId)
          .eq('is_active', true);

        if (subscriptions && subscriptions.length > 0) {
          const { sendPushNotificationWithHistory } = await import('~/lib/push-notifications-enhanced.server');
          
          await sendPushNotificationWithHistory(
            subscriptions,
            {
              title: 'Groeps Check-in! 🏍️',
              body: `${checkerInfo?.first_name} ${checkerInfo?.last_name} heeft je ingecheckt bij ${zoneInfo?.title || 'een zone'}`,
              tag: 'buddy-checkin',
            },
            {
              title: 'Groeps Check-in! 🏍️',
              body: `${checkerInfo?.first_name} ${checkerInfo?.last_name} heeft je ingecheckt bij ${zoneInfo?.title || 'een zone'}`,
              eventType: 'buddy_checkin',
              targetType: 'single',
              sentBy: userId,
              eventData: { zone_id: zoneId, checked_in_by: userId },
            }
          );
        }
      }
    } catch (notifError) {
      console.error('[rally-submission] Failed to send buddy check-in notifications:', notifError);
      // Don't fail the whole operation if notifications fail
    }
  }

  return { success: true, buddiesCheckedIn: selectedBuddyIds.length };
}

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export default function RallySubmission() {
  const { zones, checkedZoneIds, user, zoneCheckInCounts, buddies } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [selectedBuddies, setSelectedBuddies] = useState<string[]>([]);
  const mapRef = useRef<any>(null);
  const isSubmitting = navigation.state === 'submitting';

  const checkedSet = new Set(checkedZoneIds);
  const completedCount = checkedZoneIds.length;
  const totalZones = zones.length;

  const getLocation = (zoneId: string) => {
    const zone = zones.find((z: any) => z._id === zoneId);
    if (!zone) return;

    // Check if zone has start location with coordinates
    if (!zone.startPoint) {
      setLocationError('Deze zone heeft geen startlocatie ingesteld. Neem contact op met de organisatie.');
      return;
    }

    setGettingLocation(true);
    setLocationError(null);
    setSelectedZone(zoneId);
    setCurrentZone(zone);

    if (!navigator.geolocation) {
      setLocationError('Geolocatie wordt niet ondersteund door je browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const zoneLat = zone.startPoint.lat;
        const zoneLng = zone.startPoint.lng;

        // Calculate distance
        const dist = calculateDistance(userLat, userLng, zoneLat, zoneLng);
        setDistance(dist);

        setLocation({
          latitude: userLat,
          longitude: userLng,
        });
        setGettingLocation(false);
        setShowMapModal(true);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Kan locatie niet ophalen. Zorg dat locatie toegang is ingeschakeld.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Helper function for distance calculation (client-side)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Initialize map when modal opens
  useEffect(() => {
    if (!showMapModal || !location || !currentZone) return;

    import('leaflet').then((L) => {
      if (mapRef.current) {
        mapRef.current.remove();
      }

      const mapElement = document.getElementById('check-in-map');
      if (!mapElement) return;

      const zoneLat = currentZone.startPoint.lat;
      const zoneLng = currentZone.startPoint.lng;

      // Create map centered between user and zone
      const centerLat = (location.latitude + zoneLat) / 2;
      const centerLng = (location.longitude + zoneLng) / 2;

      const map = L.map(mapElement).setView([centerLat, centerLng], 16);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Zone start marker (green)
      L.marker([zoneLat, zoneLng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${MARKER_COLORS.green}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path></svg></div>`,
        }),
      })
        .addTo(map)
        .bindPopup('<b>Zone Startpunt</b>');

      // 100m radius circle
      L.circle([zoneLat, zoneLng], {
        radius: 100,
        color: distance <= 100 ? MARKER_COLORS.green : MARKER_COLORS.red,
        fillColor: distance <= 100 ? MARKER_COLORS.green : MARKER_COLORS.red,
        fillOpacity: 0.2,
      }).addTo(map);

      // User location marker (blue)
      L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${MARKER_COLORS.blue}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`,
        }),
      })
        .addTo(map)
        .bindPopup('<b>Jouw Locatie</b>');

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([[zoneLat, zoneLng], [location.latitude, location.longitude]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMapModal, location, currentZone, distance]);

  // Handle action errors
  useEffect(() => {
    if (actionData?.error) {
      setLocationError(actionData.error);
    }
    if (actionData?.success) {
      setShowMapModal(false);
      setLocation(null);
      setSelectedZone(null);
      setCurrentZone(null);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rally Zones Inchecken</h1>
          <p className="text-gray-600">
            Check in bij rally zones om je voortgang bij te houden
          </p>
        </div>

        {/* Location Error */}
        {locationError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-sm mb-6">
            <div className="flex items-start">
              <Icon name="alert-triangle" className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold mb-1">Locatie Fout</p>
                <p className="text-red-700 text-sm">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="bg-white rounded-sm shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Jouw Voortgang</h2>
              <p className="text-gray-600 text-sm">
                {completedCount} van {totalZones} zones bezocht
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary-600">{completedCount}</div>
              <div className="text-sm text-gray-500">zones</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalZones) * 100}%` }}
            />
          </div>
        </div>

        {/* Rally Zones Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone: any) => {
            const isChecked = checkedSet.has(zone._id);

            return (
              <div
                key={zone._id}
                className={`bg-white rounded-sm shadow hover:shadow-lg transition-shadow ${
                  isChecked ? 'border-2 border-green-500' : 'border border-gray-200'
                }`}
              >
                <div className="p-6">
                  {/* Zone Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Zone {zone.order}</div>
                      <h3 className="text-lg font-bold text-gray-900">{zone.title}</h3>
                    </div>
                    {isChecked && (
                      <Icon name="check" className="w-6 h-6 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  {/* Zone Details */}
                  <div className="space-y-2 mb-4">
                    {zone.distance_km && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="map" className="w-4 h-4" />
                        <span>{zone.distance_km} km</span>
                      </div>
                    )}
                    {zone.character && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="flag" className="w-4 h-4" />
                        <span>{zone.character}</span>
                      </div>
                    )}
                    {zone.difficulty && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="target" className="w-4 h-4" />
                        <span>Moeilijkheid: {zone.difficulty}</span>
                      </div>
                    )}
                    {/* Show number of check-ins */}
                    <div className="flex items-center gap-2 text-sm text-primary-600 font-semibold">
                      <Icon name="users" className="w-4 h-4" />
                      <span>{zoneCheckInCounts[zone._id] || 0} deelnemers ingecheckt</span>
                    </div>
                  </div>

                  {/* Check-in Button */}
                  <button
                    type="button"
                    onClick={() => getLocation(zone._id)}
                    disabled={isChecked || gettingLocation}
                    className={`w-full py-2.5 px-4 rounded-sm font-semibold transition-colors ${
                      isChecked
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : gettingLocation && selectedZone === zone._id
                        ? 'bg-gray-400 text-white cursor-wait'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isChecked ? (
                      <>
                        <Icon name="check" className="w-4 h-4 inline mr-2" />
                        Ingecheckt
                      </>
                    ) : gettingLocation && selectedZone === zone._id ? (
                      <>
                        <Icon name="map" className="w-4 h-4 inline mr-2 animate-pulse" />
                        Locatie ophalen...
                      </>
                    ) : (
                      <>
                        <Icon name="flag" className="w-4 h-4 inline mr-2" />
                        Check in
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
          >
            <Icon name="arrow-left" className="w-4 h-4" />
            Terug naar Dashboard
          </a>
        </div>
      </main>

      {/* Location Confirmation Modal */}
      {showMapModal && location && currentZone && (
        <div className="fixed inset-0 bg-black/50 z-[1500] flex items-center justify-center p-4" onClick={() => setShowMapModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Check-in Locatie</h3>
                  <p className="text-sm text-primary-100">Zone {currentZone.order}: {currentZone.title}</p>
                </div>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1">{/* Distance Info */}
            <div className={`px-6 py-4 border-b ${
              distance <= 100 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <Icon 
                  name={distance <= 100 ? 'check' : 'alert-triangle'} 
                  className={`w-6 h-6 ${
                    distance <= 100 ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <div>
                  <p className={`font-semibold ${
                    distance <= 100 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {distance <= 100 ? 'Binnen bereik!' : 'Te ver weg'}
                  </p>
                  <p className={`text-sm ${
                    distance <= 100 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Afstand tot startpunt: <strong>{Math.round(distance)}m</strong> (max. 100m)
                  </p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div id="check-in-map" className="w-full h-[400px] bg-gray-100"></div>

            {/* Legend */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                  <span className="text-gray-700">Zone Startpunt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                  <span className="text-gray-700">Jouw Locatie</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/30 rounded-full border border-green-500"></div>
                  <span className="text-gray-700">100m Bereik</span>
                </div>
              </div>
            </div>

            {/* Buddy Selector - only if user has buddies and within range */}
            {buddies && buddies.length > 0 && distance <= 100 && (
              <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="users" className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Check ook je naftgenoten in</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Rijd je samen? Selecteer wie er bij je is om hen ook in te checken.
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {buddies.map((buddy: any) => (
                    <label
                      key={buddy.buddy_id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBuddies.includes(buddy.buddy_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBuddies([...selectedBuddies, buddy.buddy_id]);
                          } else {
                            setSelectedBuddies(selectedBuddies.filter(id => id !== buddy.buddy_id));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <Icon name="user" className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {buddy.buddy.first_name} {buddy.buddy.last_name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedBuddies.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                    <Icon name="info" className="w-4 h-4 inline mr-1" />
                    {selectedBuddies.length} naftgenoot{selectedBuddies.length > 1 ? 'en' : ''} worden ook ingecheckt
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="px-6 py-4 bg-white border-t flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowMapModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              {distance <= 100 ? (
                <Form method="post" className="flex-1" onSubmit={() => setShowMapModal(false)}>
                  <input type="hidden" name="zoneId" value={currentZone._id} />
                  <input type="hidden" name="action" value="manual_checkin" />
                  <input type="hidden" name="latitude" value={location.latitude} />
                  <input type="hidden" name="longitude" value={location.longitude} />
                  <input type="hidden" name="selectedBuddies" value={selectedBuddies.join(',')} />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-green-600 text-white font-semibold rounded-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Icon name="check" className="w-4 h-4 inline mr-2" />
                    Bevestig Check-in{selectedBuddies.length > 0 && ` (+${selectedBuddies.length})`}
                  </button>
                </Form>
              ) : (
                <button
                  disabled
                  className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-500 font-semibold rounded-sm cursor-not-allowed"
                >
                  Te ver weg om in te checken
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
