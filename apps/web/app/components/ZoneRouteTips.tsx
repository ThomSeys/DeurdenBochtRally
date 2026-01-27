import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import RouteTipsMap from './RouteTipsMap';

interface ZoneRouteTipsProps {
  routeTips: any[];
  zoneTitle: string;
  zoneStartLocation: { lat: number; lng: number } | null;
  zoneEndLocation: { lat: number; lng: number } | null;
}

export default function ZoneRouteTips({
  routeTips,
  zoneTitle,
  zoneStartLocation,
  zoneEndLocation,
}: ZoneRouteTipsProps) {
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const hasLocations = routeTips.some((tip: any) => tip.locations && tip.locations.length > 0);

  // Refresh map when it becomes visible
  useEffect(() => {
    if (showMap) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        setMapKey(prev => prev + 1);
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [showMap]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <Icon name="map" className="w-5 h-5" />
          {routeTips.length} Route Opties
        </h4>
        
        {/* Mobile toggle */}
        {hasLocations && (
          <div className="lg:hidden">
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Icon name="map" className="w-4 h-4" />
              {showMap ? 'Toon Routes' : 'Toon Kaart'}
            </button>
          </div>
        )}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map showing all route tips for this zone */}
        {hasLocations && (
          <div className={`bg-gray-50 p-4 rounded-lg lg:row-span-2 ${showMap ? 'block' : 'hidden lg:block'}`}>
            <RouteTipsMap 
              key={mapKey}
              routeTips={routeTips} 
              zoneTitle={zoneTitle}
              zoneStartLocation={zoneStartLocation ?? undefined}
              zoneEndLocation={zoneEndLocation ?? undefined}
              className="h-full min-h-[400px] lg:min-h-[600px]"
            />
          </div>
        )}
        
        <div className={`space-y-4 ${showMap ? 'hidden lg:block' : 'block'}`}>
          {routeTips.map((tip: any, idx: number) => {
            const getRouteIcon = (type: string) => {
              switch (type) {
                case 'scenic': return 'mountain';
                case 'technical': return 'cog';
                case 'fast': return 'road';
                case 'relaxed': return 'tree';
                default: return 'motorcycle';
              }
            };

            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon 
                    name={getRouteIcon(tip.routeType)} 
                    className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" 
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">{tip.title}</h5>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                    
                    {tip.distance && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        <Icon name="motorcycle" className="w-3 h-3" />
                        {tip.distance} km
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
