import { useEffect, useRef, useState } from 'react';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ initialLat = 51.0967, initialLng = 3.4400, onLocationChange }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      // Initialize map
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = L.default.map(mapContainerRef.current).setView(
          [initialLat, initialLng],
          13
        );

        // Add CartoDB Voyager tiles (balanced light/dark theme)
        L.default.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Create draggable marker
        const customIcon = L.default.divIcon({
          html: `<div style="background-color: #dc2626; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: 'custom-location-marker'
        });

        markerRef.current = L.default.marker([initialLat, initialLng], {
          draggable: true,
          icon: customIcon
        }).addTo(mapRef.current);

        // Update coordinates when marker is dragged
        markerRef.current.on('dragend', function() {
          const position = markerRef.current.getLatLng();
          onLocationChange(position.lat, position.lng);
        });

        // Allow clicking on map to move marker
        mapRef.current.on('click', function(e: any) {
          const { lat, lng } = e.latlng;
          markerRef.current.setLatLng([lat, lng]);
          onLocationChange(lat, lng);
        });
      }
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when initialLat/initialLng changes
  useEffect(() => {
    if (markerRef.current && (initialLat !== 51.0967 || initialLng !== 3.4400)) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      if (mapRef.current) {
        mapRef.current.setView([initialLat, initialLng], 13);
      }
    }
  }, [initialLat, initialLng]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Locatie op Kaart
      </label>
      <div 
        ref={mapContainerRef} 
        className="h-[400px] rounded-sm border border-gray-300 bg-gray-100"
        style={{ zIndex: 0 }}
      />
      <p className="text-xs text-gray-500">
        Sleep de pin of klik op de kaart om de exacte locatie te bepalen
      </p>
    </div>
  );
}
