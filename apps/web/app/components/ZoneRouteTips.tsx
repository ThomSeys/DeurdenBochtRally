import { useState } from 'react';
import { Icon } from './Icon';
import RouteTipsMap from './RouteTipsMap';
import Carousel from './Carousel';
import ChallengeModal from './ChallengeModal';
import { useModal } from '~/contexts/ModalContext';
import { useHaptics } from '~/lib/haptics';

interface ZoneRouteTipsProps {
  routeTips: any[];
  zoneTitle: string;
  zoneId: string;
  zoneStartLocation: { lat: number; lng: number } | null;
  zoneEndLocation: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  completedChallenges?: string[]; // Array of location keys that have been completed
  isZoneCheckedIn?: boolean;
  zoneSkipUsed?: boolean;
  initialIndex?: number;
}

export default function ZoneRouteTips({
  routeTips,
  zoneTitle,
  zoneId,
  zoneStartLocation,
  zoneEndLocation,
  userLocation,
  completedChallenges = [],
  isZoneCheckedIn = false,
  zoneSkipUsed = false,
  initialIndex = 0,
}: ZoneRouteTipsProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);
  const [selectedChallenge, setSelectedChallenge] = useState<{
    challenge: any;
    locationName: string;
    locationKey: string;
  } | null>(null);
  const [hoveredLocationKey, setHoveredLocationKey] = useState<string | null>(null);
  const [mapInteractive, setMapInteractive] = useState<boolean>(false);
  
  const hasLocations = routeTips.some((tip: any) => tip.locations && tip.locations.length > 0);

  const currentTip = routeTips[currentIndex];
  const { openModal, closeModal } = useModal();
  const { tap, select } = useHaptics();

  const getRouteIcon = (type: string) => {
    switch (type) {
      case 'scenic': return 'mountain';
      case 'technical': return 'cog';
      case 'fast': return 'road';
      case 'relaxed': return 'tree';
      default: return 'motorcycle';
    }
  };

  const renderRouteTip = (tip: any) => {
    return (
      <div className="bg-white border-2 border-accent-500 rounded-lg p-6 shadow-md h-full flex flex-col">
        <div className="flex items-start gap-3 flex-1">
          <Icon 
            name={getRouteIcon(tip.routeType)} 
            className="w-6 h-6 text-accent-500 mt-0.5 flex-shrink-0" 
          />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row items-start justify-between gap-2 mb-2">
              <h5 className="font-bold text-lg text-gray-900">{tip.name}</h5>
              <div className="flex items-center gap-2">
                {tip.difficulty && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    tip.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    tip.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tip.difficulty === 'easy' ? '● Makkelijk' : tip.difficulty === 'medium' ? '●● Gemiddeld' : '●●● Uitdagend'}
                  </span>
                )}

                {tip.gpxFile && tip.gpxFile.asset && tip.gpxFile.asset.url && (
                  (() => {
                    const gpxUrl = tip.gpxFile.asset.url;
                    const gpxFilename = decodeURIComponent((gpxUrl.split('/').pop() || 'route.gpx'));
                    return (
                      <a
                        href={gpxUrl}
                        download={gpxFilename}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm hover:opacity-90"
                      >
                        <Icon name="download" className="w-4 h-4" />
                        Download GPX
                      </a>
                    );
                  })()
                )}
              </div>
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
                  {tip.routeType === 'scenic' && 'Landelijk'}
                  {tip.routeType === 'technical' && 'Technisch'}
                  {tip.routeType === 'fast' && 'Sportief'}
                  {tip.routeType === 'relaxed' && 'Ontspannen'}
                  {tip.routeType === 'mixed' && 'Gemengd'}
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
  
            {/* Challenges */}
            {tip.locations && tip.locations.some((loc: any) => loc.challenge?.isActive !== false) && (tip.locations.filter((loc: any) => loc.challenge && loc.challenge.isActive !== false).length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="target" className="w-5 h-5 text-accent-600" />
                  <h6 className="font-semibold text-gray-900">Opdrachten op deze route</h6>
                </div>
                {zoneSkipUsed && (
                  <div className="mb-3 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
                    Je hebt gekozen voor het hazepad voor deze zone — je kunt geen routetips of challenges indienen.
                  </div>
                )}
                <div className="space-y-2">
                  {tip.locations
                    .filter((loc: any) => loc.challenge && loc.challenge.isActive !== false)
                    .map((loc: any, idx: number) => {
                      const isCompleted = completedChallenges.includes(loc._key);
                      const isLocked = !isZoneCheckedIn;
                      const isDisabledBySkip = zoneSkipUsed === true;
                      const getChallengeIcon = (type: string) => {
                        switch (type) {
                          case 'photo': return 'camera';
                          case 'text': return 'message-square';
                          case 'multiple_choice': return 'list-checks';
                          case 'number': return 'hash';
                          default: return 'help-circle';
                        }
                      };
  
                      return (
                        <button
                          key={idx}
                          onMouseEnter={() => setHoveredLocationKey(loc._key)}
                          onMouseLeave={() => setHoveredLocationKey(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCompleted && !isLocked) {
                              select();
                              setSelectedChallenge({
                                challenge: loc.challenge,
                                locationName: loc.name,
                                locationKey: loc._key,
                              });
                            }
                          }}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          disabled={isCompleted || isLocked || isDisabledBySkip}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all pointer-events-auto relative z-10 ${
                            isCompleted || isLocked || isDisabledBySkip
                              ? 'border-green-200 bg-green-50 opacity-60 cursor-not-allowed'
                              : 'border-accent-200 bg-accent-50 hover:border-accent-400 hover:bg-accent-100 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon 
                              name={isCompleted ? 'check-circle' : getChallengeIcon(loc.challenge.type)} 
                              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                isCompleted ? 'text-green-600' : 'text-accent-600'
                              }`} 
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-gray-900">{loc.name}</p>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {loc.challenge.question}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-semibold text-accent-700 whitespace-nowrap">
                                  <Icon name="star" className="w-4 h-4" />
                                  <span>{loc.challenge.points}</span>
                                </div>
                              </div>
                              {isCompleted && (
                                <p className="text-sm text-green-700 font-medium mt-2">
                                  ✓ Voltooid
                                </p>
                              )}
                              {!isCompleted && isLocked && (
                                <p className="text-sm text-yellow-800 font-medium mt-2">
                                  Check eerst in om te starten
                                </p>
                              )}
                              {!isCompleted && isDisabledBySkip && (
                                <p className="text-sm text-red-800 font-medium mt-2">
                                  Niet mogelijk: je koos het hazepad voor deze zone
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Challenge Modal */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge.challenge}
          locationName={selectedChallenge.locationName}
          locationKey={selectedChallenge.locationKey}
          zoneId={zoneId}
          onClose={() => setSelectedChallenge(null)}
          onSuccess={(result) => {
            console.log('Challenge completed:', result);
            // Optionally refresh data or show success message
          }}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Icon name="map" className="w-5 h-5" />
            {routeTips.length} Route Opties
          </h4>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 lg:items-stretch">
          {/* Map showing current route tip */}
          {hasLocations && (
            <div className="bg-gray-50 rounded-lg flex flex-col relative">
              <RouteTipsMap 
                key={currentIndex}
                routeTips={[currentTip]} 
                zoneTitle={zoneTitle}
                zoneStartLocation={zoneStartLocation ?? undefined}
                zoneEndLocation={zoneEndLocation ?? undefined}
                userLocation={userLocation ?? undefined}
                className="h-[400px] lg:h-full lg:flex-1"
                highlightedLocationId={hoveredLocationKey}
                interactive={mapInteractive}
              />

              {/* External lock toggle for this map */}
              <button
                onClick={(e) => { e.stopPropagation(); tap(); setMapInteractive((v) => !v); }}
                title={mapInteractive ? 'Vergrendel kaart' : 'Ontgrendel kaart'}
                className="absolute top-3 right-3 z-[1000] bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-md border border-gray-100"
                aria-pressed={mapInteractive}
              >
                <Icon name={mapInteractive ? 'eye' : 'lock'} className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Carousel with route tips */}
          <Carousel
            items={routeTips}
            renderItem={renderRouteTip}
            showControls={true}
            showDots={true}
            showCounter={true}
            itemClassName=""
            currentIndex={currentIndex}
            onIndexChange={(idx) => { tap(); setCurrentIndex(idx); }}
            disabled={!!selectedChallenge}
          />
        </div>
      </div>
    </>
  );
}
