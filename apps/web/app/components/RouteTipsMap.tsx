import { useEffect, useRef, useState } from 'react';

interface RouteTip {
  name: string;
  color?: string;
  locations?: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    type: string;
    description?: string;
  }>;
}

interface RouteTipsMapProps {
  routeTips: RouteTip[];
  zoneTitle?: string;
  zoneStartLocation?: { lat: number; lng: number; name?: string };
  zoneEndLocation?: { lat: number; lng: number; name?: string };
  className?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function RouteTipsMap({ routeTips, zoneTitle, zoneStartLocation, zoneEndLocation, className = '' }: RouteTipsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    // Collect all locations from all route tips
    const allLocations: Array<{
      lat: number;
      lng: number;
      name: string;
      type: string;
      description?: string;
      color: string;
      routeName: string;
    }> = [];

    // Add zone start location
    if (zoneStartLocation && zoneStartLocation.lat && zoneStartLocation.lng) {
      allLocations.push({
        lat: zoneStartLocation.lat,
        lng: zoneStartLocation.lng,
        name: zoneStartLocation.name || 'Start',
        type: 'zone-start',
        description: `Start van ${zoneTitle || 'deze zone'}`,
        color: '#22c55e',
        routeName: 'Rally Zone',
      });
    }

    // Add zone end location
    if (zoneEndLocation && zoneEndLocation.lat && zoneEndLocation.lng) {
      allLocations.push({
        lat: zoneEndLocation.lat,
        lng: zoneEndLocation.lng,
        name: zoneEndLocation.name || 'Einde',
        type: 'zone-end',
        description: `Einde van ${zoneTitle || 'deze zone'}`,
        color: '#ef4444',
        routeName: 'Rally Zone',
      });
    }

    routeTips.forEach((tip, tipIndex) => {
      const color = tip.color || DEFAULT_COLORS[tipIndex % DEFAULT_COLORS.length];
      if (tip.locations && tip.locations.length > 0) {
        tip.locations.forEach((loc) => {
          allLocations.push({
            lat: loc.coordinates.lat,
            lng: loc.coordinates.lng,
            name: loc.name,
            type: loc.type,
            description: loc.description,
            color,
            routeName: tip.name,
          });
        });
      }
    });

    // Don't render map if no locations at all
    if (allLocations.length === 0) {
      console.log('[RouteTipsMap] No locations to display');
      return;
    }

    console.log('[RouteTipsMap] Rendering', allLocations.length, 'locations');

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Initialize map if not already done
      if (!mapRef.current) {
        const centerLat = allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length;
        const centerLng = allLocations.reduce((sum, loc) => sum + loc.lng, 0) / allLocations.length;

        mapRef.current = L.map(mapContainerRef.current!).setView([centerLat, centerLng], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      // Add markers for each location
      allLocations.forEach((loc) => {
        // Custom icon based on type
        // SVG icons for different location types
        const svgIcon = 
          loc.type === 'zone-start' || loc.type === 'zone-end' ? 
            '<svg viewBox="0 0 24 24" fill="white" style="width: 18px; height: 18px;"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>' :
          loc.type === 'highlight' ? 
            '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' :
          loc.type === 'warning' ? 
            '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>' :
          loc.type === 'photo' ? 
            '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>' :
            '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';

        const iconHtml = `
          <div style="
            background-color: ${loc.color};
            width: ${loc.type === 'zone-start' || loc.type === 'zone-end' ? '36px' : '30px'};
            height: ${loc.type === 'zone-start' || loc.type === 'zone-end' ? '36px' : '30px'};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${svgIcon}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [loc.type === 'zone-start' || loc.type === 'zone-end' ? 36 : 30, loc.type === 'zone-start' || loc.type === 'zone-end' ? 36 : 30],
          iconAnchor: [loc.type === 'zone-start' || loc.type === 'zone-end' ? 18 : 15, loc.type === 'zone-start' || loc.type === 'zone-end' ? 18 : 15],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(mapRef.current);

        // Add popup
        const popupContent = `
          <div style="min-width: 150px;">
            <div style="font-weight: bold; color: ${loc.color}; margin-bottom: 4px;">
              ${loc.routeName}
            </div>
            <div style="font-weight: 600; margin-bottom: 2px;">
              ${loc.name}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
              ${loc.type === 'zone-start' ? '🏁 Zone Start' : 
                loc.type === 'zone-end' ? '🏁 Zone Einde' :
                loc.type === 'start' ? 'Start punt' : 
                loc.type === 'end' ? 'Eind punt' : 
                loc.type === 'highlight' ? 'Highlight' : 
                loc.type === 'warning' ? 'Waarschuwing' : 
                loc.type === 'photo' ? 'Foto Spot' : 
                'Waypoint'}
            </div>
            ${loc.description ? `<div style="font-size: 12px; margin-top: 4px;">${loc.description}</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      if (allLocations.length > 0) {
        const bounds = L.latLngBounds(allLocations.map((loc) => [loc.lat, loc.lng]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    return () => {
      if (mapRef.current) {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
      }
    };
  }, [isClient, routeTips, zoneStartLocation, zoneEndLocation, zoneTitle]);

  if (!isClient) {
    return <div className={`bg-gray-200 rounded-lg ${className}`} style={{ height: '400px' }} />;
  }

  return (
    <div 
      ref={mapContainerRef} 
      className={`rounded-lg shadow-lg ${className}`} 
      style={{ height: '400px', width: '100%' }} 
    />
  );
}
