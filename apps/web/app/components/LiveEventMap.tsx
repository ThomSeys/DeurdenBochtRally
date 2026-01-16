import { useEffect, useRef, useState } from 'react';

interface RallyZone {
  _id: string;
  title: string;
  location: string;
  color: string;
  startLocation: { lat: number; lng: number; label?: string };
  endLocation?: { lat: number; lng: number; label?: string };
  is_open: boolean;
  checkpoints?: Array<{
    _key: string;
    name: string;
    description: string;
    codeHint: string;
    location: { lat: number; lng: number };
  }>;
  gpxRoute?: {
    asset: {
      url: string;
    };
  };
}

interface EventMarker {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: { lat: number; lng: number };
  severity: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckIn {
  participant_id: string;
  zone_id: number;
  entry_latitude: number;
  entry_longitude: number;
  answer_latitude: number | null;
  answer_longitude: number | null;
  created_at: string;
  participants?: {
    first_name: string;
    last_name: string;
    motorcycle_brand: string;
    motorcycle_model: string;
  };
}

interface LiveEventMapProps {
  rallyZones: RallyZone[];
  eventMarkers: EventMarker[];
  gpxRouteUrl?: string;
  checkIns?: CheckIn[];
  showCheckIns?: boolean;
  showZoneRoutes?: boolean;
  showEventMarkers?: boolean;
  isAdmin?: boolean;
}

export default function LiveEventMap({ rallyZones, eventMarkers, gpxRouteUrl, checkIns = [], showCheckIns = true, showZoneRoutes = true, showEventMarkers = true, isAdmin = false }: LiveEventMapProps) {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const gpxLayerRef = useRef<any>(null);
  const zoneRoutesRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get user's location and track it
  useEffect(() => {
    if (!isClient) return;

    if ('geolocation' in navigator) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );

      // Watch for position updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isClient]);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;
    // Dynamically import Leaflet only on client side
    import('leaflet').then(async (L) => {
      try {
        // Initialize map only once
        if (!mapRef.current && mapContainerRef.current) {
          // Default center (Belgium, Aalter area)
          const defaultCenter: [number, number] = [51.0967, 3.4400];
          
          mapRef.current = L.default.map(mapContainerRef.current).setView(defaultCenter, 12);

          // Add light gray map tiles (CartoDB Voyager - balanced theme)
          L.default.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
          }).addTo(mapRef.current);

          // Fix map size issues
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, 100);
        }

        if (!mapRef.current) return;

        // Load and display GPX route if available
        if (gpxRouteUrl && !gpxLayerRef.current) {
          try {
            const response = await fetch(gpxRouteUrl);
            const gpxText = await response.text();
            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
            
            // Parse GPX track points
            const trackPoints: [number, number][] = [];
            const trkpts = gpxDoc.querySelectorAll('trkpt');
            
            trkpts.forEach((pt) => {
              const lat = parseFloat(pt.getAttribute('lat') || '0');
              const lon = parseFloat(pt.getAttribute('lon') || '0');
              if (lat && lon) {
                trackPoints.push([lat, lon]);
              }
            });

            if (trackPoints.length > 0) {
              // Create polyline for the route
              gpxLayerRef.current = L.default.polyline(trackPoints, {
                color: '#4F46E5',
                weight: 4,
                opacity: 0.7,
              }).addTo(mapRef.current);

              // Fit map to route bounds
              mapRef.current.fitBounds(gpxLayerRef.current.getBounds(), { padding: [50, 50] });
            }
          } catch (error) {
            console.error('Error loading GPX route:', error);
            setMapError('Failed to load route');
          }
        }

        // Clear existing markers and zone routes (except main route and user marker)
        mapRef.current.eachLayer((layer: any) => {
          if (
            layer instanceof L.default.Marker &&
            layer !== userMarkerRef.current
          ) {
            mapRef.current?.removeLayer(layer);
          }
        });
        
        // Clear existing zone routes
        zoneRoutesRef.current.forEach((route) => {
          if (mapRef.current) {
            mapRef.current.removeLayer(route);
          }
        });
        zoneRoutesRef.current = [];


        // Add check-in markers (only for admins)
        if (showCheckIns && isAdmin) {
          checkIns.forEach((checkIn) => {
          if (checkIn.entry_latitude && checkIn.entry_longitude) {
            // Entry point (start)
            const entryIcon = L.default.divIcon({
              html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px;">📍</div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.default.marker([checkIn.entry_latitude, checkIn.entry_longitude], { icon: entryIcon })
              .addTo(mapRef.current)
              .bindPopup(`
                <div style="min-width: 200px;">
                  <strong>${checkIn.participants?.first_name} ${checkIn.participants?.last_name}</strong><br/>
                  <span style="color: #666; font-size: 12px;">
                    ${checkIn.participants?.motorcycle_brand} ${checkIn.participants?.motorcycle_model}
                  </span><br/>
                  <span style="color: #10b981; font-weight: bold; font-size: 11px;">📍 Zone Entry</span><br/>
                  <span style="color: #666; font-size: 11px;">
                    ${new Date(checkIn.created_at).toLocaleTimeString()}
                  </span>
                </div>
              `);
          }

          // Answer/submission point (if exists)
          if (checkIn.answer_latitude && checkIn.answer_longitude) {
            const answerIcon = L.default.divIcon({
              html: `<div style="background-color: #f59e0b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px;">✓</div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.default.marker([checkIn.answer_latitude, checkIn.answer_longitude], { icon: answerIcon })
              .addTo(mapRef.current)
              .bindPopup(`
                <div style="min-width: 200px;">
                  <strong>${checkIn.participants?.first_name} ${checkIn.participants?.last_name}</strong><br/>
                  <span style="color: #666; font-size: 12px;">
                    ${checkIn.participants?.motorcycle_brand} ${checkIn.participants?.motorcycle_model}
                  </span><br/>
                  <span style="color: #f59e0b; font-weight: bold; font-size: 11px;">✓ Code Submission</span><br/>
                  <span style="color: #666; font-size: 11px;">
                    ${new Date(checkIn.created_at).toLocaleTimeString()}
                  </span>
                </div>
              `);
          }
          });
        }

        // Add rally zone start markers and load GPX routes
        if (showZoneRoutes) {
          // Process all zones
          await Promise.all(rallyZones.map(async (zone) => {
            // Load zone GPX route if available
            if (zone.gpxRoute?.asset?.url) {
              try {
                const response = await fetch(zone.gpxRoute.asset.url);
                const gpxText = await response.text();
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
                
                const trackPoints: [number, number][] = [];
                const trkpts = gpxDoc.querySelectorAll('trkpt');
                
                trkpts.forEach((pt) => {
                  const lat = parseFloat(pt.getAttribute('lat') || '0');
                  const lon = parseFloat(pt.getAttribute('lon') || '0');
                  if (lat && lon) {
                    trackPoints.push([lat, lon]);
                  }
                });

                if (trackPoints.length > 0) {
                  // Get zone color for the route
                  const colorMap: Record<string, string> = {
                    green: '#15803d',
                    yellow: '#a16207',
                    orange: '#c2410c',
                    red: '#b91c1c',
                  };
                  const zoneColor = colorMap[zone.color] || '#4F46E5';

                  // Add zone route with dashed line
                  const routePolyline = L.default.polyline(trackPoints, {
                    color: zoneColor,
                    weight: 3,
                    opacity: 0.5,
                  }).addTo(mapRef.current);
                  
                  // Store reference to clean up later
                  zoneRoutesRef.current.push(routePolyline);
                }
              } catch (err) {
                console.error('Error loading GPX for zone:', zone.title, err);
              }
            }
          }));

          // Add start markers for all zones
          rallyZones.forEach((zone) => {
            // Skip zones without start location
            if (!zone.startLocation) {
              console.warn('⚠️ Zone missing startLocation:', zone.title);
              return;
            }

            const colorMap: Record<string, string> = {
              green: '#15803d',
              yellow: '#a16207',
              orange: '#c2410c',
              red: '#b91c1c',
            };
            const color = colorMap[zone.color] || '#4F46E5';

            // Start point marker only
            const startIcon = L.default.divIcon({
              html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">S</div>`,
              className: '',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            const statusBadge = zone.is_open 
              ? '<span style="color: #22c55e; font-weight: bold;">✓ Open</span>'
              : '<span style="color: #ef4444; font-weight: bold;">✗ Closed</span>';

            L.default.marker([zone.startLocation.lat, zone.startLocation.lng], { icon: startIcon })
              .addTo(mapRef.current)
              .bindPopup(`
                <div style="min-width: 200px;">
                  <strong style="font-size: 16px;">${zone.title}</strong><br/>
                  <span style="color: #666; font-size: 13px;">${zone.location}</span><br/>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    ${statusBadge}
                  </div>
                  <div style="margin-top: 4px; color: #666; font-size: 12px;">
                    📍 Start Point
                  </div>
                </div>
              `);

            // Add end point marker only for admins
            if (isAdmin && zone.endLocation) {
              const endIcon = L.default.divIcon({
                html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">E</div>`,
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              });

              L.default.marker([zone.endLocation.lat, zone.endLocation.lng], { icon: endIcon })
                .addTo(mapRef.current)
                .bindPopup(`
                  <div style="min-width: 200px;">
                    <strong style="font-size: 16px;">${zone.title}</strong><br/>
                    <span style="color: #666; font-size: 13px;">${zone.location}</span><br/>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                      ${statusBadge}
                    </div>
                    <div style="margin-top: 4px; color: #666; font-size: 12px;">
                      🏁 End Point
                    </div>
                  </div>
                `);
            }

            // Add checkpoint markers only for admins
            if (isAdmin && zone.checkpoints && zone.checkpoints.length > 0) {
              zone.checkpoints.forEach((checkpoint, index) => {
                if (checkpoint.location && checkpoint.location.lat && checkpoint.location.lng) {
                  const checkpointIcon = L.default.divIcon({
                    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: bold;">${index + 1}</div>`,
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  });

                  L.default.marker([checkpoint.location.lat, checkpoint.location.lng], { icon: checkpointIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`
                      <div style="min-width: 200px;">
                        <strong style="font-size: 14px;">${checkpoint.name}</strong><br/>
                        <span style="color: #666; font-size: 12px;">${zone.title}</span><br/>
                        <div style="margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 4px;">
                          <div style="font-size: 12px; color: #374151; margin-bottom: 4px;">
                            ${checkpoint.description}
                          </div>
                          <div style="font-size: 11px; color: #6b7280; font-style: italic;">
                            💡 ${checkpoint.codeHint}
                          </div>
                        </div>
                      </div>
                    `);
                }
              });
            }
          });
        } // Close showZoneRoutes conditional

        // Add event markers
        if (showEventMarkers) {
        eventMarkers.forEach((marker) => {
          const severityColors: Record<string, string> = {
            low: '#4F46E5',
            medium: '#f59e0b',
            high: '#f97316',
            critical: '#dc2626',
          };
          const color = severityColors[marker.severity] || '#6b7280';
          const icon = getEventTypeIcon(marker.type, 'white');

          const eventIcon = L.default.divIcon({
            html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">${icon.svg}</div>`,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const severityLabel = getSeverityLabel(marker.severity);
          const timeAgo = getTimeAgo(new Date(marker.createdAt));

          L.default.marker([marker.location.lat, marker.location.lng], { icon: eventIcon })
            .addTo(mapRef.current)
            .bindPopup(`
              <div style="min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="width: 32px; height: 32px; background-color: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${icon.svg}</div>
                  <strong style="font-size: 16px;">${marker.title}</strong>
                </div>
                <p style="margin: 8px 0; color: #374151;">${marker.description}</p>
                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                    <span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-weight: bold;">${severityLabel}</span>
                    <span style="color: #6b7280;">⏰ ${timeAgo}</span>
                  </div>
                </div>
              </div>
            `);
        });
        } // Close showEventMarkers conditional

        // Update user location marker
        if (userLocation) {
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
          } else {
            const userIcon = L.default.divIcon({
              html: '<div style="background-color: #9333ea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; background-color: #22c55e; border-radius: 50%; border: 2px solid white;"></div></div>',
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            userMarkerRef.current = L.default.marker([userLocation.lat, userLocation.lng], {
              icon: userIcon,
            })
              .addTo(mapRef.current)
              .bindPopup('<strong>Your Location</strong><br/>Live tracking active');
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
      }
    });
  }, [isClient, rallyZones, eventMarkers, gpxRouteUrl, userLocation, showCheckIns, showZoneRoutes, showEventMarkers, isAdmin]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold">❌ {mapError}</p>
          <p className="text-gray-600 text-sm mt-2">Please refresh the page</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-full" />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
          z-index: 1 !important;
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
      `}</style>
    </>
  );
}

function getEventTypeIcon(type: string, color: string): { svg: string; label: string } {
  const iconMap: Record<string, { svg: string; label: string }> = {
    closure: {
      label: 'Wegafsluiting',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="16" height="12" fill="none" stroke="${color}" stroke-width="2" rx="2"/>
        <line x1="4" y1="10" x2="20" y2="10" stroke="${color}" stroke-width="2"/>
        <line x1="10" y1="6" x2="10" y2="18" stroke="${color}" stroke-width="2"/>
        <line x1="14" y1="6" x2="14" y2="18" stroke="${color}" stroke-width="2"/>
      </svg>`,
    },
    accident: {
      label: 'Ongeval',
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
      label: 'Overstroomde Weg',
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 16 Q6 12 9 16 Q12 12 15 16 Q18 12 21 16" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <path d="M3 11 Q6 7 9 11 Q12 7 15 11 Q18 7 21 11" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <rect x="2" y="18" width="20" height="3" fill="${color}" opacity="0.5"/>
      </svg>`,
    },
    warning: {
      label: 'Waarschuwing',
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
    label: 'Markering',
    svg: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 C7 2 3 6 3 11 C3 17 12 22 12 22 C12 22 21 17 21 11 C21 6 17 2 12 2 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="12" cy="11" r="3" fill="${color}"/>
    </svg>`,
  };
  
  return iconMap[type] || defaultIcon;
}

function getSeverityLabel(severity: string): string {
  const severityMap: Record<string, string> = {
    low: 'Laag',
    medium: 'Gemiddeld',
    high: 'Hoog',
    critical: 'Kritiek',
  };
  return severityMap[severity] || severity.charAt(0).toUpperCase() + severity.slice(1);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return 'Net';
  if (minutes < 60) return `${minutes}m geleden`;
  if (hours < 24) return `${hours}u geleden`;
  return date.toLocaleDateString();
}
