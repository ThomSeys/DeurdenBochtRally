import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useEffect, useState } from 'react';
import ClientOnly from '~/components/ClientOnly';
import React from 'react';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Event Dashboard - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin event dashboard loaded');

  // Get check-in timeline data (group by hour)
  const { data: checkIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*, rally_zones(zone_number, name), participants(first_name, last_name)')
    .order('checked_in_at', { ascending: true });

  // Get zone statistics
  const { data: zoneStats } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('rally_zone_id, action, checked_in_at, rally_zones(zone_number, name, location)')
    .eq('action', 'CHECKIN');

  // Calculate zone metrics
  const zoneMetrics = new Map();
  
  if (zoneStats) {
    zoneStats.forEach((checkin: any) => {
      const zoneId = checkin.rally_zone_id;
      const zoneNumber = checkin.rally_zones?.zone_number;
      const zoneName = checkin.rally_zones?.name;
      const location = checkin.rally_zones?.location;
      
      if (!zoneMetrics.has(zoneId)) {
        zoneMetrics.set(zoneId, {
          zone_id: zoneId,
          zone_number: zoneNumber,
          zone_name: zoneName,
          location: location,
          total_checkins: 0,
          first_checkin: null,
          last_checkin: null,
          checkin_times: [],
        });
      }
      
      const metric = zoneMetrics.get(zoneId);
      metric.total_checkins++;
      metric.checkin_times.push(new Date(checkin.checked_in_at));
      
      if (!metric.first_checkin || new Date(checkin.checked_in_at) < new Date(metric.first_checkin)) {
        metric.first_checkin = checkin.checked_in_at;
      }
      if (!metric.last_checkin || new Date(checkin.checked_in_at) > new Date(metric.last_checkin)) {
        metric.last_checkin = checkin.checked_in_at;
      }
    });
  }

  // Calculate average time per zone and drop-off rate
  const sortedZones = Array.from(zoneMetrics.values()).sort((a, b) => a.zone_number - b.zone_number);
  
  sortedZones.forEach((zone, index) => {
    if (index > 0) {
      const previousZone = sortedZones[index - 1];
      const dropOffRate = previousZone.total_checkins > 0 
        ? ((previousZone.total_checkins - zone.total_checkins) / previousZone.total_checkins * 100)
        : 0;
      zone.drop_off_rate = dropOffRate.toFixed(1);
    } else {
      zone.drop_off_rate = '0.0';
    }
    
    // Calculate average time to reach this zone
    if (zone.checkin_times.length > 0) {
      const times = zone.checkin_times.map((t: Date) => t.getTime());
      const avgTime = times.reduce((a: number, b: number) => a + b, 0) / times.length;
      zone.average_time = new Date(avgTime);
    }
  });

  // Get total participants
  const { count: totalParticipants } = await supabaseAdmin
    .from('participants')
    .select('*', { count: 'exact', head: true });

  const { count: checkedInParticipants } = await supabaseAdmin
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('checked_in', true);

  // Group check-ins by hour for timeline
  const timelineData = new Map<string, number>();
  
  if (checkIns) {
    checkIns.forEach((checkin: any) => {
      const hour = new Date(checkin.checked_in_at).getHours();
      const key = `${hour}:00`;
      timelineData.set(key, (timelineData.get(key) || 0) + 1);
    });
  }

  const timeline = Array.from(timelineData.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // Get latest check-ins for live feed
  const { data: latestCheckIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('*, participants(first_name, last_name, motorcycle_brand), rally_zones(zone_number, name)')
    .order('checked_in_at', { ascending: false })
    .limit(10);

  // Get all GPS locations for heatmap - get latest check-in per participant
  const { data: latestCheckins } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('participant_id, location_lat, location_lng, checked_in_at')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)
    .order('checked_in_at', { ascending: false });

  console.log('Check-ins with GPS:', latestCheckins?.length || 0);

  // Get unique participants (only their latest check-in)
  const heatmapData: Array<{ lat: number; lng: number }> = [];
  const seenParticipants = new Set<string>();
  
  if (latestCheckins) {
    latestCheckins.forEach((checkin: any) => {
      if (!seenParticipants.has(checkin.participant_id)) {
        seenParticipants.add(checkin.participant_id);
        
        const lat = parseFloat(checkin.location_lat);
        const lng = parseFloat(checkin.location_lng);
        
        // Validate coordinates are in Belgium range
        if (!isNaN(lat) && !isNaN(lng) && lat > 49 && lat < 52 && lng > 2 && lng < 7) {
          heatmapData.push({ lat, lng });
        }
      }
    });
  }
  
  console.log('Unique participants with GPS:', heatmapData.length);
  if (heatmapData.length > 0) {
    console.log('Sample points:', heatmapData.slice(0, 3));
  }

  return {
    zoneMetrics: sortedZones,
    timeline,
    totalParticipants: totalParticipants || 0,
    checkedInParticipants: checkedInParticipants || 0,
    latestCheckIns: latestCheckIns || [],
    heatmapData,
  };
}

export default function AdminEventDashboard() {
  const { zoneMetrics, timeline, totalParticipants, checkedInParticipants, latestCheckIns, heatmapData } = useLoaderData<typeof loader>();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const maxCheckIns = Math.max(...timeline.map(t => t.count), 1);
  const completionRate = totalParticipants > 0 
    ? ((checkedInParticipants / totalParticipants) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
                  <Icon name="activity" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Event Dashboard</h1>
                  <p className="text-xl text-blue-100 mt-1">Real-time Event Monitoring</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200 mb-1">Live tijd</div>
              <div className="text-3xl font-mono font-bold">
                {currentTime.toLocaleTimeString('nl-BE')}
              </div>
              <div className="text-sm text-blue-200 mt-1">
                {currentTime.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <Icon name="arrow-left" className="w-4 h-4 mr-2" />
            Terug naar Admin Dashboard
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totaal Deelnemers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalParticipants}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Icon name="users" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingecheckt</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{checkedInParticipants}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Icon name="check-circle" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{completionRate}%</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Icon name="trending-up" className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totaal Check-ins</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {latestCheckIns.length > 0 ? zoneMetrics.reduce((sum, z) => sum + z.total_checkins, 0) : 0}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Icon name="map-pin" className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Check-in Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Icon name="clock" className="w-5 h-5 mr-2 text-blue-600" />
              Check-in Timeline
            </h2>
            <div className="space-y-3">
              {timeline.length > 0 ? (
                timeline.map((item) => (
                  <div key={item.hour} className="flex items-center">
                    <div className="w-16 text-sm font-medium text-gray-700">{item.hour}</div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center px-3 text-white text-sm font-semibold"
                          style={{ width: `${(item.count / maxCheckIns) * 100}%` }}
                        >
                          {item.count > 0 && item.count}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Nog geen check-ins vandaag</p>
              )}
            </div>
          </div>

          {/* Live Check-in Feed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Icon name="radio" className="w-5 h-5 mr-2 text-green-600" />
              Live Check-ins
              <span className="ml-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {latestCheckIns.length > 0 ? (
                latestCheckIns.map((checkin: any) => (
                  <div
                    key={checkin.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {checkin.participants?.first_name} {checkin.participants?.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {checkin.participants?.motorcycle_brand || 'Onbekend merk'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        RZ{checkin.rally_zones?.zone_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(checkin.checked_in_at).toLocaleTimeString('nl-BE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Nog geen check-ins</p>
              )}
            </div>
          </div>
        </div>

        {/* Zone Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon name="map" className="w-5 h-5 mr-2 text-purple-600" />
            Rally Zone Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-ins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drop-off Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eerste Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laatste Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locatie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {zoneMetrics.length > 0 ? (
                  zoneMetrics.map((zone) => (
                    <tr key={zone.zone_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <span className="text-sm font-bold text-blue-600">RZ{zone.zone_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{zone.zone_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-gray-900">{zone.total_checkins}</div>
                          <div className="ml-2 text-xs text-gray-500">
                            ({totalParticipants > 0 ? ((zone.total_checkins / checkedInParticipants) * 100).toFixed(0) : 0}%)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parseFloat(zone.drop_off_rate) > 20 
                            ? 'bg-red-100 text-red-800'
                            : parseFloat(zone.drop_off_rate) > 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {zone.drop_off_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {zone.first_checkin 
                          ? new Date(zone.first_checkin).toLocaleTimeString('nl-BE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {zone.last_checkin 
                          ? new Date(zone.last_checkin).toLocaleTimeString('nl-BE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {zone.location?.coordinates 
                          ? `${zone.location.coordinates[1].toFixed(4)}, ${zone.location.coordinates[0].toFixed(4)}`
                          : 'Geen locatie'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nog geen zone statistieken beschikbaar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live GPS Heatmap */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon name="map-pin" className="w-5 h-5 mr-2 text-red-600" />
            Live Locatie Heatmap
            <span className="ml-3 text-sm font-normal text-gray-600">
              {heatmapData.length} GPS punten
            </span>
          </h2>
          <ClientOnly 
            key={`heatmap-${heatmapData.length}`}
          >
            <EventHeatmap locations={heatmapData} />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}

// Heatmap component (client-side only)
function EventHeatmap({ locations }: { locations: Array<{ lat: number; lng: number }> }) {
  const [isMounted, setIsMounted] = React.useState(false);
  const mapInstanceRef = React.useRef<any>(null);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || locations.length === 0) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    let map: any = null;
    
    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');

        // Belgium center coordinates
        const belgiumCenter: [number, number] = [50.5039, 4.4699];
        
        // Initialize map
        map = L.map('heatmap-container-unique').setView(belgiumCenter, 8);
        mapInstanceRef.current = map;

        // Add tile layer - using light CartoDB Positron theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        // Create a simple heatmap effect using circles
        // Group locations by proximity to show intensity
        const locationMap = new Map<string, number>();
        locations.forEach(loc => {
          const key = `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
          locationMap.set(key, (locationMap.get(key) || 0) + 1);
        });

        // Add circles for each unique location with color based on count
        Array.from(locationMap.entries()).forEach(([key, count]) => {
          const [latStr, lngStr] = key.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          
          // Calculate color based on count (blue -> cyan -> green -> yellow -> red)
          let color = '#3b82f6'; // blue
          let opacity = 0.4;
          
          if (count >= 5) {
            color = '#ef4444'; // red
            opacity = 0.8;
          } else if (count >= 4) {
            color = '#eab308'; // yellow
            opacity = 0.7;
          } else if (count >= 3) {
            color = '#84cc16'; // lime
            opacity = 0.6;
          } else if (count >= 2) {
            color = '#22d3ee'; // cyan
            opacity = 0.5;
          }
          
          const radius = 500 + (count * 300); // Base radius + extra per count
          
          L.circle([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: opacity,
            radius: radius,
            weight: 2,
          })
            .bindPopup(`<strong>${count} deelnemer${count > 1 ? 's' : ''}</strong><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`)
            .addTo(map);
        });

        // Fit bounds to show all points
        const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        
        console.log('Map created with', locationMap.size, 'locations');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, locations]);

  if (!isMounted || locations.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="map-pin" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium mb-2">
          {!isMounted ? 'Kaart wordt geladen...' : 'Nog geen GPS data beschikbaar'}
        </p>
        {locations.length === 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              GPS coördinaten worden vastgelegd bij check-ins op zones
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Om de heatmap te activeren, moeten rally zones GPS coördinaten hebben.
                Deze worden automatisch vastgelegd wanneer deelnemers inchecken via hun mobiele apparaat.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        id="heatmap-container-unique"
        className="rounded-lg w-full bg-gray-100"
        style={{ height: '400px', minHeight: '400px' }}
      />
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500"></div>
            <span>1 deelnemer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-400"></div>
            <span>2 deelnemers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-lime-400"></div>
            <span>3 deelnemers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400"></div>
            <span>4 deelnemers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500"></div>
            <span>5+ deelnemers</span>
          </div>
        </div>
        <div className="text-gray-500">
          Klik op een cirkel voor details
        </div>
      </div>
    </div>
  );
}
