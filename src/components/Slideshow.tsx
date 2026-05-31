import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Slide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

interface SlideshowProps {
  slides: Slide[];
  /** Milliseconds between auto-advances (default 4800) */
  autoplayDelay?: number;
  /** Height class for the slide images (default "h-[480px]") */
  heightClass?: string;
  className?: string;
}

/**
 * Full-width hero slideshow with auto-advance, prev/next arrows,
 * dot indicators, and a gradient caption overlay.
 */
export function Slideshow({
  slides,
  autoplayDelay = 4800,
  heightClass = "h-[480px]",
  className = "",
}: SlideshowProps) {
  const autoplay = useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplay.current,
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!slides.length) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gray-900 ${className}`}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div key={slide.id} className="flex-none w-full min-w-0 relative">
              <img
                src={slide.imageUrl}
                alt={slide.title ?? ""}
                className={`w-full ${heightClass} object-cover block`}
              />
              {(slide.title || slide.ctaLabel) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-8 py-6 text-white">
                  {slide.title && (
                    <h3 className="text-2xl font-bold mb-1 leading-tight">
                      {slide.title}
                    </h3>
                  )}
                  {slide.subtitle && (
                    <p className="text-sm opacity-85 mb-3">{slide.subtitle}</p>
                  )}
                  {slide.ctaLabel && slide.ctaHref && (
                    <a
                      href={slide.ctaHref}
                      className="inline-block px-5 py-2 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      {slide.ctaLabel}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prev */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/85 hover:bg-white shadow-md transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Next */}
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/85 hover:bg-white shadow-md transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2 h-2 rounded-full border-0 transition-all duration-200 ${
                i === selectedIndex ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
