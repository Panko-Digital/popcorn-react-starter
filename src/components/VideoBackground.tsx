/**
 * VideoBackground
 *
 * Full-screen video background intended for use inside a `relative` or
 * `fixed` positioned container. The video fills the parent with
 * `object-cover` and a semi-transparent darkening overlay is layered on
 * top to keep any text above it legible.
 *
 * Video plays silently (muted) and loops continuously — this matches the
 * behaviour of the `video-background` element type in the CMS.
 *
 * @example
 * ```tsx
 * // Inside a min-h-screen relative container
 * <div className="relative min-h-screen">
 *   <VideoBackground src="https://cdn.example.com/hero.mp4" overlayOpacity={0.5} />
 *   <div className="relative z-10">Your overlay content</div>
 * </div>
 * ```
 */

interface VideoBackgroundProps {
    /** GCS / CDN URL of the video file (.mp4 or .webm recommended) */
    src: string;
    /** Poster image shown before the video starts (e.g. a thumbnail screenshot) */
    poster?: string;
    /** 0–1 darkening overlay opacity for text legibility (default 0.45) */
    overlayOpacity?: number;
    /** Additional className applied to the root wrapper */
    className?: string;
}

export function VideoBackground({
    src,
    poster,
    overlayOpacity = 0.45,
    className = '',
}: VideoBackgroundProps) {
    if (!src) return null;

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption — background decoration, no captions needed */}
            <video
                className="absolute inset-0 w-full h-full object-cover"
                src={src}
                poster={poster}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
            />
            {/* Darkening scrim — makes overlay text readable */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
                aria-hidden="true"
            />
        </div>
    );
}
