import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
  /** If true, this item spans 2 columns (good for first/feature image) */
  wide?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  /** Columns on large screens (default 4) */
  columns?: 2 | 3 | 4;
  className?: string;
}

const colClasses: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

/**
 * Responsive tiled image gallery with a keyboard-navigable lightbox.
 * The first item can be marked `wide` to span 2 columns as a feature image.
 */
export function ImageGallery({ images, columns = 4, className = "" }: ImageGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const isOpen = lightboxIdx !== null;
  const current = lightboxIdx !== null ? images[lightboxIdx] : null;

  const open = useCallback((idx: number) => setLightboxIdx(idx), []);
  const close = useCallback(() => setLightboxIdx(null), []);
  const prev = useCallback(() =>
    setLightboxIdx((i) => (i === null ? 0 : (i - 1 + images.length) % images.length)),
    [images.length]);
  const next = useCallback(() =>
    setLightboxIdx((i) => (i === null ? 0 : (i + 1) % images.length)),
    [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close, prev, next]);

  // Focus trap: move focus to close button when lightbox opens
  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);

  if (!images.length) return null;

  return (
    <>
      <div className={`grid ${colClasses[columns] ?? colClasses[4]} gap-2 ${className}`}>
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => open(idx)}
            className={`group relative overflow-hidden rounded-xl cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              img.wide ? "col-span-2 aspect-[2/1]" : "aspect-square"
            }`}
            aria-label={img.alt ?? `Open image ${idx + 1}`}
          >
            <img
              src={img.src}
              alt={img.alt ?? ""}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-end p-3">
              {img.caption && (
                <span className="text-white text-xs font-semibold opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  {img.caption}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox portal */}
      {isOpen && current && createPortal(
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close */}
          <button
            ref={closeBtnRef}
            onClick={close}
            aria-label="Close lightbox"
            className="absolute top-4 right-5 text-white/80 hover:text-white text-4xl leading-none bg-transparent border-0 cursor-pointer"
          >
            &times;
          </button>

          {/* Prev */}
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white border-0 cursor-pointer transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Image */}
          <img
            key={current.id}
            src={current.src}
            alt={current.alt ?? ""}
            className="max-w-[90vw] max-h-[80vh] rounded-lg object-contain shadow-2xl"
          />

          {/* Caption */}
          {current.caption && (
            <p className="mt-3 text-white/85 text-sm max-w-[60ch] text-center">
              {current.caption}
            </p>
          )}

          {/* Counter */}
          <p className="mt-2 text-white/40 text-xs">
            {(lightboxIdx ?? 0) + 1} / {images.length}
          </p>

          {/* Next */}
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white border-0 cursor-pointer transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
