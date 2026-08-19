/**
 * Blueprint → CSS custom properties.
 *
 * The site's design tokens are applied once as CSS variables on a root wrapper
 * rather than threaded through every component as props. Element renderers then
 * reference `var(--site-*)`, so adding a new component does not mean plumbing
 * theme props through the tree.
 *
 * Anything the blueprint does not specify simply falls back to the CSS defaults
 * declared in `index.css`.
 */
import type { CSSProperties } from 'react';
import type { SiteBlueprint } from './api';

/** Fonts that need no webfont request. */
const SYSTEM_FONTS = new Set(['sans-serif', 'serif', 'monospace', 'system-ui', 'inherit']);

type CSSVariables = CSSProperties & Record<`--${string}`, string | undefined>;

/**
 * Build the inline style object holding every design token.
 */
export function blueprintToCssVariables(blueprint?: SiteBlueprint): CSSVariables {
    if (!blueprint) return {};

    const { colours, typography, layout, header, footer } = blueprint;

    const vars: CSSVariables = {
        '--site-primary': colours?.primary,
        '--site-secondary': colours?.secondary,
        '--site-background': colours?.background,
        '--site-text': colours?.text,
        '--site-muted': colours?.muted,
        '--site-muted-foreground': colours?.mutedForeground,
        '--site-card': colours?.card,
        '--site-border': colours?.border,
        '--site-accent': colours?.accent,

        '--site-heading-font': typography?.headingFont
            ? `'${typography.headingFont}', sans-serif`
            : undefined,
        '--site-body-font': typography?.bodyFont
            ? `'${typography.bodyFont}', sans-serif`
            : undefined,
        '--site-base-size': typography?.baseSize,

        '--site-max-width': layout?.maxWidth,

        '--site-header-bg': header?.backgroundColour,
        '--site-header-text': header?.textColour,
        '--site-footer-bg': footer?.backgroundColour,
        '--site-footer-text': footer?.textColour,
    };

    // Drop undefined entries so they don't emit `--x: undefined`
    for (const key of Object.keys(vars) as Array<keyof CSSVariables>) {
        if (vars[key] === undefined) delete vars[key];
    }

    return vars;
}

/**
 * Google Fonts stylesheet URL for the blueprint's fonts, or null when both are
 * system fonts and no request is needed.
 */
export function googleFontsUrl(blueprint?: SiteBlueprint): string | null {
    if (!blueprint?.typography) return null;

    const families = [blueprint.typography.headingFont, blueprint.typography.bodyFont]
        .filter((font): font is string => Boolean(font))
        .filter((font) => !SYSTEM_FONTS.has(font.toLowerCase()));

    const unique = Array.from(new Set(families));
    if (unique.length === 0) return null;

    const query = unique
        .map((font) => `family=${font.trim().replace(/\s+/g, '+')}:wght@400;500;600;700`)
        .join('&');

    return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/**
 * Inject the fonts stylesheet once. Safe to call on every render.
 */
export function useBlueprintFonts(blueprint?: SiteBlueprint): void {
    const href = googleFontsUrl(blueprint);
    if (typeof document === 'undefined' || !href) return;

    const existing = document.querySelector<HTMLLinkElement>('link[data-popcorn-fonts]');
    if (existing?.href === href) return;

    if (existing) {
        existing.href = href;
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-popcorn-fonts', 'true');
    document.head.appendChild(link);
}

/** Tailwind max-width utility is not usable here since maxWidth is arbitrary. */
export function containerStyle(blueprint?: SiteBlueprint): CSSProperties {
    return {
        maxWidth: blueprint?.layout?.maxWidth || '1280px',
        marginLeft: 'auto',
        marginRight: 'auto',
    };
}
