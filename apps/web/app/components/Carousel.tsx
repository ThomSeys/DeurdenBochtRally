import { useState, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface CarouselProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  showControls?: boolean;
  showDots?: boolean;
  showCounter?: boolean;
  className?: string;
  itemClassName?: string;
  onIndexChange?: (index: number) => void;
  currentIndex?: number;
}

export default function Carousel({
  items,
  renderItem,
  showControls = true,
  showDots = true,
  showCounter = true,
  className = '',
  itemClassName = '',
  onIndexChange,
  currentIndex: controlledIndex,
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = controlledIndex !== undefined;
  const currentIndex = isControlled ? controlledIndex : internalIndex;
  
  const setCurrentIndex = (value: number | ((prev: number) => number)) => {
    const newIndex = typeof value === 'function' ? value(currentIndex) : value;
    if (!isControlled) {
      setInternalIndex(newIndex);
    }
    onIndexChange?.(newIndex);
  };
  
  // Touch/swipe state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50; // minimum distance for a swipe
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - go to next
        goToNext();
      } else {
        // Swiped right - go to previous
        goToPrevious();
      }
    }

    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div 
      className={`flex flex-col ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current Item */}
      <div className={`flex-1 flex flex-col touch-pan-y ${itemClassName}`}>
        {renderItem(currentItem, currentIndex)}
      </div>

      {/* Navigation Controls */}
      {items.length > 1 && (
        <div className="flex-shrink-0 mt-4">
          {showControls && (
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevious}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                aria-label="Vorige item"
              >
                <Icon name="chevron-left" className="w-5 h-5" />
                <span className="hidden sm:inline">Vorige</span>
              </button>

              {/* Dots Indicator */}
              {showDots && (
                <div className="flex items-center gap-2">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentIndex 
                          ? 'w-8 bg-accent-500' 
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Ga naar item ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={goToNext}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                aria-label="Volgende item"
              >
                <span className="hidden sm:inline">Volgende</span>
                <Icon name="chevron-right" className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Counter */}
          {showCounter && (
            <div className="text-center mt-2 text-sm text-gray-600">
              Item {currentIndex + 1} van {items.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
