import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { DEFAULT_ROUTE_COLORS } from '~/lib/constants';

interface RouteLocation {
  name?: string;
  coordinates: { lat: number; lng: number };
  type?: string;
}

interface RouteTip {
  name: string;
  locations?: RouteLocation[];
  color?: string;
}

interface Props {
  tip: RouteTip;
  zoneTitle?: string;
  zoneStartLocation?: { lat: number; lng: number } | null;
  zoneEndLocation?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  onClose?: () => void;
}

export default function RouteNavigationModal({ tip, zoneTitle, zoneStartLocation, zoneEndLocation, userLocation, onClose }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Array<any>>([]);

  // Build ordered waypoints: optionally include zone start, tip locations, zone end
  const buildWaypoints = () => {
    const pts: Array<{ lat: number; lng: number; name?: string }> = [];
    if (zoneStartLocation && zoneStartLocation.lat && zoneStartLocation.lng) {
      pts.push({ lat: zoneStartLocation.lat, lng: zoneStartLocation.lng, name: 'Start' });
    }
    (tip.locations || []).forEach((loc) => {
      if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
        pts.push({ lat: loc.coordinates.lat, lng: loc.coordinates.lng, name: loc.name || '' });
      }
    });
    if (zoneEndLocation && zoneEndLocation.lat && zoneEndLocation.lng) {
      pts.push({ lat: zoneEndLocation.lat, lng: zoneEndLocation.lng, name: 'Einde' });
    }
    return pts;
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let L: any;
    (async () => {
      setLoading(true);
      try {
        L = (await import('leaflet')).default;

        // init map
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = L.map(mapContainerRef.current, { zoomControl: true, attributionControl: false }).setView([51.0, 3.0], 10);
          const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(mapRef.current);
          // ensure rotation origin is center
          const container = mapRef.current.getContainer();
          container.style.transformOrigin = '50% 50%';
        }

        const waypoints = buildWaypoints();
        // add waypoint markers (styled similar to existing maps)
        waypointMarkersRef.current.forEach((m) => m.remove());
        waypointMarkersRef.current = [];
        const TEAL = DEFAULT_ROUTE_COLORS[6] || '#14B8A6';
        const defaultColor = tip.color || TEAL;
        waypoints.forEach((w, idx) => {
          const svgIcon = '<svg viewBox="0 0 24 24" fill="white" style="width: 14px; height: 14px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
            const iconHtml = `
              <div class="route-tip-marker" style="background-color: ${defaultColor}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">${svgIcon}</div>
            `;
          const divIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });
          const marker = L.marker([w.lat, w.lng], { icon: divIcon, title: w.name || `WP ${idx + 1}` }).addTo(mapRef.current);
          marker.bindPopup(`<strong>${w.name || 'Waypoint'}</strong>`);
          waypointMarkersRef.current.push(marker);
        });

        if (waypoints.length === 0) {
          setError('Geen punten om route van te maken');
          setLoading(false);
          return;
        }

        // Build OSRM coords string (lon,lat;lon,lat...)
        const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Routing API fout');
        const data = await res.json();
        if (!data.routes || data.routes.length === 0) {
          throw new Error('Geen route gevonden');
        }

        const route = data.routes[0];
        const geometry = route.geometry; // GeoJSON LineString
        const latlngs = geometry.coordinates.map((c: any) => [c[1], c[0]]);

        // draw polyline
        if (routeLayerRef.current) {
          mapRef.current.removeLayer(routeLayerRef.current);
        }
        // ensure polyline uses teal color; add class for extra CSS specificity if needed
        routeLayerRef.current = L.polyline(latlngs, { color: defaultColor, weight: 5, opacity: 0.95, className: 'route-teal' }).addTo(mapRef.current);
        mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });

        // watch user location and make the map follow + rotate so travel direction is up
        if ('geolocation' in navigator && mapRef.current) {
          let prevPos: { lat: number; lng: number } | null = null;
          const computeBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const toDeg = (r: number) => (r * 180) / Math.PI;
            const φ1 = toRad(lat1);
            const φ2 = toRad(lat2);
            const Δλ = toRad(lon2 - lon1);
            const y = Math.sin(Δλ) * Math.cos(φ2);
            const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
            let θ = Math.atan2(y, x);
            θ = toDeg(θ);
            return (θ + 360) % 360;
          };

          // no map rotation: keep map north-up; we'll rotate only the user marker element to indicate heading

          const updatePos = async (lat: number, lng: number, heading?: number) => {
            setUserPos({ lat, lng, heading });
            try {
              const L = (await import('leaflet')).default;
              const headingDeg = heading || 0;
              // create marker if missing
              if (!userMarkerRef.current) {
                const arrowSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6"/><path d="M5 12l7-7 7 7"/></svg>';
                const html = `<div class="user-location-marker" style="background:${TEAL}; width:34px; height:34px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(20,136,166,0.25); transform: rotate(${headingDeg}deg);">${arrowSvg}</div>`;
                const divIcon = L.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });
                userMarkerRef.current = L.marker([lat, lng], { icon: divIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
                userMarkerRef.current.bindPopup('Jouw locatie');
                // ensure the icon element has rotation applied
                try { const el = userMarkerRef.current._icon as HTMLElement | undefined; if (el) el.style.transform = `rotate(${headingDeg}deg)`; } catch (e) {}
              } else {
                userMarkerRef.current.setLatLng([lat, lng]);
                try { const el = userMarkerRef.current._icon as HTMLElement | undefined; if (el) el.style.transform = `rotate(${headingDeg}deg)`; } catch (e) {}
              }
            } catch (e) { console.warn('user marker error', e); }
          };

          const success = (p: GeolocationPosition) => {
            const lat = p.coords.latitude;
            const lng = p.coords.longitude;
            let bearing: number | undefined = undefined;
            if (typeof p.coords.heading === 'number' && !isNaN(p.coords.heading)) bearing = p.coords.heading;
            if (!bearing && prevPos) bearing = computeBearing(prevPos.lat, prevPos.lng, lat, lng);
            prevPos = { lat, lng };
            // move map center to user
            try { mapRef.current.setView([lat, lng], mapRef.current.getZoom()); } catch (e) {}
            // update/create user marker and set its heading; keep map north-up
            updatePos(lat, lng, bearing);
            // store last heading in state
            setUserPos({ lat, lng, heading: bearing });
          };

          const error = (err: any) => { console.warn('Geolocation error', err); };

          const watchId = navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
          (mapRef.current as any)._routeNavWatchId = watchId;
        }
        // extract steps for display
        const allSteps: any[] = [];
        if (route.legs && Array.isArray(route.legs)) {
          route.legs.forEach((leg: any) => {
            (leg.steps || []).forEach((s: any) => {
              allSteps.push(s);
            });
          });
        }
        setSteps(allSteps);
        setLoading(false);
      } catch (err: any) {
        console.error('RouteNavigationModal error', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    })();

      // inject CSS to ensure markers and route are teal (in case global styles override inline)
      try {
        if (typeof document !== 'undefined' && !document.getElementById('route-navigation-teal-style')) {
          const style = document.createElement('style');
          style.id = 'route-navigation-teal-style';
          style.innerHTML = `
            .route-tip-marker { box-shadow: 0 2px 8px rgba(20,136,166,0.25) !important; }
            .leaflet-overlay-pane path.route-teal, .route-teal { stroke: ${DEFAULT_ROUTE_COLORS[6]} !important; }
          `;
          document.head.appendChild(style);
        }
      } catch (e) {}

    return () => {
      try {
        waypointMarkersRef.current.forEach((m) => m.remove());
        waypointMarkersRef.current = [];
        if (routeLayerRef.current && mapRef.current) {
          mapRef.current.removeLayer(routeLayerRef.current);
        }
        try {
          if ((mapRef.current as any)?._routeNavWatchId != null) {
            navigator.geolocation.clearWatch((mapRef.current as any)._routeNavWatchId);
            (mapRef.current as any)._routeNavWatchId = null;
          }
        } catch (e) {}
        try {
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
          }
        } catch (e) {}
        // (no rotation cleanup needed since map was not rotated)
      } catch (e) {}
    };
  }, [isClient]);

  // (Follow/rotation UI removed per request)

  // simple GPX export helper
  const downloadGPX = () => {
    if (!routeLayerRef.current) return;
    const latlngs = routeLayerRef.current.getLatLngs();
    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="DeurDenBocht">\n<trk><name>${tip.name}</name><trkseg>`;
    const pts = latlngs.map((p: any) => `<trkpt lat="${p.lat}" lon="${p.lng}"></trkpt>`).join('\n');
    const footer = '</trkseg></trk>\n</gpx>';
    const gpx = header + pts + footer;
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(tip.name || 'route').replace(/\s+/g, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInGoogleMaps = () => {
    const waypoints = buildWaypoints();
    if (waypoints.length === 0) return;
    // prefer current user location if available
    const origin = userPos ? `${userPos.lat},${userPos.lng}` : `${waypoints[0].lat},${waypoints[0].lng}`;
    const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
    const via = waypoints.slice(1, -1).map((w) => `${w.lat},${w.lng}`).join('%7C');
    const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${via ? `&waypoints=${via}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-3">
          <Icon name="map" className="w-5 h-5 text-gray-700" />
          <div>
            <div className="font-semibold text-gray-900">{tip.name}</div>
            {zoneTitle && <div className="text-sm text-gray-500">{zoneTitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { downloadGPX(); }} className="px-3 py-1 rounded bg-gray-100">
            <Icon name="download" className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => { openInGoogleMaps(); }} className="px-3 py-1 rounded bg-gray-100" title="Open in Google Maps">
            <Icon name="external-link" className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => { if (onClose) onClose(); /* modal container close handled externally */ }} className="px-3 py-1 rounded bg-gray-100">
            Sluiten
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        <div ref={mapContainerRef} className="w-full md:w-[70%]" style={{ height: '100%' }} />
        <div className="w-full md:w-1/2 border-l overflow-y-auto p-3 h-full">
          <div>
            <h4 className="font-semibold mb-2">Stappen ({steps.length})</h4>
            {loading && <div>Route laden…</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && steps.length === 0 && !error && <div className="text-sm text-gray-500">Geen stap-informatie beschikbaar</div>}
            <ol className="space-y-2 text-sm">
              {steps.map((s, idx) => {
                const mod = s.maneuver?.modifier || '';
                const type = s.maneuver?.type || '';
                const distance = Math.round(s.distance || 0);
                const durationMin = Math.round((s.duration || 0) / 60);

                  const getLabel = () => {
                  // Prefer explicit instruction if available, otherwise map type/modifier
                  if (s.maneuver?.instruction) return s.maneuver.instruction;
                  const modLower = String(mod).toLowerCase();
                  if (modLower.includes('left')) return 'Sla linksaf';
                  if (modLower.includes('right')) return 'Sla rechtsaf';
                  if (modLower.includes('uturn')) return 'Keer om';
                  if (type === 'roundabout' || type === 'rotary') return 'Rond punt';
                  if (type === 'depart') return 'Vertrek';
                  if (type === 'arrive') return 'Bestemming bereikt';
                  return 'Ga rechtdoor';
                };

                const street = s.name ? ` • ${s.name}` : '';

                const getIcon = () => {
                  const dir = (mod || '').toLowerCase();
                  // simple arrow svgs rotated according to modifier
                  const base = (rot = 0) => (`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${rot}deg);"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>`);
                  if (dir.includes('left')) return base(-90);
                  if (dir.includes('right')) return base(90);
                  if (dir.includes('slight left')) return base(-45);
                  if (dir.includes('slight right')) return base(45);
                  if (dir.includes('uturn')) return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21V11H5l7-7 7 7h-4v10"/></svg>';
                  if (type === 'roundabout' || type === 'rotary') return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3.36-6.64"/><path d="M21 3v5h-5"/></svg>';
                  return base(0);
                };

                return (
                  <li key={idx} className="p-2 border rounded flex items-start gap-2">
                    <div className="w-8 flex items-center justify-center text-primary-600" dangerouslySetInnerHTML={{ __html: getIcon() }} />
                    <div className="flex-1">
                      <div className="font-medium">{getLabel()}{street}</div>
                      <div className="text-xs text-gray-500">{distance} m • {durationMin} min</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
