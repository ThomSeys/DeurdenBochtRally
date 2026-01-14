import { useEffect, useRef, useState } from 'react';

interface MapViewProps {
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  className?: string;
}

export default function MapView({ startPoint, endPoint, className = '' }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      // Initialize map
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = L.default.map(mapContainerRef.current).setView(
          [startPoint.lat, startPoint.lng],
          13
        );

        // Add OpenStreetMap tiles (free and open-source)
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
        html: '<div style="background-color: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">🏁</div>',
        className: '',
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
          .bindPopup('<strong>Eind punt</strong><br/>Voeg hier terug op de hoofdroute');
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

      // Draw a line between start and end (only if endPoint exists)
      if (endPoint) {
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

      // Fit bounds to show both markers
      const bounds = endPoint
        ? L.default.latLngBounds([
            [startPoint.lat, startPoint.lng],
            [endPoint.lat, endPoint.lng],
          ])
        : L.default.latLngBounds([[startPoint.lat, startPoint.lng]]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    });

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, [isClient, startPoint, endPoint, userLocation]);

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

  return <div ref={mapContainerRef} className={className} />;
}
