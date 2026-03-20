import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface MapViewProps {
  startPoint?: { lat: number; lng: number; name?: string };
  endPoint?: { lat: number; lng: number; name?: string };
  markers?: Array<{ lat: number; lng: number; name: string; color?: string; icon?: string }>;
  className?: string;
  skipGpxUrl?: string | null;
}

export default function MapView({ startPoint, endPoint, markers = [], className = '', skipGpxUrl = null }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Locking is handled internally for MapView components
  const [locked, setLocked] = useState<boolean>(true);
  const effectiveInteractive = !locked;

  console.log('[MapView] Rendering with:', { startPoint, endPoint, className });

  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get user's location
  useEffect(() => {
    if (!isClient) return;

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
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || !startPoint) return;

    console.log('[MapView] Initializing map with startPoint:', startPoint);

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      console.log('[MapView] Leaflet loaded');
      // Initialize map
      if (!mapRef.current && mapContainerRef.current) {
        console.log('[MapView] Creating new map instance');
        mapRef.current = L.default.map(mapContainerRef.current, {
          dragging: effectiveInteractive,
          scrollWheelZoom: effectiveInteractive,
          doubleClickZoom: effectiveInteractive,
          boxZoom: effectiveInteractive,
          touchZoom: effectiveInteractive,
          keyboard: effectiveInteractive,
        }).setView([startPoint.lat, startPoint.lng], 13);

        // Add CartoDB Voyager tiles (balanced light/dark theme)
        L.default.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      if (!mapRef.current) return;

      // Fix map size issues when container becomes visible
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);

      // Clear existing markers (except user marker)
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.default.Marker && layer !== userMarkerRef.current) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Create custom icons
      const startIcon = L.default.divIcon({
        html: '<div class="zone-start-icon" style="background-color: #10B981 !important; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">🏁</div>',
        className: 'zone-start-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const endIcon = L.default.divIcon({
        html: '<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">🏁</div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Add markers
      L.default.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
        .addTo(mapRef.current)
        .bindPopup('<strong>Start punt</strong><br/>Verlaat hier de hoofdroute');

      if (endPoint) {
        L.default.marker([endPoint.lat, endPoint.lng], { icon: endIcon })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${endPoint.name || 'Eind punt'}</strong><br/>Voeg hier terug op de hoofdroute`);
      }

      // Add custom markers
      if (markers && markers.length > 0) {
        markers.forEach((marker) => {
          const customIcon = L.default.divIcon({
            html: `<div style="background-color: ${marker.color || '#3b82f6'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">${marker.icon || '📍'}</div>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          L.default.marker([marker.lat, marker.lng], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(`<strong>${marker.name}</strong>`);
        });
      }

      // Add user location marker if available
      if (userLocation) {
        if (userMarkerRef.current) {
          mapRef.current.removeLayer(userMarkerRef.current);
        }

        const userIcon = L.default.divIcon({
          html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        userMarkerRef.current = L.default.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup('<strong>Je locatie</strong>');
      }

      // Draw a line between start and end (only if endPoint exists, no custom markers
      // and no skip GPX is provided — when a skip GPX exists we prefer rendering that)
      if (endPoint && (!markers || markers.length === 0) && !skipGpxUrl) {
        L.default.polyline(
          [
            [startPoint.lat, startPoint.lng],
            [endPoint.lat, endPoint.lng],
          ],
          {
            color: '#0d9488',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 5',
          }
        ).addTo(mapRef.current);
      }

      // If a skip GPX is provided, load and render it as a dashed gray polyline
      if (skipGpxUrl) {
        try {
          fetch(skipGpxUrl)
            .then((res) => res.text())
            .then((gpxText) => {
              const parser = new DOMParser();
              const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
              const trackPoints: [number, number][] = [];
              const trkpts = gpxDoc.querySelectorAll('trkpt');
              trkpts.forEach((pt) => {
                const lat = parseFloat(pt.getAttribute('lat') || '0');
                const lon = parseFloat(pt.getAttribute('lon') || '0');
                if (lat && lon) trackPoints.push([lat, lon]);
              });
              if (trackPoints.length > 0 && mapRef.current) {
                const skipPolyline = L.default.polyline(trackPoints, {
                  color: '#6b7280',
                  weight: 3,
                  opacity: 0.8,
                  dashArray: '8,6',
                }).addTo(mapRef.current);
                try {
                  mapRef.current.fitBounds(skipPolyline.getBounds(), { padding: [50, 50] });
                } catch (e) {}
              }
            })
            .catch((err) => console.error('Failed to load skip GPX:', err));
        } catch (err) {
          console.error('Error loading skip GPX:', err);
        }
      }

      // Fit bounds to show all markers
      const allPoints: Array<[number, number]> = [];
      if (startPoint) allPoints.push([startPoint.lat, startPoint.lng]);
      if (endPoint) allPoints.push([endPoint.lat, endPoint.lng]);
      if (markers) {
        markers.forEach(m => allPoints.push([m.lat, m.lng]));
      }

      if (allPoints.length > 0) {
        const bounds = L.default.latLngBounds(allPoints);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, [isClient, startPoint, endPoint, userLocation, markers, skipGpxUrl, effectiveInteractive]);

  // Toggle map handlers when effectiveInteractive changes
  useEffect(() => {
    if (!isClient || !mapRef.current) return;
    try {
      const map = mapRef.current;
      if (map.dragging) {
        effectiveInteractive ? map.dragging.enable() : map.dragging.disable();
      }
      if (map.scrollWheelZoom) {
        effectiveInteractive ? map.scrollWheelZoom.enable() : map.scrollWheelZoom.disable();
      }
      if (map.touchZoom) {
        effectiveInteractive ? map.touchZoom.enable() : map.touchZoom.disable();
      }
      if (map.doubleClickZoom) {
        effectiveInteractive ? map.doubleClickZoom.enable() : map.doubleClickZoom.disable();
      }
      if (map.boxZoom) {
        effectiveInteractive ? map.boxZoom.enable() : map.boxZoom.disable();
      }
      if (map.keyboard && map.keyboard.enable) {
        effectiveInteractive ? map.keyboard.enable() : map.keyboard.disable();
      }
    } catch (err) {
      // ignore
    }
  }, [effectiveInteractive, isClient]);

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 rounded-sm flex items-center justify-center text-gray-500`}>
        <p className="text-sm">Kaart wordt geladen...</p>
      </div>
    );
  }

  if (!startPoint) {
    return (
      <div className={`${className} bg-gray-100 rounded-sm flex items-center justify-center text-gray-500`}>
        <p className="text-sm">Geen kaart beschikbaar</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      <button
        onClick={(e) => { e.stopPropagation(); setLocked((v) => !v); }}
        title={locked ? 'Ontgrendel kaart' : 'Vergrendel kaart'}
        className="absolute top-3 right-3 z-[1000] bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-md border border-gray-100"
        aria-pressed={!locked}
      >
        <Icon name={locked ? 'lock' : 'eye'} className="w-5 h-5" />
      </button>
    </div>
  );
}
