import { useEffect, useState } from 'react';
import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useRevalidator } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { sanityClient, getActiveEdition } from '~/lib/sanity.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import EventSubmissionForm from '~/components/EventSubmissionForm';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  console.info('[live-map] loader start');

  try {
    await requireUserId(request);
    const user = await getUser(request);

  const EVENT_DATE = process.env.EVENT_DATE || '2026-05-16';
  const today = new Date().toISOString().split('T')[0];
  const isEventDay = today === EVENT_DATE;
  const isAdmin = user?.is_admin === true;

  // Only allow access on event day OR if user is admin
  if (!isEventDay && !isAdmin) {
    throw new Response('Live map is only available on the event day', { status: 403 });
  }

  // Fetch rally zones with GPX routes
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      location,
      color,
      "startLocation": startPoint,
      "endLocation": endPoint,
      "is_open": coalesce(is_open, true),
      checkpoints[] {
        _key,
        name,
        description,
        codeHint,
        location
      },
      gpxRoute {
        asset-> {
          url
        }
      }
    }
  `);

  // Fetch check-ins for visualization with participant info
  const { data: checkIns, error: checkInError } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select(`
      participant_id,
      zone_id,
      entry_latitude,
      entry_longitude,
      answer_latitude,
      answer_longitude,
      created_at,
      participants!rally_zone_submissions_participant_id_fkey (
        first_name,
        last_name,
        motorcycle_brand,
        motorcycle_model
      )
    `);

  if (checkInError) {
    console.error('[live-map] checkIn fetch error:', checkInError);
  }
  console.info('[live-map] checkIns fetched:', { count: checkIns?.length, error: checkInError, sample: checkIns?.[0] });

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

  // Fetch active edition
  const edition = await getActiveEdition();

    console.info('[live-map] loader success', {
      zones: rallyZones?.length ?? 0,
      markers: eventMarkers?.length ?? 0,
      checkIns: checkIns?.length ?? 0,
      checkInsData: checkIns,
      hasGpx: Boolean(siteConfig?.gpxRouteFile?.asset?.url),
      isAdmin,
      isEventDay,
    });

    return {
      rallyZones,
      eventMarkers,
      gpxRouteUrl: siteConfig?.gpxRouteFile?.asset?.url,
      checkIns: checkIns || [],
      isAdmin,
      isEventDay,
      siteConfig,
      edition,
    };
  } catch (error) {
    console.error('[live-map] loader error', error);
    throw error;
  }
}

export default function LiveMap() {
  const { rallyZones, eventMarkers, gpxRouteUrl, checkIns, isAdmin, isEventDay, siteConfig, edition } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold break-words flex items-center gap-2">
                <Icon name="map" className="w-8 h-8" />
                Live Rally Kaart
              </h1>
              <p className="mt-2 text-primary-100 break-words text-sm sm:text-base">
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
          checkIns={checkIns}
          showCheckIns={showCheckIns}
          showZoneRoutes={showZoneRoutes}
          showEventMarkers={showEventMarkers}
          isAdmin={isAdmin}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-sm shadow-lg p-4 max-w-xs z-20">
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
                <span>S{isAdmin ? ' / E' : ''}</span>
                <span>Start{isAdmin ? ' / Eind' : ''} Punt{isAdmin ? 'en' : ''}</span>
              </div>
            </div>

            {isAdmin && (
            <div className="border-b pb-2">
              <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => setShowCheckIns(!showCheckIns)}>
                <span style={{opacity: showCheckIns ? 1 : 0.5}}>Check-ins ({checkIns?.length || 0})</span>
              </div>
              <div className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showCheckIns ? 1 : 0.5}} onClick={() => setShowCheckIns(!showCheckIns)}>
                <div style={{ background: '#10b981', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
                <span className="flex items-center gap-1">
                  <Icon name="marker" className="w-3 h-3" />
                  Zone Entry
                </span>
              </div>
              <div className="flex items-center gap-2 pl-2 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showCheckIns ? 1 : 0.5}} onClick={() => setShowCheckIns(!showCheckIns)}>
                <div style={{ background: '#f59e0b', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
                <span>✓ Code Submission</span>
              </div>
            </div>
            )}

            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow"></div>
                <span>Uw Locatie</span>
              </div>
            </div>

            {eventMarkers.length > 0 && (
              <div>
                <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => setShowEventMarkers(!showEventMarkers)}>
                  <span style={{opacity: showEventMarkers ? 1 : 0.5}}>Live Evenementen ({eventMarkers.length})</span>
                </div>
              </div>
            )}
          </div>
          {eventMarkers.length === 0 && checkIns.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">Geen actieve evenementen of check-ins</p>
          )}
        </div>
      </div>

      {/* Event Submission Form */}
      <EventSubmissionForm onSubmitSuccess={() => revalidator.revalidate()} userLocation={userLocation} />

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}

// Dynamic import of map component
function LiveEventMapComponent({ rallyZones, eventMarkers, gpxRouteUrl, checkIns, showCheckIns, showZoneRoutes, showEventMarkers, isAdmin }: any) {
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
      isAdmin={isAdmin}
    />
  );
}

function getEventTypeIcon(type: string, color: string): { svg: string; label: string } {
  const iconMap: Record<string, { svg: string; label: string }> = {
    closure: {
      label: 'Closure',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="16" height="12" fill="none" stroke="${color}" stroke-width="2" rx="2"/>
        <line x1="4" y1="10" x2="20" y2="10" stroke="${color}" stroke-width="2"/>
        <line x1="10" y1="6" x2="10" y2="18" stroke="${color}" stroke-width="2"/>
        <line x1="14" y1="6" x2="14" y2="18" stroke="${color}" stroke-width="2"/>
      </svg>`,
    },
    accident: {
      label: 'Accident',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L22 7 L22 12 Q22 18 12 22 Q2 18 2 12 L2 7 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="12" y1="10" x2="12" y2="16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="19" r="1.5" fill="${color}"/>
      </svg>`,
    },
    stop: {
      label: 'Stop',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/>
        <line x1="4" y1="12" x2="20" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    },
    flood: {
      label: 'Flood',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 16 Q6 12 9 16 Q12 12 15 16 Q18 12 21 16" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <path d="M3 11 Q6 7 9 11 Q12 7 15 11 Q18 7 21 11" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <rect x="2" y="18" width="20" height="3" fill="${color}" opacity="0.5"/>
      </svg>`,
    },
    warning: {
      label: 'Warning',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L22 20 L2 20 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="14" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="18" r="1" fill="${color}"/>
      </svg>`,
    },
    info: {
      label: 'Info',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="8.5" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="12" y1="11" x2="12" y2="16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    },
    station: {
      label: 'Station',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8 L4 18 C4 19.1 4.9 20 6 20 L18 20 C19.1 20 20 19.1 20 18 L20 8" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="8" y1="4" x2="8" y2="8" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="4" x2="12" y2="8" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="4" y1="14" x2="20" y2="14" stroke="${color}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
      </svg>`,
    },
  };
  
  const defaultIcon = {
    label: 'Marker',
    svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 C7 2 3 6 3 11 C3 17 12 22 12 22 C12 22 21 17 21 11 C21 6 17 2 12 2 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="12" cy="11" r="3" fill="${color}"/>
    </svg>`,
  };
  
  return iconMap[type] || defaultIcon;
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
