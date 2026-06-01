/**
 * Content rendering utilities shared between components.
 */

/**
 * Returns true when the given HTML string contains at least one `<iframe` tag.
 *
 * Used by ContentBlock to decide whether to apply a responsive embed wrapper
 * around HTML elements (YouTube / Vimeo / Genially / etc.).
 */
export function containsIframe(html: string): boolean {
    return /<iframe\b/i.test(html);
}

/**
 * Detects whether a URL points to a video file by its extension.
 *
 * Used as a secondary hint when element.type is not 'video' but the mediaUrl
 * looks like a hosted video (e.g. legacy data, or type='html' with a direct
 * video src).
 */
export function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}
