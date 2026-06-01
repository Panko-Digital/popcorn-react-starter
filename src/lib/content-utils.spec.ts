/**
 * Tests for content rendering utilities.
 */
import { describe, it, expect } from 'vitest';
import { containsIframe, isVideoUrl } from './content-utils';

// ─── containsIframe ───────────────────────────────────────────────────────────

describe('containsIframe', () => {
    it('returns true for a standard YouTube embed', () => {
        const html = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>';
        expect(containsIframe(html)).toBe(true);
    });

    it('returns true for a Vimeo embed', () => {
        const html = '<iframe src="https://player.vimeo.com/video/123456" width="640" height="360" frameborder="0"></iframe>';
        expect(containsIframe(html)).toBe(true);
    });

    it('returns true for a Genially embed', () => {
        const html = '<div style="width:100%"><iframe allow="fullscreen" src="https://view.genially.com/abc123"></iframe></div>';
        expect(containsIframe(html)).toBe(true);
    });

    it('returns true regardless of iframe tag casing (IFRAME, Iframe)', () => {
        expect(containsIframe('<IFRAME src="https://example.com"></IFRAME>')).toBe(true);
        expect(containsIframe('<Iframe src="https://example.com"></Iframe>')).toBe(true);
    });

    it('returns true when iframe is buried in surrounding HTML', () => {
        const html = '<div class="embed-container"><p>Watch this:</p><iframe src="https://example.com/embed"></iframe></div>';
        expect(containsIframe(html)).toBe(true);
    });

    it('returns false for plain text', () => {
        expect(containsIframe('Hello world')).toBe(false);
    });

    it('returns false for HTML that has no iframe', () => {
        const html = '<div><p>Some <strong>rich</strong> text content.</p><ul><li>Item</li></ul></div>';
        expect(containsIframe(html)).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(containsIframe('')).toBe(false);
    });

    it('does not false-positive on the word "iframe" in text content', () => {
        // The word alone without < does not match
        expect(containsIframe('An iframe is a useful HTML element')).toBe(false);
    });

    it('returns true when src appears before the iframe tag closes', () => {
        // Minimal self-closing variant used by some embed generators
        const html = '<iframe src="https://example.com/embed" />';
        expect(containsIframe(html)).toBe(true);
    });
});

// ─── isVideoUrl ───────────────────────────────────────────────────────────────

describe('isVideoUrl', () => {
    it('returns true for .mp4 URLs', () => {
        expect(isVideoUrl('https://storage.googleapis.com/bucket/video.mp4')).toBe(true);
    });

    it('returns true for .webm URLs', () => {
        expect(isVideoUrl('https://cdn.example.com/media/clip.webm')).toBe(true);
    });

    it('returns true for .ogg URLs', () => {
        expect(isVideoUrl('https://cdn.example.com/audio.ogg')).toBe(true);
    });

    it('returns true for extension-only URL path (no host)', () => {
        expect(isVideoUrl('/local/video.mp4')).toBe(true);
    });

    it('returns true when a query string follows the extension', () => {
        expect(isVideoUrl('https://cdn.example.com/video.mp4?token=abc123')).toBe(true);
    });

    it('returns true regardless of extension casing', () => {
        expect(isVideoUrl('https://cdn.example.com/video.MP4')).toBe(true);
        expect(isVideoUrl('https://cdn.example.com/video.WebM')).toBe(true);
    });

    it('returns false for image URLs', () => {
        expect(isVideoUrl('https://cdn.example.com/photo.jpg')).toBe(false);
        expect(isVideoUrl('https://cdn.example.com/photo.png')).toBe(false);
        expect(isVideoUrl('https://cdn.example.com/photo.gif')).toBe(false);
    });

    it('returns false for YouTube watch URLs (not a direct file)', () => {
        expect(isVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isVideoUrl('')).toBe(false);
    });
});
