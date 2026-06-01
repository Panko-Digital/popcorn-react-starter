/**
 * VideoPlayer
 *
 * Inline, interactive video player for hosted media from the Popcorn CMS media
 * library. Unlike `VideoBackground` (which is a decorative full-screen loop),
 * this component renders a user-controlled player with play/pause controls,
 * volume, and seek — suitable for content areas where a visitor intentionally
 * watches a video.
 *
 * Supports:
 * - Direct-hosted video (mp4 / webm / ogg) via a GCS / CDN URL
 * - Optional poster image (shown before play)
 * - Optional caption rendered below the player
 *
 * @example
 * ```tsx
 * // Basic usage — supply the mediaUrl from a CMS 'video' element
 * <VideoPlayer
 *   src={content['intro-video']?.mediaUrl}
 *   caption={content['intro-video']?.caption}
 * />
 *
 * // With a poster thumbnail
 * <VideoPlayer
 *   src="https://storage.googleapis.com/my-bucket/hero.mp4"
 *   poster="https://storage.googleapis.com/my-bucket/hero-thumb.jpg"
 *   caption="Watch our 2-minute overview"
 *   className="rounded-xl shadow-lg"
 * />
 * ```
 */

import { useRef, useState } from "react";

interface VideoPlayerProps {
  /** GCS / CDN URL of the hosted video file (mp4, webm, ogg) */
  src?: string | null;
  /** Poster image shown before playback starts (e.g. a thumbnail screenshot) */
  poster?: string | null;
  /** Caption text rendered beneath the player */
  caption?: string | null;
  /** Additional className applied to the outer wrapper */
  className?: string;
  /** Force-override the intrinsic aspect ratio. Defaults to 16/9 */
  aspectRatio?: "16/9" | "4/3" | "1/1" | "9/16";
}

const ASPECT_CLASSES: Record<
  NonNullable<VideoPlayerProps["aspectRatio"]>,
  string
> = {
  "16/9": "aspect-video", // Tailwind utility
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "9/16": "aspect-[9/16]",
};

export function VideoPlayer({
  src,
  poster,
  caption,
  className = "",
  aspectRatio = "16/9",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  if (!src) return null;

  return (
    <figure className={`w-full ${className}`}>
      <div
        className={`relative w-full bg-black rounded-lg overflow-hidden ${ASPECT_CLASSES[aspectRatio]}`}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Video unavailable
          </div>
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            src={src}
            poster={poster ?? undefined}
            controls
            playsInline
            preload="metadata"
            onError={() => setError(true)}
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-gray-500 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
