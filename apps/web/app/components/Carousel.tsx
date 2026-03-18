import React, { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
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
  const emblaOptions = { loop: true, skipSnaps: false, align: 'center', containScroll: 'trimSnaps' };
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setSelectedIndex(idx);
      onIndexChange?.(idx);
    };
    emblaApi.on('select', onSelect);
    // initialize
    onSelect();
    // animation: update slide transforms based on scroll position
    const update = () => {
      if (!emblaApi) return;
      const snaps = emblaApi.scrollSnapList();
      const progress = emblaApi.scrollProgress();
      const slides = emblaApi.slideNodes();

      slides.forEach((slide: HTMLElement, i: number) => {
        const snap = snaps[i];
        let diff = progress - snap;
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;
        const abs = Math.abs(diff);

        const scale = 1 - Math.min(abs * 0.5, 0.22);
        const opacity = 1 - Math.min(abs * 0.6, 0.7);
        const translateY = Math.min(abs * 28, 28);

        slide.style.willChange = 'transform, opacity';
        slide.style.transition = 'transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease';
        slide.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
        slide.style.opacity = `${Math.max(opacity, 0.3)}`;
      });
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    emblaApi.on('scroll', onScroll);
    // initial update to set styles
    update();
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [emblaApi, onIndexChange]);

  // Keyboard navigation (left / right) while embla is initialized
  useEffect(() => {
    if (!emblaApi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        emblaApi.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        emblaApi.scrollNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [emblaApi]);

  // Controlled index support
  useEffect(() => {
    if (controlledIndex !== undefined && emblaApi) {
      emblaApi.scrollTo(controlledIndex);
    }
  }, [controlledIndex, emblaApi]);

  if (!items || items.length === 0) return null;

  const prev = () => {
    if (disabled || !emblaApi) return;
    emblaApi.scrollPrev();
  };

  const next = () => {
    if (disabled || !emblaApi) return;
    emblaApi.scrollNext();
  };

  const goTo = (index: number) => {
    if (disabled || !emblaApi) return;
    emblaApi.scrollTo(index);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`embla w-full overflow-hidden ${nested ? '' : ''}`} ref={emblaRef}>
        <div className={`embla__container flex max-w-full ${itemClassName}`}>
          {items.map((it, idx) => (
            <div key={idx} className="embla__slide flex-shrink-0 w-full overflow-hidden">
              {renderItem(it, idx)}
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex-shrink-0 mt-4">
          {showControls && (
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={prev}
                disabled={disabled}
                className={`flex items-center gap-2 ${nested ? 'px-2 py-1 text-sm' : 'px-4 py-2'} bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-20`}
                aria-label="Vorige item"
              >
                <Icon name="chevron-left" className="w-5 h-5" />
                <span className={`hidden sm:inline ${nested ? 'text-sm' : ''}`}>Vorige</span>
              </button>

              {(!nested && showDots) && (
                <div className="flex items-center gap-2 z-20">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goTo(idx)}
                      disabled={disabled}
                      className={`h-2 rounded-full transition-all pointer-events-auto ${
                        idx === selectedIndex
                          ? 'w-8 bg-accent-500'
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      } disabled:opacity-50`}
                      aria-label={`Ga naar item ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={next}
                disabled={disabled}
                className={`flex items-center gap-2 ${nested ? 'px-2 py-1 text-sm' : 'px-4 py-2'} bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-20`}
                aria-label="Volgende item"
              >
                <span className={`hidden sm:inline ${nested ? 'text-sm' : ''}`}>Volgende</span>
                <Icon name="chevron-right" className="w-5 h-5" />
              </button>
            </div>
          )}

          {(!nested && showCounter) && (
            <div className="text-center mt-2 text-sm text-gray-600">
              Item {selectedIndex + 1} van {items.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
