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
import { MARKER_COLORS } from '~/lib/constants';

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

  // Fetch rally zones with GPX routes (Concept B)
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      character,
      color,
      "startLocation": startPoint,
      "endLocation": endPoint,
      "is_open": coalesce(is_active, true),
      emergency_contact,
      routeTips[] {
        name,
        color,
        locations[] {
          name,
          coordinates {
            lat,
            lng
          },
          type,
          description
        }
      }
    }
  `);

  // Fetch check-ins for visualization with participant info (Concept B: latest check-in per participant)
  const { data: checkIns, error: checkInError } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select(`
      id,
      participant_id,
      zone_id,
      location_lat,
      location_lng,
      checked_in_at,
      participants (
        first_name,
        last_name,
        motorcycle_brand,
        motorcycle_model
      )
    `)
    .order('checked_in_at', { ascending: false });

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

  // Fetch active emergency SOS alerts (only for admins)
  let emergencyAlerts: any[] = [];
  if (isAdmin) {
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('emergency_sos')
      .select(`
        id,
        participant_id,
        location_lat,
        location_lng,
        status,
        message,
        created_at,
        participants!emergency_sos_participant_id_fkey (
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (alertsError) {
      console.error('[live-map] Emergency alerts fetch error:', alertsError);
    }
    
    emergencyAlerts = alerts || [];
    console.log("🚨 ~ loader ~ emergencyAlerts:", emergencyAlerts, 'count:', alerts?.length, 'error:', alertsError);
  }

  // Fetch GPX route file
  const siteConfig = await sanityClient.fetch(`
    *[_type == "siteConfig"][0] {
      gpxRouteFiles[] {
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
      hasGpx: Boolean(siteConfig?.gpxRouteFiles?.[0]?.asset?.url),
      isAdmin,
      isEventDay,
    });

    return {
      rallyZones,
      eventMarkers,
      emergencyAlerts,
      gpxRouteUrl: siteConfig?.gpxRouteFiles?.[0]?.asset?.url,
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
  const { rallyZones, eventMarkers, emergencyAlerts, gpxRouteUrl, checkIns, isAdmin, isEventDay, siteConfig, edition } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCheckIns, setShowCheckIns] = useState(true);
  const [showZoneRoutes, setShowZoneRoutes] = useState(true);
  const [showEventMarkers, setShowEventMarkers] = useState(true);
  const [showEmergencyAlerts, setShowEmergencyAlerts] = useState(true);

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
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [revalidator]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white">
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
          emergencyAlerts={emergencyAlerts}
          gpxRouteUrl={gpxRouteUrl}
          checkIns={checkIns}
          showCheckIns={showCheckIns}
          showZoneRoutes={showZoneRoutes}
          showEventMarkers={showEventMarkers}
          showEmergencyAlerts={showEmergencyAlerts}
          isAdmin={isAdmin}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="info-circle" className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Legenda</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="border-b pb-2.5">
              <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-2" onClick={() => setShowZoneRoutes(!showZoneRoutes)}>
                <Icon name="map" className="w-4 h-4" />
                <span style={{opacity: showZoneRoutes ? 1 : 0.5}}>Rally Zones</span>
              </div>
              <div className="flex items-center gap-2 pl-6 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showZoneRoutes ? 1 : 0.5}} onClick={() => setShowZoneRoutes(!showZoneRoutes)}>
                <div className="w-3 h-0.5 bg-primary-600"></div>
                <span>Zone Routes</span>
              </div>
              <div className="flex items-center gap-2 pl-6 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showZoneRoutes ? 1 : 0.5}} onClick={() => setShowZoneRoutes(!showZoneRoutes)}>
                <span className="font-bold text-xs">S{isAdmin ? ' / E' : ''}</span>
                <span>Start{isAdmin ? ' / Eind' : ''} Punt{isAdmin ? 'en' : ''}</span>
              </div>
            </div>

            {isAdmin && (
            <div className="border-b pb-2.5">
              <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-2" onClick={() => setShowCheckIns(!showCheckIns)}>
                <Icon name="check-circle" className="w-4 h-4" />
                <span style={{opacity: showCheckIns ? 1 : 0.5}}>Check-ins ({checkIns?.length || 0})</span>
              </div>
              <div className="flex items-center gap-2 pl-6 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showCheckIns ? 1 : 0.5}} onClick={() => setShowCheckIns(!showCheckIns)}>
                <div style={{ background: MARKER_COLORS.green, width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                <span>Zone Entry</span>
              </div>
              <div className="flex items-center gap-2 pl-6 cursor-pointer hover:text-primary-600 transition-colors" style={{opacity: showCheckIns ? 1 : 0.5}} onClick={() => setShowCheckIns(!showCheckIns)}>
                <div style={{ background: '#f59e0b', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                <span>Code Submission</span>
              </div>
            </div>
            )}

            <div className="border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Icon name="marker" className="w-4 h-4 text-purple-600" />
                <div className="w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow"></div>
                <span>Uw Locatie</span>
              </div>
            </div>

            {eventMarkers.length > 0 && (
              <div className="border-b pb-2.5">
                <div className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-2" onClick={() => setShowEventMarkers(!showEventMarkers)}>
                  <Icon name="alert" className="w-4 h-4" />
                  <span style={{opacity: showEventMarkers ? 1 : 0.5}}>Live Evenementen ({eventMarkers.length})</span>
                </div>
              </div>
            )}

            {isAdmin && emergencyAlerts && emergencyAlerts.length > 0 && (
              <div className="border-t pt-2.5">
                <div className="font-medium text-red-600 mb-2 cursor-pointer hover:text-red-700 transition-colors flex items-center gap-2" onClick={() => setShowEmergencyAlerts(!showEmergencyAlerts)}>
                  <Icon name="alert-circle" className="w-4 h-4" />
                  <span style={{opacity: showEmergencyAlerts ? 1 : 0.5}}>Nood SOS ({emergencyAlerts.length})</span>
                </div>
                <div className="flex items-center gap-2 pl-6 cursor-pointer hover:text-red-600 transition-colors" style={{opacity: showEmergencyAlerts ? 1 : 0.5}} onClick={() => setShowEmergencyAlerts(!showEmergencyAlerts)}>
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <span className="text-red-600 font-medium">Actieve Meldingen</span>
                </div>
              </div>
            )}
          </div>
          {eventMarkers.length === 0 && checkIns.length === 0 && (
            <p className="text-xs text-gray-500 mt-3 italic">Geen actieve evenementen of check-ins</p>
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
function LiveEventMapComponent({ rallyZones, eventMarkers, emergencyAlerts, gpxRouteUrl, checkIns, showCheckIns, showZoneRoutes, showEventMarkers, showEmergencyAlerts, isAdmin }: any) {
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
      emergencyAlerts={emergencyAlerts}
      gpxRouteUrl={gpxRouteUrl}
      checkIns={checkIns}
      showCheckIns={showCheckIns}
      showZoneRoutes={showZoneRoutes}
      showEventMarkers={showEventMarkers}
      showEmergencyAlerts={showEmergencyAlerts}
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
    accident: '!',
    stop: 'X',
    flood: '~',
    warning: '!',
    info: 'i',
    station: 'S',
  };
  return emojiMap[type] || 'M';
}
