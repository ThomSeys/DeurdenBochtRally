import { useEffect, useState } from 'react';
import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useRevalidator } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { sanityClient } from '~/lib/sanity.server';
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

  // Fetch rally zones
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      location,
      color,
      startLocation,
      endLocation,
      "is_open": coalesce(is_open, true)
    }
  `);

  // Fetch event markers
  const eventMarkers = await sanityClient.fetch(`
    *[_type == "eventMarker" && isActive == true] | order(createdAt desc) {
      _id,
      title,
      description,
      type,
      location,
      severity,
      createdAt,
      updatedAt
    }
  `);

  // Fetch GPX route file
  const siteConfig = await sanityClient.fetch(`
    *[_type == "siteConfig"][0] {
      gpxRouteFile {
        asset-> {
          url
        }
      }
    }
  `);

    console.info('[live-map] loader success', {
      zones: rallyZones?.length ?? 0,
      markers: eventMarkers?.length ?? 0,
      hasGpx: Boolean(siteConfig?.gpxRouteFile?.asset?.url),
      isAdmin,
      isEventDay,
    });

    return {
      rallyZones,
      eventMarkers,
      gpxRouteUrl: siteConfig?.gpxRouteFile?.asset?.url,
      isAdmin,
      isEventDay,
    };
  } catch (error) {
    console.error('[live-map] loader error', error);
    throw error;
  }
}

export default function LiveMap() {
  const { rallyZones, eventMarkers, gpxRouteUrl, isAdmin, isEventDay } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // Auto-refresh every 30 seconds to get new event markers
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
      setLastUpdate(new Date());
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [revalidator]);

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
          eventMarkers={eventMarkers}
          gpxRouteUrl={gpxRouteUrl}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
          <h3 className="font-semibold text-gray-900 mb-2">Legenda</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary-600 border-2 border-white rounded-full shadow"></div>
              <span>Rally Zones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow"></div>
              <span>Uw Locatie</span>
            </div>
            {eventMarkers.length > 0 && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="font-medium text-gray-700 mb-1">Live Evenementen:</div>
                </div>
                {Array.from(new Set(eventMarkers.map((m: any) => m.type))).map((type: any) => (
                  <div key={type} className="flex items-center gap-2 pl-2">
                    <span>{getEventTypeEmoji(type)}</span>
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          {eventMarkers.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">Geen actieve evenementen</p>
          )}
        </div>
      </div>

      {/* Event Submission Form */}
      <EventSubmissionForm onSubmitSuccess={() => revalidator.revalidate()} userLocation={userLocation} />

      <Footer />
    </div>
  );
}

// Dynamic import of map component
function LiveEventMapComponent({ rallyZones, eventMarkers, gpxRouteUrl }: any) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
