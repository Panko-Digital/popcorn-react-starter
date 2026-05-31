import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

export interface CarouselItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  caption?: string;
  link?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  /** Number of slides visible at once on desktop (default 3) */
  slidesPerView?: number;
  className?: string;
}

/**
 * Horizontal drag-and-scroll carousel with prev/next navigation.
 * Backed by Embla Carousel — works with any content type.
 */
export function Carousel({
  items,
  slidesPerView = 3,
  className = "",
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!items.length) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Prev button */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        aria-label="Previous"
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Track */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-none"
              style={{
                width: `calc((100% - ${(slidesPerView - 1) * 20}px) / ${slidesPerView})`,
              }}
            >
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg mb-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 flex-1">
                      {item.description}
                    </p>
                  )}
                  {item.caption && (
                    <p className="mt-2 text-xs uppercase tracking-wider text-gray-400">
                      {item.caption}
                    </p>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      View details
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        aria-label="Next"
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
