import { useEffect, useState } from 'react';
import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { useFetchOffline } from '~/lib/offline.hooks';
import type { RallyZone } from '~/lib/api.client';
import EventSubmissionForm from '~/components/EventSubmissionForm';
import Header from '~/components/Header';
import Footer from '~/components/Footer';

export async function loader({ request }: LoaderFunctionArgs) {
  console.info('[live-map] loader start');

  try {
    await requireUserId(request);
    const user = await getUser(request);

    const EVENT_DATE = process.env.EVENT_DATE || '2026-05-16';
    const today = new Date().toISOString().split('T')[0];
    const isEventDay = today === EVENT_DATE;
    const isAdmin = user?.is_admin || false;

    // Only allow access on event day OR if user is admin
    if (!isEventDay && !isAdmin) {
      throw new Response('Live map is only available on the event day', { status: 403 });
    }

    console.info('[live-map] loader success', {
      isAdmin,
      isEventDay,
    });

    return {
      isAdmin,
      isEventDay,
    };
  } catch (error) {
    console.error('[live-map] loader error', error);
    throw error;
  }
}

export default function LiveMap() {
  const { isAdmin, isEventDay } = useLoaderData<typeof loader>();
  
  // Fetch data client-side with offline support
  const { 
    data: rallyZones,
    isLoading: zonesLoading,
    isCached: zonesCached,
  } = useFetchOffline<RallyZone[]>('/api/rally-zones', { cacheKey: 'rally-zones' });
  
  const {
    data: checkIns,
    isCached: checkInsCached,
  } = useFetchOffline<any[]>('/api/check-ins', { cacheKey: 'check-ins' });
  
  const {
    data: eventMarkers,
    isCached: markersCached,
  } = useFetchOffline<any[]>('/api/event-markers', { cacheKey: 'event-markers' });
  
  const {
    data: gpxData,
  } = useFetchOffline<{ url: string }>('/api/gpx-route', { cacheKey: 'gpx-route' });

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCheckIns, setShowCheckIns] = useState(true);
  const [showZoneRoutes, setShowZoneRoutes] = useState(true);
  const [showEventMarkers, setShowEventMarkers] = useState(true);

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silently fail if user denies location
        }
      );
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Refetch in background
      fetch('/api/check-ins').catch(() => {});
      fetch('/api/event-markers').catch(() => {});
      setLastUpdate(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (zonesLoading || !rallyZones) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Kaart aan het laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-r h-full from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🗺️ Live Rally Kaart</h1>
              <p className="mt-2 text-primary-100">
                Real-time overzicht van de rally zones en evenementen
                {!isEventDay && isAdmin && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Admin Voorbeeld
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: '80vh' }}>
        <LiveEventMapComponent
          rallyZones={rallyZones}
          eventMarkers={eventMarkers || []}
          gpxRouteUrl={gpxData?.url}
          checkIns={checkIns || []}
          showCheckIns={showCheckIns}
          showZoneRoutes={showZoneRoutes}
          showEventMarkers={showEventMarkers}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
          <h3 className="font-semibold text-gray-900 mb-3">Legenda</h3>
          <div className="space-y-2 text-sm">
            <div className="border-b pb-2">
              <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => setShowZoneRoutes(!showZoneRoutes)}>
                <span style={{opacity: showZoneRoutes ? 1 : 0.5}}>Rally Zones:</span>
              </div>
              <div className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showZoneRoutes ? 1 : 0.5}} onClick={() => setShowZoneRoutes(!showZoneRoutes)}>
                <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                <span>Zone Routes</span>
              </div>
              <div className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showZoneRoutes ? 1 : 0.5}} onClick={() => setShowZoneRoutes(!showZoneRoutes)}>
                <span>S / E</span>
                <span>Start / Eind Punten</span>
              </div>
            </div>

            <div className="border-b pb-2">
              <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => setShowCheckIns(!showCheckIns)}>
                <span style={{opacity: showCheckIns ? 1 : 0.5}}>Check-ins ({checkIns?.length || 0})</span>
              </div>
              <div className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showCheckIns ? 1 : 0.5}} onClick={() => setShowCheckIns(!showCheckIns)}>
                <div style={{ background: '#10b981', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
                <span>📍 Zone Start</span>
              </div>
              <div className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showCheckIns ? 1 : 0.5}} onClick={() => setShowCheckIns(!showCheckIns)}>
                <div style={{ background: '#f59e0b', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
                <span>✓ Code Indiening</span>
              </div>
            </div>

            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow"></div>
                <span>Uw Locatie</span>
              </div>
            </div>

            {(eventMarkers?.length || 0) > 0 && (
              <div>
                <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => setShowEventMarkers(!showEventMarkers)}>
                  <span style={{opacity: showEventMarkers ? 1 : 0.5}}>Live Evenementen ({eventMarkers?.length || 0})</span>
                </div>
                {Array.from(new Set((eventMarkers || []).map((m: any) => m.type))).map((type: any) => (
                  <div key={type} className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showEventMarkers ? 1 : 0.5}} onClick={() => setShowEventMarkers(!showEventMarkers)}>
                    <span>{getEventTypeEmoji(type)}</span>
                    <span className="capitalize text-xs">{type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {(eventMarkers?.length || 0) === 0 && (checkIns?.length || 0) === 0 && (
            <p className="text-xs text-gray-500 mt-2">Geen actieve evenementen of check-ins</p>
          )}
        </div>
      </div>

      {/* Event Submission Form */}
      <EventSubmissionForm userLocation={userLocation} />

      <Footer />
    </div>
  );
}

// Dynamic import of map component
function LiveEventMapComponent({ rallyZones, eventMarkers, gpxRouteUrl, checkIns, showCheckIns, showZoneRoutes, showEventMarkers }: any) {
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    import('~/components/LiveEventMap').then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kaart laden...</p>
        </div>
      </div>
    );
  }

  return (
    <MapComponent
      rallyZones={rallyZones}
      eventMarkers={eventMarkers}
      gpxRouteUrl={gpxRouteUrl}
      checkIns={checkIns}
      showCheckIns={showCheckIns}
      showZoneRoutes={showZoneRoutes}
      showEventMarkers={showEventMarkers}
    />
  );
}

function getEventTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    closure: '🚧',
    accident: '🚨',
    stop: '⛔',
    flood: '🌊',
    warning: '⚠️',
    info: 'ℹ️',
    station: '💧',
  };
  return emojiMap[type] || '📍';
}
