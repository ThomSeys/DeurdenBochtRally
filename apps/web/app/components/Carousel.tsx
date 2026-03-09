import { useState, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface CarouselProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  showControls?: boolean;
  showDots?: boolean;
  showCounter?: boolean;
  nested?: boolean;
  className?: string;
  itemClassName?: string;
  onIndexChange?: (index: number) => void;
  currentIndex?: number;
  disabled?: boolean;
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
  disabled = false,
  nested = false,
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isControlled = controlledIndex !== undefined;
  const currentIndex = isControlled ? controlledIndex : internalIndex;
  
  const setCurrentIndex = (newIndex: number) => {
    // Clamp index to valid range
    const clampedIndex = ((newIndex % items.length) + items.length) % items.length;
    if (!isControlled) {
      setInternalIndex(clampedIndex);
    }
    onIndexChange?.(clampedIndex);
  };
  
  // Touch/swipe state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goToNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isAnimating || disabled) return;
    setIsAnimating(true);
    setCurrentIndex((currentIndex + 1) % items.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToPrevious = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isAnimating || disabled) return;
    setIsAnimating(true);
    setCurrentIndex((currentIndex - 1 + items.length) % items.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isAnimating || disabled) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || nested) return;
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || nested) return;
    e.stopPropagation();
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (disabled || nested) return;
    const swipeThreshold = 100; // minimum distance for a swipe
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold && !isAnimating) {
      if (diff > 0) {
        // Swiped left - go to next
        setIsAnimating(true);
        setCurrentIndex((currentIndex + 1) % items.length);
        setTimeout(() => setIsAnimating(false), 300);
      } else {
        // Swiped right - go to previous
        setIsAnimating(true);
        setCurrentIndex((currentIndex - 1 + items.length) % items.length);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }

    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    if (disabled) return;
    e.stopPropagation();
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
      {...(!nested ? {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchCancel,
      } : {})}
    >
      {/* Current Item */}
      <div className={`flex-1 flex flex-col touch-pan-y ${itemClassName}`}>
        {renderItem(currentItem, currentIndex)}
      </div>

      {/* Navigation Controls */}
      {items.length > 1 && (
        <div className="flex-shrink-0 mt-4">
          {showControls && (
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={(e) => goToPrevious(e)}
                disabled={isAnimating || disabled}
                className={`flex items-center gap-2 ${nested ? 'px-2 py-1 text-sm' : 'px-4 py-2'} bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-20`}
                aria-label="Vorige item"
              >
                <Icon name="chevron-left" className="w-5 h-5" />
                <span className={`hidden sm:inline ${nested ? 'text-sm' : ''}`}>Vorige</span>
              </button>

              {/* Dots Indicator */}
              {(!nested && showDots) && (
                <div className="flex items-center gap-2 z-20">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => goToSlide(idx, e)}
                      disabled={isAnimating || disabled}
                      className={`h-2 rounded-full transition-all pointer-events-auto ${
                        idx === currentIndex 
                          ? 'w-8 bg-accent-500' 
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      } disabled:opacity-50`}
                      aria-label={`Ga naar item ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={(e) => goToNext(e)}
                disabled={isAnimating || disabled}
                className={`flex items-center gap-2 ${nested ? 'px-2 py-1 text-sm' : 'px-4 py-2'} bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-20`}
                aria-label="Volgende item"
              >
                <span className={`hidden sm:inline ${nested ? 'text-sm' : ''}`}>Volgende</span>
                <Icon name="chevron-right" className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Counter */}
          {(!nested && showCounter) && (
            <div className="text-center mt-2 text-sm text-gray-600">
              Item {currentIndex + 1} van {items.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
