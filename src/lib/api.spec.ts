/**
 * Tests for the public API client extraction utilities.
 *
 * These pure functions transform a full CMSPage response (from GET /public/pages/:slug)
 * into the discrete pieces that React components actually render — content fields,
 * list items, and dynamic content records.
 *
 * The key wiring under test:
 *   API response: blocks[].elements[{type:'collection', list:{items[]}}]
 *   → extractPageListContent(pageData, blockRef) → CMSListItem[]
 *   → components render items (e.g. Carousel, Slideshow, ImageGallery)
 */
import { describe, it, expect } from 'vitest';
import {
    extractPageContent,
    extractPageListContent,
    type CMSPage,
    type CMSElement,
    type CMSListItem,
} from './api';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeItems(count: number): CMSListItem[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i + 1}`,
        content: `Content ${i + 1}`,
        caption: `Caption ${i + 1}`,
        mediaUrl: `https://example.com/img${i}.jpg`,
        position: i,
    }));
}

function makeCollectionElement(overrides: Partial<CMSElement> = {}): CMSElement {
    return {
        id: 'el-collection-1',
        type: 'collection',
        ref: 'featured',
        order: 0,
        content: 'Photos',
        list: {
            id: 'list-1',
            items: makeItems(3),
        },
        ...overrides,
    };
}

function makePage(elements: CMSElement[], blockRef = 'hero'): CMSPage {
    return {
        id: 'page-1',
        slug: 'home',
        title: 'Home',
        description: null,
        publishedAt: '2024-01-01T00:00:00.000Z',
        blocks: [
            {
                id: 'block-1',
                ref: blockRef,
                name: 'Hero',
                order: 0,
                elements,
            },
        ],
    };
}

// ─── extractPageListContent ───────────────────────────────────────────────────

describe('extractPageListContent — collection type wiring', () => {
    it('returns list items from a "collection" type element', () => {
        const page = makePage([makeCollectionElement()]);
        const items = extractPageListContent(page, 'hero');
        expect(items).toHaveLength(3);
        expect(items[0]).toMatchObject({ id: 'item-0', title: 'Item 1' });
    });

    it('returns list items from a "list" type element (regression)', () => {
        const page = makePage([makeCollectionElement({ type: 'list' })]);
        const items = extractPageListContent(page, 'hero');
        expect(items).toHaveLength(3);
    });

    it('returns list items from a "list-reference" type element (regression)', () => {
        const page = makePage([makeCollectionElement({ type: 'list-reference' })]);
        const items = extractPageListContent(page, 'hero');
        expect(items).toHaveLength(3);
    });

    it('returns [] when the block ref does not exist', () => {
        const page = makePage([makeCollectionElement()]);
        expect(extractPageListContent(page, 'nonexistent')).toEqual([]);
    });

    it('returns [] when the element has no list property', () => {
        const el: CMSElement = makeCollectionElement({ list: undefined });
        const page = makePage([el]);
        expect(extractPageListContent(page, 'hero')).toEqual([]);
    });

    it('returns [] when the element list has no items', () => {
        const el = makeCollectionElement({ list: { id: 'list-empty', items: [] } });
        const page = makePage([el]);
        expect(extractPageListContent(page, 'hero')).toEqual([]);
    });

    it('sorts items by position ascending', () => {
        const shuffled = makeItems(4).reverse(); // positions 3,2,1,0
        const el = makeCollectionElement({ list: { id: 'list-1', items: shuffled } });
        const page = makePage([el]);
        const result = extractPageListContent(page, 'hero');
        const positions = result.map((i) => i.position);
        expect(positions).toEqual([0, 1, 2, 3]);
    });

    it('narrows to a specific element by elementRef', () => {
        // Block with two collection elements — only the second should be returned
        const first = makeCollectionElement({ id: 'el-1', ref: 'photos', type: 'collection' });
        const second = makeCollectionElement({
            id: 'el-2',
            ref: 'team',
            type: 'collection',
            list: { id: 'list-2', items: makeItems(5) },
        });
        const page = makePage([first, second]);
        const items = extractPageListContent(page, 'hero', 'team');
        expect(items).toHaveLength(5);
        expect(items[0].id).toBe('item-0');
    });

    it('returns all items when multiple blocks exist for the same ref', () => {
        // Only the first matching block is used
        const page: CMSPage = {
            ...makePage([makeCollectionElement()]),
            blocks: [
                { id: 'b1', ref: 'hero', name: 'A', order: 0, elements: [makeCollectionElement({ list: { id: 'l1', items: makeItems(2) } })] },
                { id: 'b2', ref: 'hero', name: 'B', order: 1, elements: [makeCollectionElement({ list: { id: 'l2', items: makeItems(4) } })] },
            ],
        };
        // Should return items from first matching block
        const items = extractPageListContent(page, 'hero');
        expect(items).toHaveLength(2);
    });
});

