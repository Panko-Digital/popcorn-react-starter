/**
 * BackgroundSlideshow
 *
 * Full-screen image slideshow background intended for splash/landing pages.
 * Crossfades between images on a timer. Renders behind overlay content.
 *
 * @example
 * ```tsx
 * <div className="relative min-h-screen">
 *   <BackgroundSlideshow
 *     images={['https://cdn/img1.jpg', 'https://cdn/img2.jpg']}
 *     interval={5000}
 *     overlayOpacity={0.4}
 *   />
 *   <div className="relative z-10">Your overlay content</div>
 * </div>
 * ```
 */

import { useState, useEffect, useCallback } from "react";

interface BackgroundSlideshowProps {
  /** Array of image URLs to cycle through */
  images: string[];
  /** Time between transitions in ms (default: 5000) */
  interval?: number;
  /** Dark overlay opacity 0–1 (default: 0.4) */
  overlayOpacity?: number;
  /** Transition duration in ms (default: 1200) */
  transitionDuration?: number;
  className?: string;
}

export function BackgroundSlideshow({
  images,
  interval = 5000,
  overlayOpacity = 0.4,
  transitionDuration = 1200,
  className = "",
}: BackgroundSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [advance, interval, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: index === currentIndex ? 1 : 0,
            transition: `opacity ${transitionDuration}ms ease-in-out`,
            zIndex: index === currentIndex ? 1 : 0,
          }}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})`, zIndex: 2 }}
        aria-hidden="true"
      />
    </div>
  );
}
