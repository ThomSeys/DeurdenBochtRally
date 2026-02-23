import { useEffect, useRef, useState } from 'react';
import { useModal } from '~/contexts/ModalContext';
import { Icon } from '~/components/Icon';
import { Lightbox } from '~/components/Lightbox';

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
  skipRoute?: {
    instructions?: string;
    estimatedDistance?: number;
    startPoint?: { lat?: number; lng?: number };
    endPoint?: { lat?: number; lng?: number };
    gpxFile?: { asset?: { url?: string } } | null;
  };
  routeTips?: Array<{
    name: string;
    color?: string;
    locations?: Array<{
      _key?: string;
      name: string;
      coordinates: { lat: number; lng: number };
      type: string;
      description?: string;
    }>;
  }>;
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
  id: string;
  participant_id: string;
  zone_id: string;
  location_lat: number | null;
  location_lng: number | null;
  checked_in_at: string;
  participants?: {
    first_name: string;
    last_name: string;
    motorcycle_brand: string;
    motorcycle_model: string;
  };
}

interface RouteTipSubmission {
  id: string;
  participant_id: string;
  zone_id: string;
  location_key: string;
  challenge_type: string;
  text_answer: string | null;
  photo_url: string | null;
  submitted_at: string | null;
  is_correct: boolean | null;
  is_validated: boolean | null;
  points_awarded: number | null;
  participants?: {
    first_name?: string | null;
    last_name?: string | null;
    profile_photo_url?: string | null;
  };
  challenge_photo?: {
    id: string;
    like_count: number | null;
    photo_tags?: Array<{
      participant_id: string;
      participant?: {
        id: string;
        first_name: string;
        last_name: string;
      };
    }>;
  } | null;
}

interface BuddyOption {
  id: string;
  first_name: string;
  last_name: string;
}

interface LiveEventMapProps {
  rallyZones: RallyZone[];
  eventMarkers: EventMarker[];
  emergencyAlerts?: any[];
  gpxRouteUrl?: string;
  checkIns?: CheckIn[];
  routeTipSubmissions?: RouteTipSubmission[];
  buddyList?: BuddyOption[];
  likedPhotoIds?: string[];
  liveLocations?: any[];
  currentUserId?: string;
  showCheckIns?: boolean;
  showZoneRoutes?: boolean;
  showEventMarkers?: boolean;
  showEmergencyAlerts?: boolean;
  isAdmin?: boolean;
  allowPublicCheckIns?: boolean;
  enableUserLocation?: boolean;
  showLiveLocations?: boolean;
  focusLocation?: { lat: number; lng: number } | null;
  
}