// ─── Full page → collection items wiring (simulated API response) ─────────────

describe('extractPageListContent — simulated real API response shape', () => {
    /**
     * This test reproduces the exact JSON shape returned by GET /public/pages/:slug
     * when a page has a "collection" element with a linked list.
     * It validates the full wiring:
     *   page.blocks[].elements[type=collection].list.items → CMSListItem[]
     */
    it('extracts gallery items from a page response matching the Popcorn public API shape', () => {
        const apiResponse: CMSPage = {
            id: 'page-gallery',
            slug: 'portfolio',
            title: 'Portfolio',
            description: null,
            publishedAt: '2024-05-01T00:00:00.000Z',
            blocks: [
                {
                    id: 'area-hero',
                    ref: 'gallery-section',
                    name: 'Gallery',
                    order: 0,
                    elements: [
                        {
                            id: 'el-heading',
                            type: 'heading',
                            ref: 'gallery-heading',
                            order: 0,
                            content: 'Our Portfolio',
                        },
                        {
                            // This is what the API returns for a collection element
                            // type is 'collection', list is eagerly joined by Prisma include
                            id: 'el-gallery',
                            type: 'collection',
                            ref: 'gallery-photos',
                            order: 1,
                            content: 'Photo Gallery',
                            list: {
                                id: 'list-photos',
                                items: [
                                    { id: 'ph-1', title: 'Photo A', content: 'description', caption: 'Summer', mediaUrl: 'https://cdn.example.com/a.jpg', position: 0 },
                                    { id: 'ph-2', title: 'Photo B', content: null as unknown as string, caption: null, mediaUrl: 'https://cdn.example.com/b.jpg', position: 1 },
                                    { id: 'ph-3', title: 'Photo C', content: null as unknown as string, caption: 'Winter', mediaUrl: null, position: 2 },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const photos = extractPageListContent(apiResponse, 'gallery-section');

        // The three photos should all be returned
        expect(photos).toHaveLength(3);
        expect(photos[0]).toMatchObject({ id: 'ph-1', title: 'Photo A', mediaUrl: 'https://cdn.example.com/a.jpg', position: 0 });
        expect(photos[1]).toMatchObject({ id: 'ph-2', mediaUrl: 'https://cdn.example.com/b.jpg' });
        expect(photos[2]).toMatchObject({ id: 'ph-3', mediaUrl: null });

        // These items are ready for Slideshow / ImageGallery / Carousel components
        photos.forEach((item) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('position');
        });
    });

    it('extracts slideshow items for a carousel/slideshow collection display', () => {
        const apiResponse: CMSPage = {
            id: 'page-home',
            slug: 'home',
            title: 'Home',
            description: null,
            publishedAt: '2024-01-01T00:00:00.000Z',
            blocks: [
                {
                    id: 'area-featured',
                    ref: 'featured',
                    name: 'Featured',
                    order: 0,
                    elements: [
                        {
                            id: 'el-slideshow',
                            type: 'collection',
                            ref: 'hero-slideshow',
                            order: 0,
                            content: 'Hero Slides',
                            // config would carry { display: 'slideshow' } — not used by extraction
                            list: {
                                id: 'list-slides',
                                items: [
                                    { id: 's-1', title: 'Slide 1', content: 'Welcome', caption: null, mediaUrl: 'https://cdn.example.com/slide1.jpg', position: 0 },
                                    { id: 's-2', title: 'Slide 2', content: 'Explore', caption: null, mediaUrl: 'https://cdn.example.com/slide2.jpg', position: 1 },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const slides = extractPageListContent(apiResponse, 'featured');

        expect(slides).toHaveLength(2);
        expect(slides.map((s) => s.title)).toEqual(['Slide 1', 'Slide 2']);
        expect(slides.every((s) => s.mediaUrl)).toBe(true); // all have images
    });
});

// ─── extractPageContent (regression — ensure we didn't break text fields) ────

describe('extractPageContent — regression', () => {
    it('still extracts text content elements correctly', () => {
        const page = makePage([
            { id: 'el-h', type: 'heading', ref: 'page-title', order: 0, content: 'Hello World' },
            { id: 'el-t', type: 'text', ref: 'page-body', order: 1, content: 'Some body text' },
        ]);
        const content = extractPageContent(page, 'hero');
        expect(content['page-title']).toMatchObject({ type: 'heading', value: 'Hello World' });
        expect(content['page-body']).toMatchObject({ type: 'text', value: 'Some body text' });
    });
});

// ─── Splash page — CMSPage.isSplash / CMSElement.config ──────────────────────

describe('CMSPage and CMSElement — splash page fields', () => {
    it('CMSPage accepts isSplash: true and a config object', () => {
        const page: CMSPage = {
            ...makePage([]),
            isSplash: true,
            config: { splashMode: 'scroll-through', enterTo: '/home', enterLabel: 'Enter' },
        };
        expect(page.isSplash).toBe(true);
        expect(page.config?.splashMode).toBe('scroll-through');
        expect(page.config?.enterLabel).toBe('Enter');
    });

    it('isSplash is undefined when not set (optional field)', () => {
        const page = makePage([]);
        expect(page.isSplash).toBeUndefined();
        expect(page.config).toBeUndefined();
    });

    it('CMSElement accepts a config object (e.g. overlayOpacity for video-background)', () => {
        const el: CMSElement = {
            id: 'el-vb',
            type: 'video-background',
            ref: 'splash-bg',
            order: 0,
            content: '',
            mediaUrl: 'https://cdn.example.com/hero.mp4',
            config: { overlayOpacity: 0.45 },
        };
        expect(el.type).toBe('video-background');
        expect(el.config?.overlayOpacity).toBe(0.45);
        expect(el.mediaUrl).toBe('https://cdn.example.com/hero.mp4');
    });

    it('extractPageContent returns mediaUrl for a video-background element', () => {
        const el: CMSElement = {
            id: 'el-vb',
            type: 'video-background',
            ref: 'splash-bg',
            order: 0,
            content: '',
            mediaUrl: 'https://cdn.example.com/hero.mp4',
            config: { overlayOpacity: 0.45 },
        };
        const page = makePage([el]);
        const content = extractPageContent(page, 'hero');
        expect(content['splash-bg']).toMatchObject({
            type: 'video-background',
            value: '',
            mediaUrl: 'https://cdn.example.com/hero.mp4',
        });
    });

    it('extractPageContent still works normally on a page with isSplash: true', () => {
        const page: CMSPage = {
            id: 'page-splash',
            slug: 'splash',
            title: 'Splash',
            description: null,
            publishedAt: '2024-01-01T00:00:00.000Z',
            isSplash: true,
            config: { splashMode: 'enter-button', enterTo: '/home', enterLabel: 'Enter Site' },
            blocks: [
                {
                    id: 'area-overlay',
                    ref: 'splash-overlay',
                    name: 'Overlay',
                    order: 0,
                    elements: [
                        { id: 'el-1', type: 'heading', ref: 'splash-title', order: 0, content: 'Welcome' },
                    ],
                },
            ],
        };
        const content = extractPageContent(page, 'splash-overlay');
        expect(content['splash-title']).toMatchObject({ type: 'heading', value: 'Welcome' });
    });
});

// ─── VideoPlayer / ContentBlock — caption and video element wiring ────────────

describe('CMSElement — video and image caption wiring', () => {
    it('CMSElement accepts a caption field', () => {
        const el: CMSElement = {
            id: 'el-video',
            type: 'video',
            ref: 'intro-video',
            order: 0,
            content: '',
            mediaUrl: 'https://storage.googleapis.com/bucket/intro.mp4',
            caption: 'Watch our 2-minute overview',
        };
        expect(el.caption).toBe('Watch our 2-minute overview');
        expect(el.mediaUrl).toBe('https://storage.googleapis.com/bucket/intro.mp4');
    });

    it('CMSElement caption is optional (undefined when absent)', () => {
        const el: CMSElement = {
            id: 'el-img',
            type: 'image',
            ref: 'hero-image',
            order: 0,
            content: '',
            mediaUrl: 'https://storage.googleapis.com/bucket/hero.jpg',
        };
        expect(el.caption).toBeUndefined();
    });
});

describe('extractPageContent — video element with caption', () => {
    it('returns mediaUrl and caption for a video element', () => {
        const el: CMSElement = {
            id: 'el-video',
            type: 'video',
            ref: 'intro-video',
            order: 0,
            content: '',
            mediaUrl: 'https://storage.googleapis.com/bucket/intro.mp4',
            caption: 'Watch our 2-minute overview',
        };
        const page = makePage([el]);
        const content = extractPageContent(page, 'hero');
        expect(content['intro-video']).toMatchObject({
            type: 'video',
            value: '',
            mediaUrl: 'https://storage.googleapis.com/bucket/intro.mp4',
            caption: 'Watch our 2-minute overview',
        });
    });

    it('returns mediaUrl and caption for an image element', () => {
        const el: CMSElement = {
            id: 'el-img',
            type: 'image',
            ref: 'team-photo',
            order: 0,
            content: '',
            mediaUrl: 'https://storage.googleapis.com/bucket/team.jpg',
            caption: 'The founding team, 2024',
        };
        const page = makePage([el]);
        const content = extractPageContent(page, 'hero');
        expect(content['team-photo']).toMatchObject({
            type: 'image',
            mediaUrl: 'https://storage.googleapis.com/bucket/team.jpg',
            caption: 'The founding team, 2024',
        });
    });

    it('omits caption key when caption is absent', () => {
        const el: CMSElement = {
            id: 'el-img',
            type: 'image',
            ref: 'hero-image',
            order: 0,
            content: '',
            mediaUrl: 'https://storage.googleapis.com/bucket/hero.jpg',
        };
        const page = makePage([el]);
        const content = extractPageContent(page, 'hero');
        expect(content['hero-image']).not.toHaveProperty('caption');
    });

    it('preserves caption when multiple elements with different types coexist', () => {
        const elements: CMSElement[] = [
            { id: 'el-h', type: 'heading', ref: 'section-title', order: 0, content: 'About Us' },
            {
                id: 'el-v',
                type: 'video',
                ref: 'about-video',
                order: 1,
                content: '',
                mediaUrl: 'https://storage.googleapis.com/bucket/about.mp4',
                caption: 'Our story in 90 seconds',
            },
            { id: 'el-t', type: 'text', ref: 'section-body', order: 2, content: 'We build great things.' },
        ];
        const page = makePage(elements);
        const content = extractPageContent(page, 'hero');
        expect(content['section-title']).toMatchObject({ type: 'heading', value: 'About Us' });
        expect(content['about-video']).toMatchObject({
            type: 'video',
            caption: 'Our story in 90 seconds',
            mediaUrl: 'https://storage.googleapis.com/bucket/about.mp4',
        });
        expect(content['section-body']).toMatchObject({ type: 'text', value: 'We build great things.' });
        expect(content['section-body']).not.toHaveProperty('caption');
    });

    it('ContentField type: video element flows through to VideoPlayer props without cast', () => {
        // This test validates the TypeScript contract at runtime:
        // ContentField.caption is a string, matching VideoPlayer's caption prop type.
        const el: CMSElement = {
            id: 'el-v',
            type: 'video',
            ref: 'promo',
            order: 0,
            content: '',
            mediaUrl: 'https://cdn.example.com/promo.mp4',
            caption: 'Special offer',
        };
        const page = makePage([el]);
        const field = extractPageContent(page, 'hero')['promo'];
        // Simulate what a page component does: pass to VideoPlayer
        const src: string | undefined = field.mediaUrl;
        const caption: string | undefined = field.caption;
        expect(src).toBe('https://cdn.example.com/promo.mp4');
        expect(caption).toBe('Special offer');
    });
});
