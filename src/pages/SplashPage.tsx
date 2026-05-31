/**
 * SplashPage
 *
 * Renders a full-screen splash / landing screen driven by a CMS page.
 *
 * ## CMS content model
 * The CMS page (slug: 'splash' by default, isSplash: true) should have:
 *
 *   Content area (ref: 'splash-background', order: 0)
 *     └── BlockElement  type: 'video-background'  mediaUrl: 'https://cdn/.../hero.mp4'
 *                       config: { overlayOpacity: 0.45 }
 *
 *   Content area (ref: 'splash-overlay', order: 1)
 *     ├── BlockElement  type: 'html'  content: '<div class="...">...</div>'
 *     └── BlockElement  type: 'heading'  content: 'Welcome'
 *
 * ## Modes
 * - **scroll-through** (default): the splash takes `min-h-screen`; the rest of
 *   the page is below it and the user scrolls naturally.
 * - **enter-button**: the splash is `position: fixed`, covering everything.
 *   When the user clicks Enter, the overlay dismisses and react-router navigates
 *   to `enterTo`.
 *
 * ## Usage (SPA scroll-through)
 * ```tsx
 * <section id="splash">
 *   <SplashPage mode="scroll-through" />
 * </section>
 * ```
 *
 * ## Usage (multi-page enter-button)
 * ```tsx
 * // In the splash route (e.g. path="/"):
 * <SplashPage mode="enter-button" enterTo="/home" enterLabel="Enter Site" />
 * ```
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageData } from '../hooks/usePageData';
import { VideoBackground } from '../components/VideoBackground';

interface SplashPageProps {
    /** CMS page slug to load (default: 'splash') */
    slug?: string;
    /**
     * Interaction mode:
     * - 'scroll-through' — splash takes vh-100; user scrolls down to see content
     * - 'enter-button'   — fixed overlay; Enter button dismisses and navigates
     */
    mode?: 'scroll-through' | 'enter-button';
    /** Path to navigate to on Enter click (enter-button mode). Default '/home' */
    enterTo?: string;
    /** Enter button label. Default 'Enter' */
    enterLabel?: string;
    /**
     * Content-area ref of the block that holds the video-background element.
     * Default 'splash-background'.
     */
    videoBlockRef?: string;
    /**
     * Called when the Enter button is clicked (enter-button mode only).
     * If provided, this callback fires instead of (or in addition to) react-router
     * navigation — useful for SPA mode where you want to toggle state in the
     * parent rather than navigate to a new route.
     */
    onEnter?: () => void;
}

/**
 * Renders a single CMS element as part of the splash overlay.
 * 'video-background' elements are handled at the container level and
 * are intentionally skipped here.
 */
function SplashElement({ el }: { el: any }) {
    switch (el.type) {
        case 'html':
            return (
                <div
                    className="text-white [&_a]:text-white/80 [&_a:hover]:text-white"
                    // Content comes from trusted CMS — same as all other html elements in the boilerplate
                    dangerouslySetInnerHTML={{ __html: el.content || '' }}
                />
            );
        case 'heading':
            return (
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-4 drop-shadow-2xl leading-tight">
                    {el.content || ''}
                </h1>
            );
        case 'text':
            return (
                <p className="text-lg md:text-2xl text-white/80 text-center mb-6 drop-shadow max-w-2xl">
                    {el.content || ''}
                </p>
            );
        case 'image':
            return el.mediaUrl ? (
                <img
                    src={el.mediaUrl}
                    alt={el.content || ''}
                    className="max-w-[240px] mx-auto mb-8 drop-shadow-2xl"
                />
            ) : null;
        case 'video-background':
            // Handled at the container level — skip here
            return null;
        default:
            return el.content ? (
                <p className="text-white/70 text-center">{el.content}</p>
            ) : null;
    }
}

export function SplashPage({
    slug = 'splash',
    mode = 'scroll-through',
    enterTo = '/home',
    enterLabel = 'Enter',
    videoBlockRef = 'splash-background',
    onEnter,
}: SplashPageProps) {
    const { pageData, isLoading } = usePageData(slug);
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    const handleEnter = () => {
        if (onEnter) {
            onEnter();
        }
        if (mode === 'enter-button') {
            setDismissed(true);
            // Only navigate if enterTo is a path (starts with '/') — hash targets
            // are for SPA scroll-through mode, handled by onEnter from the parent
            if (enterTo.startsWith('/')) {
                navigate(enterTo);
            }
        }
    };

    // In enter-button mode, remove from DOM once dismissed so underlying content
    // is fully interactive
    if (dismissed) return null;

    if (isLoading || !pageData) {
        return (
            <div
                className={
                    mode === 'enter-button'
                        ? 'fixed inset-0 z-50 bg-black'
                        : 'relative min-h-screen bg-black'
                }
                aria-busy="true"
            />
        );
    }

    // ── Locate the video element ────────────────────────────────────────────
    // Try the designated video block first; fall back to any block with a
    // video-background element.
    const videoBlock =
        pageData.blocks.find((b) => b.ref === videoBlockRef) ||
        pageData.blocks.find((b) =>
            b.elements.some((el) => el.type === 'video-background'),
        );

    const videoEl =
        videoBlock?.elements.find((el) => el.type === 'video-background') ||
        pageData.blocks
            .flatMap((b) => b.elements)
            .find((el) => el.type === 'video-background');

    const videoSrc = videoEl?.mediaUrl || '';
    const videoConfig: Record<string, any> = (videoEl as any)?.config || {};
    const overlayOpacity =
        typeof videoConfig.overlayOpacity === 'number'
            ? videoConfig.overlayOpacity
            : 0.45;

    // ── Locate overlay blocks ────────────────────────────────────────────────
    // Everything that is NOT the video background block
    const overlayBlocks = pageData.blocks.filter(
        (b) => b !== videoBlock,
    );

    // ── Positioning ─────────────────────────────────────────────────────────
    const containerClass =
        mode === 'enter-button'
            ? 'fixed inset-0 z-50 flex items-center justify-center'
            : 'relative min-h-screen flex items-center justify-center overflow-hidden';

    return (
        <div className={containerClass} aria-label="Splash screen">
            {/* Full-screen video background */}
            {videoSrc && (
                <VideoBackground src={videoSrc} overlayOpacity={overlayOpacity} />
            )}

            {/* Overlay content from CMS blocks (order 1+) */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-16 gap-4">
                {overlayBlocks.map((block) => (
                    <div key={block.id} className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4">
                        {block.elements.map((el) => (
                            <SplashElement key={el.id} el={el} />
                        ))}
                    </div>
                ))}

                {/* Enter button — only in enter-button mode */}
                {mode === 'enter-button' && (
                    <button
                        onClick={handleEnter}
                        className="mt-8 px-10 py-4 rounded-full text-white font-medium text-lg border-2 border-white/50 hover:border-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                        {enterLabel}
                    </button>
                )}

                {/* Scroll indicator — only in scroll-through mode */}
                {mode === 'scroll-through' && (
                    <div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 select-none pointer-events-none"
                        aria-hidden="true"
                    >
                        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
                        <svg
                            className="animate-bounce"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
