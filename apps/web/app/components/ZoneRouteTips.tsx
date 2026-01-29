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
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasLocations = routeTips.some((tip: any) => tip.locations && tip.locations.length > 0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % routeTips.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + routeTips.length) % routeTips.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

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

  const currentTip = routeTips[currentIndex];

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
      
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* Map showing all route tips for this zone */}
        {hasLocations && (
          <div className={`bg-gray-50 p-4 rounded-lg flex flex-col ${showMap ? 'block' : 'hidden lg:flex'}`}>
            <RouteTipsMap 
              key={`${mapKey}-${currentIndex}`}
              routeTips={[currentTip]} 
              zoneTitle={zoneTitle}
              zoneStartLocation={zoneStartLocation ?? undefined}
              zoneEndLocation={zoneEndLocation ?? undefined}
              className="h-[400px] lg:h-full lg:flex-1"
            />
          </div>
        )}
        
        {/* Carousel */}
        <div className={`flex flex-col ${showMap ? 'hidden lg:flex' : 'flex'}`}>
          {/* Current Route Tip */}
          <div className="flex-1 flex flex-col">
            {(() => {
              const tip = currentTip;
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
                <div className="bg-white border-2 border-accent-500 rounded-lg p-6 shadow-md h-full flex flex-col">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon 
                      name={getRouteIcon(tip.routeType)} 
                      className="w-6 h-6 text-accent-500 mt-0.5 flex-shrink-0" 
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-bold text-lg text-gray-900">{tip.name}</h5>
                        {tip.difficulty && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            tip.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            tip.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tip.difficulty === 'easy' ? '● Makkelijk' : tip.difficulty === 'medium' ? '●● Gemiddeld' : '●●● Uitdagend'}
                          </span>
                        )}
                      </div>
                      
                      {tip.description && (
                        <p className="text-gray-700 leading-relaxed mb-3">{tip.description}</p>
                      )}
                      
                      {/* Route Stats */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tip.estimatedDistance && (
                          <div className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                            <Icon name="motorcycle" className="w-4 h-4" />
                            <span className="font-semibold">{tip.estimatedDistance} km</span>
                          </div>
                        )}
                        {tip.routeType && (
                          <div className="inline-flex items-center gap-1.5 text-sm text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full font-medium">
                            {tip.routeType === 'scenic' && '🏞️ Landelijk'}
                            {tip.routeType === 'technical' && '🔧 Technisch'}
                            {tip.routeType === 'fast' && '⚡ Sportief'}
                            {tip.routeType === 'relaxed' && '🌳 Ontspannen'}
                          </div>
                        )}
                      </div>

                      {/* Character & Highlights */}
                      {(tip.character || tip.highlights) && (
                        <div className="space-y-2 mb-3">
                          {tip.character && (
                            <div className="bg-accent-50 border-l-4 border-accent-500 p-3 rounded">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-accent-700">Karakter:</span> {tip.character}
                              </p>
                            </div>
                          )}
                          {tip.highlights && (
                            <div className="bg-primary-50 border-l-4 border-primary-500 p-3 rounded">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-primary-700">Highlights:</span> {tip.highlights}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Warnings */}
                      {tip.warnings && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mb-3">
                          <div className="flex items-start gap-2">
                            <Icon name="alert-triangle" className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">
                              <span className="font-semibold">Let op:</span> {tip.warnings}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {(tip.routeInstructions || tip.exitInstructions || tip.rejoinInstructions) && (
                        <details className="mt-3 group">
                          <summary className="cursor-pointer text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                            <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Route instructies
                          </summary>
                          <div className="mt-2 pl-5 space-y-2 text-sm text-gray-600">
                            {tip.routeInstructions && (
                              <p><span className="font-semibold text-gray-700">Route:</span> {tip.routeInstructions}</p>
                            )}
                            {tip.exitInstructions && (
                              <p><span className="font-semibold text-gray-700">Uitrit:</span> {tip.exitInstructions}</p>
                            )}
                            {tip.rejoinInstructions && (
                              <p><span className="font-semibold text-gray-700">Terug op route:</span> {tip.rejoinInstructions}</p>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Navigation Controls */}
          {routeTips.length > 1 && (
            <div className="flex-shrink-0 mt-4">
              {/* Previous/Next Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPrevious}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Icon name="chevron-left" className="w-5 h-5" />
                  <span className="hidden sm:inline">Vorige</span>
                </button>

                {/* Dots Indicator */}
                <div className="flex items-center gap-2">
                  {routeTips.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentIndex 
                          ? 'w-8 bg-accent-500' 
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Ga naar route ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNext}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <span className="hidden sm:inline">Volgende</span>
                  <Icon name="chevron-right" className="w-5 h-5" />
                </button>
              </div>

              {/* Counter */}
              <div className="text-center mt-2 text-sm text-gray-600">
                Route {currentIndex + 1} van {routeTips.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