export default function LiveEventMap({
  rallyZones,
  eventMarkers,
  emergencyAlerts = [],
  gpxRouteUrl,
  checkIns = [],
  routeTipSubmissions = [],
  buddyList = [],
  likedPhotoIds = [],
  liveLocations = [],
  currentUserId,
  showCheckIns = true,
  showZoneRoutes = true,
  showEventMarkers = true,
  showEmergencyAlerts = true,
  isAdmin = false,
  allowPublicCheckIns = false,
  enableUserLocation = true,
  focusLocation = null,
  showLiveLocations = false,
}: LiveEventMapProps) {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const gpxLayerRef = useRef<any>(null);
  const zoneRoutesRef = useRef<any[]>([]);
  const liveMarkersRef = useRef<Record<string, any>>({});
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const { openModal, closeModal } = useModal();

  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('[data-photo-id]') as HTMLElement | null;
      if (!button) return;

      const photoId = button.getAttribute('data-photo-id');
      if (!photoId) return;

      const submission = routeTipSubmissions.find(
        (item) => item.challenge_photo?.id === photoId
      );

      if (!submission || !submission.photo_url) return;

      event.preventDefault();

      const photoUrl = submission.photo_url;
      const firstName = submission.participants?.first_name || '';
      const lastName = submission.participants?.last_name || '';
      const participantName = (firstName || lastName)
        ? `${firstName} ${lastName}`.trim()
        : 'Onbekende deelnemer';
      const title = submission.participant_id === currentUserId ? 'Jij' : participantName;
      const initialTags = submission.challenge_photo?.photo_tags || [];
      const initialLikeCount = submission.challenge_photo?.like_count || 0;
      const initialLiked = likedPhotoIds.includes(photoId);
      const participantPhoto = submission.participants?.profile_photo_url;
      const submittedAt = submission.submitted_at;
      const zoneId = submission.zone_id;

      let modalId = "";
      modalId = openModal({
        variant: "lightbox",
        content: (
          <PhotoInteractionModal
            photoId={photoId}
            photoUrl={photoUrl}
            title={title}
            participantName={participantName}
            participantPhoto={participantPhoto ?? undefined}
            submittedAt={submittedAt ?? undefined}
            zoneId={zoneId}
            initialLikeCount={initialLikeCount}
            initialLiked={initialLiked}
            initialTags={initialTags}
            buddies={buddyList}
            onClose={() => closeModal(modalId)}
          />
        ),
      });
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [openModal, routeTipSubmissions, buddyList, likedPhotoIds, currentUserId]);

  // Get user's location and track it
  useEffect(() => {
    if (!isClient || !enableUserLocation) return;

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
          // Use focusLocation if available, otherwise default center (Belgium, Aalter area)
          const defaultCenter: [number, number] = [51.0967, 3.4400];
          const center: [number, number] = focusLocation 
            ? [focusLocation.lat, focusLocation.lng] 
            : defaultCenter;
          
          mapRef.current = L.default.map(mapContainerRef.current).setView(center, 13);

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

              // Fit map to route bounds only if no focus location is set
              if (!focusLocation) {
                mapRef.current.fitBounds(gpxLayerRef.current.getBounds(), { padding: [50, 50] });
              }
            }
          } catch (error) {
            console.error('Error loading GPX route:', error);
            setMapError('Failed to load route');
          }
        }

        // Clear existing markers and zone routes (except main route, user marker and live-tracking markers)
        mapRef.current.eachLayer((layer: any) => {
          if (
            layer instanceof L.default.Marker &&
            layer !== userMarkerRef.current &&
            // skip markers created for live-tracking (they have _isLiveMarker flag)
            !(layer as any)?._isLiveMarker
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

        // Skip: hazepads are rendered per-zone from rallyZone.skipRoute


        // Add check-in markers (admins or explicitly allowed public view)
        if (showCheckIns && (isAdmin || allowPublicCheckIns)) {
          checkIns.forEach((checkIn) => {
          if (checkIn.location_lat && checkIn.location_lng) {
            // Zone check-in marker
            const checkInIcon = L.default.divIcon({
              html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.default.marker([checkIn.location_lat, checkIn.location_lng], { icon: checkInIcon })
              .addTo(mapRef.current)
              .bindPopup(`
                <div style="min-width: 200px;">
                  <strong>${checkIn.participants?.first_name} ${checkIn.participants?.last_name}</strong><br/>
                  <span style="color: #666; font-size: 12px;">
                    ${checkIn.participants?.motorcycle_brand} ${checkIn.participants?.motorcycle_model}
                  </span><br/>
                  <span style="color: #10b981; font-weight: bold; font-size: 11px;">Zone Check-in</span><br/>
                  <span style="color: #666; font-size: 11px;">
                    ${new Date(checkIn.checked_in_at).toLocaleTimeString()}
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
            // If the zone defines a skipRoute GPX (hazepad), render it for admins with dashed red styling
            if (isAdmin && zone.skipRoute?.gpxFile?.asset?.url) {
              try {
                const response = await fetch(zone.skipRoute.gpxFile.asset.url);
                const gpxText = await response.text();
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxText, 'text/xml');

                const skipPoints: [number, number][] = [];
                const skipTrkpts = gpxDoc.querySelectorAll('trkpt');
                skipTrkpts.forEach((pt) => {
                  const lat = parseFloat(pt.getAttribute('lat') || '0');
                  const lon = parseFloat(pt.getAttribute('lon') || '0');
                  if (lat && lon) skipPoints.push([lat, lon]);
                });

                if (skipPoints.length > 0) {
                  const skipPoly = L.default.polyline(skipPoints, {
                    color: '#ef4444',
                    weight: 3,
                    opacity: 0.85,
                    dashArray: '8 6',
                  }).addTo(mapRef.current);
                  zoneRoutesRef.current.push(skipPoly);
                }
              } catch (err) {
                console.error('Error loading skipRoute GPX for zone:', zone.title, err);
              }
            }
          }));

          // Add start markers for all zones
          rallyZones.forEach((zone) => {
            // Skip zones without start location or invalid coordinates
            if (!zone.startLocation || !zone.startLocation.lat || !zone.startLocation.lng) {
              console.warn('⚠️ Zone missing startLocation or coordinates:', zone.title, zone.startLocation);
              return;
            }

            const colorMap: Record<string, string> = {
              green: '#15803d',
              yellow: '#a16207',
              orange: '#c2410c',
              red: '#b91c1c',
            };
            const color = colorMap[zone.color] || '#4F46E5';

            // Start point marker - always visible, green background with flag SVG
            const flagSvg = '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>';
            const startIcon = L.default.divIcon({
              html: `<div style="background-color: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">${flagSvg}</div>`,
              className: '',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
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
                    Zone Start
                  </div>
                </div>
              `);

            // End point marker - always visible, red background with flag SVG
            if (zone.endLocation && zone.endLocation.lat && zone.endLocation.lng) {
              const endIcon = L.default.divIcon({
                html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">${flagSvg}</div>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
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
                      Zone Einde
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

            // Add routeTip location markers
            if (zone.routeTips && zone.routeTips.length > 0) {
              const defaultTipColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
              
              zone.routeTips.forEach((tip, tipIndex) => {
                if (tip.locations && tip.locations.length > 0) {
                  const tipColor = tip.color || defaultTipColors[tipIndex % defaultTipColors.length];
                  
                  tip.locations.forEach((location) => {
                    // Skip locations without valid coordinates
                    if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
                      console.warn('⚠️ Location missing coordinates:', location.name, location.coordinates);
                      return;
                    }

                    const submissionsForLocation = location._key
                      ? routeTipSubmissions.filter((submission) => submission.zone_id === zone._id && submission.location_key === location._key)
                      : [];

                    const submissionsHtml = submissionsForLocation.length > 0
                      ? `
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                          <div style="font-weight: 600; font-size: 12px; color: #374151;">
                            Inzendingen (${submissionsForLocation.length})
                          </div>
                          ${submissionsForLocation
                            .map((submission) => {
                              const firstName = submission.participants?.first_name || '';
                              const lastName = submission.participants?.last_name || '';
                              const participantName = (firstName || lastName)
                                ? `${firstName} ${lastName}`.trim()
                                : 'Onbekende deelnemer';
                              const displayName = submission.participant_id === currentUserId ? 'Jij' : participantName;
                              const safeName = escapeHtml(displayName);
                              const statusLabel = submission.is_validated
                                ? (submission.is_correct ? 'Correct' : 'Fout')
                                : 'In onderzoek';
                              const answerContent = submission.challenge_type === 'photo'
                                ? 'Foto inzending'
                                : escapeHtml(submission.text_answer || 'Geen antwoord');
                              const photoId = submission.challenge_photo?.id;
                              const photoButton = submission.challenge_type === 'photo' && submission.photo_url && photoId
                                ? `<div style="margin-top: 6px; display: flex; gap: 6px;">
                                  <button type="button" data-photo-id="${photoId}" style="background: #111827; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px;">Open foto</button>
                                  <button type="button" data-photo-id="${photoId}" style="background: #f3f4f6; color: #111827; padding: 4px 8px; border-radius: 6px; font-size: 11px;">Like/Tag</button>
                                  </div>`
                                : '';

                              return `
                                <div style="margin-top: 6px; padding: 6px; background: #f8fafc; border-radius: 6px;">
                                  <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-weight: 600; font-size: 12px; color: #111827;">${safeName}</div>
                                    <div style="font-size: 10px; color: #6b7280;">${statusLabel}</div>
                                  </div>
                                  <div style="font-size: 12px; color: #374151; margin-top: 2px;">${answerContent}</div>
                                  ${photoButton}
                                </div>
                              `;
                            })
                            .join('')}
                        </div>
                      `
                      : '<div style="margin-top: 10px; font-size: 12px; color: #6b7280;">Nog geen inzendingen</div>';

                    // SVG icons for location types
                    const locationIcon = 
                      location.type === 'highlight' ? 
                        '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' :
                      location.type === 'warning' ? 
                        '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>' :
                      location.type === 'photo' ? 
                        '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>' :
                        '<svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';

                    const tipLocationIcon = L.default.divIcon({
                      html: `<div style="background-color: ${tipColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">${locationIcon}</div>`,
                      className: '',
                      iconSize: [30, 30],
                      iconAnchor: [15, 15],
                    });

                    const typeLabel = 
                      location.type === 'start' ? 'Start punt' :
                      location.type === 'end' ? 'Eind punt' :
                      location.type === 'highlight' ? 'Highlight' :
                      location.type === 'warning' ? 'Waarschuwing' :
                      location.type === 'photo' ? 'Foto Spot' :
                      'Waypoint';

                    L.default.marker([location.coordinates.lat, location.coordinates.lng], { icon: tipLocationIcon })
                      .addTo(mapRef.current)
                      .bindPopup(`
                        <div style="min-width: 200px;">
                          <div style="font-weight: bold; color: ${tipColor}; margin-bottom: 4px; font-size: 13px;">
                            ${tip.name}
                          </div>
                          <strong style="font-size: 15px;">${location.name}</strong><br/>
                          <span style="color: #666; font-size: 12px;">${zone.title}</span><br/>
                          <div style="margin-top: 8px; padding: 6px 8px; background: ${tipColor}20; border-radius: 4px; font-size: 12px; color: #374151;">
                            ${typeLabel}
                          </div>
                          ${location.description ? `<div style="margin-top: 8px; font-size: 12px; color: #6b7280;">${location.description}</div>` : ''}
                          ${submissionsHtml}
                        </div>
                      `);
                  });
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
            html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; 2s infinite;">${icon.svg}</div>`,
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

        // Add emergency SOS alerts (admin only)
        if (isAdmin && showEmergencyAlerts && emergencyAlerts) {
          emergencyAlerts.forEach((alert) => {
            const statusColors: Record<string, string> = {
              pending: '#dc2626',
              acknowledged: '#f59e0b',
            };
            const color = statusColors[alert.status] || '#dc2626';
            
            const emergencyIcon = L.default.divIcon({
              html: `
                <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                  <div style="
                    background-color: ${color}; 
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    border: 3px solid white; 
                    box-shadow: 0 0 20px ${color === '#dc2626' ? 'rgba(220, 38, 38, 0.8)' : 'rgba(245, 158, 11, 0.8)'}, 0 3px 10px rgba(0,0,0,0.4); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    animation: emergencyPulse 1.5s infinite;
                    z-index: 2;
                    position: relative;
                  ">
                    <span style="font-size: 16px; line-height: 1;">🚨</span>
                  </div>
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 48px;
                    height: 48px;
                    margin: -24px 0 0 -24px;
                    border: 2px solid ${color};
                    border-radius: 50%;
                    opacity: 0.5;
                    animation: emergencyRipple 2s infinite;
                    z-index: 1;
                  "></div>
                </div>
              `,
              className: '',
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            });

            const timeAgo = getTimeAgo(new Date(alert.created_at));
            const statusLabel = alert.status === 'pending' ? 'PENDING' : 'ACKNOWLEDGED';
            const participant = alert.participants || {};
            const participantName = participant.first_name && participant.last_name 
              ? `${participant.first_name} ${participant.last_name}` 
              : 'Onbekende Deelnemer';

            L.default.marker([alert.location_lat, alert.location_lng], { icon: emergencyIcon })
              .addTo(mapRef.current)
              .bindPopup(`
                <div style="min-width: 260px; max-width: 300px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 10px; margin: -10px -10px 10px -10px; border-radius: 6px 6px 0 0;">
                    <div style="font-size: 24px;">🚨</div>
                    <div style="flex: 1;">
                      <strong style="font-size: 15px; display: block;">NOOD SOS</strong>
                      <span style="font-size: 11px; display: block; margin-top: 2px;">${statusLabel === 'PENDING' ? 'IN AFWACHTING' : 'BEVESTIGD'}</span>
                    </div>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 14px; font-weight: 600; color: #111; margin-bottom: 6px;">
                      ${participantName}
                    </div>
                    ${participant.phone ? `<div style="font-size: 12px; color: #4b5563; margin-bottom: 3px;">📞 ${participant.phone}</div>` : ''}
                    ${participant.email ? `<div style="font-size: 12px; color: #4b5563; margin-bottom: 3px;">✉️ ${participant.email}</div>` : ''}
                  </div>
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 8px;">
                      <span style="background-color: ${color}; color: white; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 11px;">${statusLabel === 'PENDING' ? 'IN AFWACHTING' : 'BEVESTIGD'}</span>
                      <span style="color: #6b7280;">⏰ ${timeAgo}</span>
                    </div>
                    <a href="https://www.google.com/maps?q=${alert.latitude},${alert.longitude}" target="_blank" style="display: block; text-align: center; background-color: #2f7184; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500; margin-top: 8px;">
                      Open in Google Maps
                    </a>
                    <a href="/admin/emergency-alerts" style="display: block; text-align: center; background-color: #dc2626; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500; margin-top: 6px;">
                      🚨 Bekijk Alle Meldingen
                    </a>
                  </div>
                </div>
              `, {
                maxWidth: 300,
                className: 'emergency-sos-popup'
              });
          });
        } // Close showEmergencyAlerts conditional

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
  }, [isClient, rallyZones, eventMarkers, emergencyAlerts, gpxRouteUrl, userLocation, routeTipSubmissions, currentUserId, showCheckIns, showZoneRoutes, showEventMarkers, showEmergencyAlerts, isAdmin]);

  useEffect(() => {
    if (!isClient || !mapRef.current || !focusLocation) return;
    mapRef.current.setView([focusLocation.lat, focusLocation.lng], 12);
  }, [isClient, focusLocation?.lat, focusLocation?.lng]);

  // Function to update live markers on the map
  async function updateLiveMarkers() {
    console.debug('[live-map] updateLiveMarkers called', { isClient, isAdmin, showLiveLocations, liveLocationsCount: (liveLocations||[]).length });
    if (!isClient || !isAdmin || !showLiveLocations) return;
    try {
      const locations = liveLocations || [];
      const L = (await import('leaflet')).default;
      if (!mapRef.current) return;

      const activeIds = new Set<string>();

      // Build points with pixel positions
      const pts: Array<{ pid: string; lat: number; lng: number; loc: any; point: any }> = [];
      locations.forEach((loc: any) => {
        const pid = loc.participant_id || loc.participant?.id;
        const lat = loc.latitude ?? loc.lat ?? loc.location?.lat;
        const lng = loc.longitude ?? loc.lng ?? loc.location?.lng;
        if (!pid || !lat || !lng) return;
        if (!mapRef.current) return;
        const point = mapRef.current.latLngToLayerPoint([lat, lng]);
        pts.push({ pid, lat, lng, loc, point });
        activeIds.add(pid);
      });

      const thresholdPx = 50; // cluster threshold in pixels
      const clusters: Array<{ members: typeof pts; centerLat: number; centerLng: number }> = [];
      const assigned = new Set<string>();

      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        if (assigned.has(a.pid)) continue;
        const members = [a];
        assigned.add(a.pid);
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          if (assigned.has(b.pid)) continue;
          const dist = a.point.distanceTo(b.point);
          if (dist <= thresholdPx) {
            members.push(b);
            assigned.add(b.pid);
          }
        }
        const centerLat = members.reduce((s, m) => s + m.lat, 0) / members.length;
        const centerLng = members.reduce((s, m) => s + m.lng, 0) / members.length;
        clusters.push({ members, centerLat, centerLng });
      }

      // Clear previous live markers
      Object.keys(liveMarkersRef.current).forEach((pid) => {
        try { mapRef.current.removeLayer(liveMarkersRef.current[pid]); } catch (e) {}
      });
      liveMarkersRef.current = {};

      // Render clusters
      clusters.forEach((c) => {
        if (c.members.length === 1) {
          const m = c.members[0];
          const loc = m.loc;
          const pid = m.pid;
          const lat = m.lat;
          const lng = m.lng;

          const recordedAt = loc.recorded_at ? new Date(loc.recorded_at) : null;
          const formattedDate = recordedAt
            ? recordedAt.toLocaleString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';

          const participant = loc.participant || loc.participants || {};
          const photo = participant.profile_photo_url || participant.profile_photo || null;
          const first = (participant.first_name || '').trim();
          const last = (participant.last_name || '').trim();

          const displayName = (first || last) ? `${first} ${last}`.trim() : 'Onbekende deelnemer';
          const safePhoto = photo ? String(photo).replace(/"/g, '%22') : null;
          const photoHtml = safePhoto
            ? `<div style="width:44px;height:44px;border-radius:6px;overflow:hidden;margin-right:8px;flex-shrink:0;"><img src="${safePhoto}" alt="${escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>`
            : '';

          const popupHtml = `
            <div style=\"min-width:220px; display:flex; gap:8px; align-items:flex-start;\">
              ${photoHtml}
              <div style=\"flex:1\">
                <strong style=\"display:block; font-size:14px; margin-bottom:4px;\">${escapeHtml(displayName)}</strong>
                <div style=\"font-size:13px; color:#374151; margin-bottom:6px;\">Live locatie</div>
                <div style=\"font-size:12px; color:#6b7280;\">${escapeHtml(formattedDate)}</div>
              </div>
            </div>
          `;

          const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U';
          const iconHtml = safePhoto
            ? `<div style="width:34px;height:34px;border-radius:50%;overflow:hidden;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><img src="${safePhoto}" alt="${escapeHtml(first + ' ' + last)}" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>`
            : `<div style="background:#2563eb;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">${escapeHtml(initials)}</div>`;

          const personIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });
          const marker = L.marker([lat, lng], { icon: personIcon }).addTo(mapRef.current).bindPopup(popupHtml);
          try { (marker as any)._isLiveMarker = true; } catch (e) {}
          liveMarkersRef.current[pid] = marker;
        } else {
          // Create cluster marker
          const count = c.members.length;
          const clusterIconHtml = `<div style=\"background:#ef4444;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);\">${count}</div>`;
          const clusterIcon = L.divIcon({ html: clusterIconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
          const marker = L.marker([c.centerLat, c.centerLng], { icon: clusterIcon }).addTo(mapRef.current);

          // Build popup listing members
          const listHtml = c.members.map((m) => {
            const p = m.loc.participant || m.loc.participants || {};
            const name = (p.first_name || p.last_name) ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Onbekende deelnemer';
            return `<div style=\"padding:6px 0;border-bottom:1px solid #f3f4f6;\">${escapeHtml(name)}</div>`;
          }).join('');

          const popupHtml = `<div style="min-width:200px; max-width:280px;"><div style="font-weight:700;margin-bottom:6px;">${count} deelnemers</div>${listHtml}<div style="margin-top:8px;text-align:right;"><a href="#" data-cluster-zoom="${c.centerLat},${c.centerLng}" style="font-weight:600;color:#2563eb;">Zoom in</a></div></div>`;
          marker.bindPopup(popupHtml);
          try { (marker as any)._isLiveMarker = true; } catch (e) {}
          // When popup link clicked, zoom to cluster area
          marker.on('popupopen', () => {
            const container = marker.getPopup()?.getElement();
            if (!container) return;
            const link = container.querySelector('a[data-cluster-zoom]') as HTMLAnchorElement | null;
            if (link) {
              link.addEventListener('click', (ev) => {
                ev.preventDefault();
                const latlngs = c.members.map((m) => [m.lat, m.lng]);
                try { mapRef.current.fitBounds(latlngs as any, { maxZoom: 17, padding: [60, 60] }); } catch (e) {}
              });
            }
          });
        }
      });

      // Remove markers for participants no longer present
      Object.keys(liveMarkersRef.current).forEach((pid) => {
        if (!activeIds.has(pid)) {
          try { mapRef.current.removeLayer(liveMarkersRef.current[pid]); } catch (e) {}
          delete liveMarkersRef.current[pid];
        }
      });
    } catch (err) {
      console.warn('[live-map] failed to update live locations', err);
    }
  }

  useEffect(() => {
    // Run update when liveLocations array changes or when toggle is enabled
    try { updateLiveMarkers(); } catch (e) { console.warn('[live-map] updateLiveMarkers threw', e); }
  }, [isClient, isAdmin, liveLocations, showLiveLocations]);

  // If live locations toggle is turned off, clear any existing live markers
  useEffect(() => {
    if (!isClient || !mapRef.current) return;
    if (!showLiveLocations) {
      console.debug('[live-map] showLiveLocations turned off - clearing markers');
      Object.keys(liveMarkersRef.current).forEach((pid) => {
        try { mapRef.current.removeLayer(liveMarkersRef.current[pid]); } catch (e) {}
      });
      liveMarkersRef.current = {};
    }
  }, [showLiveLocations, isClient]);

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
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.8), 0 3px 10px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 30px rgba(220, 38, 38, 1), 0 3px 15px rgba(0,0,0,0.6); }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes emergencyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes emergencyRipple {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function PhotoInteractionModal({
  photoId,
  photoUrl,
  title,
  participantName,
  participantPhoto,
  submittedAt,
  zoneId,
  initialLikeCount,
  initialLiked,
  initialTags,
  buddies,
  onClose,
}: {
  photoId: string;
  photoUrl: string;
  title: string;
  participantName?: string;
  participantPhoto?: string;
  submittedAt?: string;
  zoneId?: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialTags: RouteTipSubmission['challenge_photo'] extends { photo_tags?: infer T } ? T : any[];
  buddies: BuddyOption[];
  onClose?: () => void;
}) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [tags, setTags] = useState(initialTags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/photo-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', photoId }),
      });

      if (!response.ok) {
        setIsSubmitting(false);
        return;
      }

      const result = await response.json().catch(() => null);
      if (result?.snapshot) {
        setLikeCount(result.snapshot.like_count ?? likeCount);
        setTags(result.snapshot.tags ?? tags);
        setLiked(result.snapshot.liked ?? liked);
      } else {
        const nextLiked = !liked;
        setLiked(nextLiked);
        setLikeCount((prev) => Math.max(prev + (nextLiked ? 1 : -1), 0));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = async (buddyId: string) => {
    if (!buddyId || isSubmitting) return;
    setIsSubmitting(true);

    const isTagged = tags.some((tag: any) => tag.participant_id === buddyId);
    const action = isTagged ? 'untag' : 'tag';

    try {
      const response = await fetch('/api/photo-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          photoId,
          taggedParticipantId: buddyId,
        }),
      });

      if (!response.ok) {
        setIsSubmitting(false);
        return;
      }

      const result = await response.json().catch(() => null);
      if (result?.snapshot) {
        setLikeCount(result.snapshot.like_count ?? likeCount);
        setTags(result.snapshot.tags ?? tags);
        if (typeof result.snapshot.liked === 'boolean') {
          setLiked(result.snapshot.liked);
        }
      } else if (isTagged) {
        setTags((prev: any[]) => prev.filter((tag) => tag.participant_id !== buddyId));
      } else {
        const buddy = buddies.find((b) => b.id === buddyId);
        if (buddy) {
          setTags((prev: any[]) => [
            ...prev,
            {
              participant_id: buddy.id,
              participant: { id: buddy.id, first_name: buddy.first_name, last_name: buddy.last_name },
            },
          ]);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Lightbox
      imageSrc={photoUrl}
      imageAlt={title}
      onClose={onClose}
      backdrop={false}
      wrapperClassName="relative"
      contentClassName="relative"
      imageClassName="max-h-[70vh] max-w-full object-contain w-full rounded-lg"
      interactions={{
        likeCount,
        liked,
        onLike: handleLike,
        tags,
        tagOptions: buddies,
        onToggleTag: handleTagToggle,
        isSubmitting,
      }}
      footer={
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            {participantPhoto ? (
              <img
                src={participantPhoto}
                alt={participantName}
                className="w-12 h-12 rounded-full object-cover border-2 border-teal-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                {(participantName || 'U').charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold">{participantName}</p>
              <p className="text-sm text-white/70">Deelnemer</p>
            </div>
          </div>

          {(zoneId || submittedAt) && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              {zoneId && (
                <>
                  <span className="bg-white/10 px-3 py-1 rounded-full">Zone {zoneId}</span>
                  <span>•</span>
                </>
              )}
              {submittedAt && (
                <span>
                  Ingediend op {new Date(submittedAt).toLocaleDateString('nl-BE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      }
    />
  );
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
