import { useEffect, useRef, useState } from 'react';

interface RallyZone {
  _id: string;
  title: string;
  location: string;
  color: string;
  startLocation: { lat: number; lng: number; label?: string };
  endLocation: { lat: number; lng: number; label?: string };
  is_open: boolean;
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
  gpxContent?: string | null;
  checkIns?: CheckIn[];
  showCheckIns?: boolean;
  showZoneRoutes?: boolean;
  showEventMarkers?: boolean;
}

export default function LiveEventMap({ rallyZones, eventMarkers, gpxContent, checkIns = [], showCheckIns = true, showZoneRoutes = true, showEventMarkers = true }: LiveEventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const gpxLayerRef = useRef<any>(null);
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

          // Add OpenStreetMap tiles
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
        if (gpxContent && !gpxLayerRef.current) {
          try {
            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(gpxContent, 'text/xml');
            
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

        // Load individual zone GPX routes
        rallyZones.forEach(async (zone) => {
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
                  green: '#22c55e',
                  yellow: '#eab308',
                  orange: '#f97316',
                  red: '#ef4444',
                };
                const zoneColor = colorMap[zone.color] || '#4F46E5';

                // Add zone route with dashed line
                L.default.polyline(trackPoints, {
                  color: zoneColor,
                  weight: 3,
                  opacity: 0.5,
                  dashArray: '5, 5',
                }).addTo(mapRef.current);
              }
            } catch (error) {
              console.error(`Error loading GPX for zone ${zone.title}:`, error);
            }
          }
        });

        // Clear existing markers (except route and user marker)
        mapRef.current.eachLayer((layer: any) => {
          if (
            layer instanceof L.default.Marker &&
            layer !== userMarkerRef.current
          ) {
            mapRef.current?.removeLayer(layer);
          }
        });


        // Add check-in markers
        if (showCheckIns) {
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

        // Add rally zone markers
        if (showZoneRoutes) {
          rallyZones.forEach((zone) => {
            // Skip zones without coordinates
            if (!zone.startLocation || !zone.endLocation) {
              console.warn(`Zone ${zone.title} missing startLocation or endLocation`);
              return;
            }

            const colorMap: Record<string, string> = {
              green: '#22c55e',
              yellow: '#eab308',
              orange: '#f97316',
              red: '#ef4444',
            };
            const color = colorMap[zone.color] || '#4F46E5';

          // Start point marker
          const startIcon = L.default.divIcon({
            html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">S</div>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          // End point marker
          const endIcon = L.default.divIcon({
            html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">E</div>`,
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

          // Draw line between start and end
          L.default.polyline(
            [
              [zone.startLocation.lat, zone.startLocation.lng],
              [zone.endLocation.lat, zone.endLocation.lng],
            ],
            {
              color: color,
              weight: 3,
              opacity: 0.5,
              dashArray: '10, 10',
            }
          ).addTo(mapRef.current);
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
          const emoji = getEventTypeEmoji(marker.type);

          const eventIcon = L.default.divIcon({
            html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; animation: pulse 2s infinite;">${emoji}</div>`,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const severityLabel = marker.severity.toUpperCase();
          const timeAgo = getTimeAgo(new Date(marker.createdAt));

          L.default.marker([marker.location.lat, marker.location.lng], { icon: eventIcon })
            .addTo(mapRef.current)
            .bindPopup(`
              <div style="min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 24px;">${emoji}</span>
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
  }, [isClient, rallyZones, eventMarkers, gpxContent, userLocation, showCheckIns, showZoneRoutes, showEventMarkers]);

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

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
