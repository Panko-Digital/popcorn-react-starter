/**
 * Popcorn CMS API Client
 *
 * Centralised fetch utilities for loading content from your Popcorn CMS.
 * All functions use the API key from environment variables.
 */

// Runtime config injected by the published-site shell HTML.
// Falls back to Vite env vars so local development still works.
const _siteConfig = typeof window !== 'undefined' ? (window as any).POPCORN_SITE_CONFIG : null;
const API_URL: string = _siteConfig?.apiUrl ?? import.meta.env.VITE_API_URL;
const API_KEY: string = _siteConfig?.apiKey ?? import.meta.env.VITE_API_KEY;

/**
 * Which site this front-end represents. Published sites receive it from the
 * shell; local development can set VITE_SITE_ID. Without it the API falls back
 * to the tenant's most recently published site.
 */
const SITE_ID: string | undefined = _siteConfig?.siteId ?? import.meta.env.VITE_SITE_ID;

/** Query string scoping a request to this site, or '' when unknown. */
const siteScope = (): string => (SITE_ID ? `?siteId=${encodeURIComponent(SITE_ID)}` : '');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CMSListItem {
    id: string;
    title: string;
    /** Nullable: the API returns the raw column, which is optional in the CMS. */
    content: string | null;
    caption?: string | null;
    link?: string | null;
    mediaUrl: string | null;
    position: number;
    order?: number;
    /** Imported list items spread their customData alongside these fields. */
    [key: string]: any;
}

export interface CMSElement {
    id: string;
    type: string;
    /**
     * Elements have no `ref` column in the CMS — only content areas do. Kept
     * optional because `extractPageContent` still keys on it for callers that
     * set one via config, but structure-driven rendering should not rely on it.
     */
    ref?: string | null;
    /** Semantic role scoped by type, e.g. page-title, hero-image, primary-cta */
    semanticRole?: string | null;
    /** Visual weight: hero, primary, secondary, tertiary, utility */
    weight?: string | null;
    order: number;
    content: string;
    mediaUrl?: string;
    /** Caption shown beneath image or video elements */
    caption?: string;
    /** Parsed JSON config stored on the element (e.g. { display, columns, overlayOpacity }) */
    config?: Record<string, any>;
    list?: {
        id: string;
        items: CMSListItem[];
    };
    dynamicContentType?: {
        id: string;
        name: string;
        records: any[];
    };
}

export interface CMSBlock {
    id: string;
    ref: string;
    name: string;
    /** Section role: hero, feature, testimonial, cta, gallery, contact, etc. */
    role?: string | null;
    order: number;
    elements: CMSElement[];
}

export interface CMSPage {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    publishedAt: string;
    /** True when this page is a full-screen splash/landing screen */
    isSplash?: boolean;
    /** Page-level config JSON (e.g. { splashMode, enterTo, enterLabel }) */
    config?: Record<string, any> | null;
    blocks: CMSBlock[];
}

export interface ContentField {
    type: string;
    value: string;
    mediaUrl?: string;
    caption?: string;
}

export interface Page {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    publishedAt: string;
}

export interface SiteNavigationItem {
    /** Short label suitable for a nav bar */
    label: string;
    /** Full page title */
    title: string;
    slug: string;
    /** Route path */
    path: string;
}

/**
 * Design tokens and structural configuration for the site.
 * Always complete — the API fills in defaults for anything unset.
 */
export interface SiteBlueprint {
    version?: string;
    colours: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        muted?: string;
        mutedForeground?: string;
        card?: string;
        border?: string;
        accent?: string;
    };
    theme?: Record<string, any>;
    typography: {
        headingFont: string;
        bodyFont: string;
        baseSize: string;
    };
    header: {
        style?: string;
        sticky?: boolean;
        hasLogo?: boolean;
        logoUrl?: string;
        backgroundColour?: string;
        textColour?: string;
        blur?: boolean;
        borderBottom?: boolean;
    };
    footer: {
        columns?: number;
        hasNewsletter?: boolean;
        hasSocialLinks?: boolean;
        socialLinks?: { platform: string; url: string }[];
        copyrightText?: string;
        backgroundColour?: string;
        textColour?: string;
    };
    layout: {
        maxWidth: string;
        sectionPadding: string;
        containerStyle?: string;
    };
    sections?: any[];
    metadata?: {
        title?: string;
        description?: string;
        faviconUrl?: string;
        ogImageUrl?: string;
    };
}

export interface SiteMetadata {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    locale: string;
    locales: string[];
    boilerplateKey: string;
    blueprint: SiteBlueprint;
    /** Slug of the page that renders at the site root */
    homeSlug: string;
    navigation: SiteNavigationItem[];
    publishedUrl: string | null;
    publishedAt: string | null;
    paymentsEnabled: boolean;
}

// ─── Fetch functions ─────────────────────────────────────────────────────────

/**
 * Fetch site metadata: design blueprint, navigation, locale.
 *
 * The site id comes from the runtime config injected by the published shell.
 * Without it the API falls back to the tenant's most recently published site,
 * which is the correct behaviour for local development against a single site.
 */
export const fetchSite = async (): Promise<SiteMetadata> => {
    const response = await fetch(`${API_URL}/site${siteScope()}`, {
        headers: { 'X-API-Key': API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch site: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data || json;
};

/** Fetch all published pages (list view — no block content) */
export const fetchPages = async (): Promise<Page[]> => {
    const response = await fetch(`${API_URL}/pages`, {
        headers: { 'X-API-Key': API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data || json;
};

/**
 * Fetch a full page by slug — includes all blocks and elements.
 *
 * The site id is passed when available because page slugs are unique per site,
 * not per tenant: a tenant with several sites can have several pages called
 * `home`, and without scoping the API may return a different site's page.
 */
export const fetchFullPage = async (slug: string): Promise<CMSPage> => {
    const response = await fetch(`${API_URL}/pages/${slug}${siteScope()}`, {
        headers: { 'X-API-Key': API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch page "${slug}": ${response.statusText}`);
    }

    const json = await response.json();
    return json.data || json;
};

/** Fetch a collection by ID */
export const fetchCollection = async (id: string) => {
    const response = await fetch(`${API_URL}/collections/${id}`, {
        headers: { 'X-API-Key': API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data || json;
};

/** Fetch media items with optional filters */
export const fetchMedia = async (options?: {
    limit?: number;
    tag?: string;
}) => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.tag) params.set('tag', options.tag);

    const response = await fetch(`${API_URL}/media?${params}`, {
        headers: { 'X-API-Key': API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data || json;
};

// ─── Content extraction (no API calls — works on cached data) ────────────────

/**
 * Extract content fields from a page's blocks.
 * Returns a map of element ref → { type, value, mediaUrl }
 */
export const extractPageContent = (
    pageData: CMSPage,
    blockRef?: string,
): Record<string, ContentField> => {
    const content: Record<string, ContentField> = {};

    const blocksToProcess = blockRef
        ? pageData.blocks.filter((block) => block.ref === blockRef)
        : pageData.blocks;

    blocksToProcess.forEach((block) => {
        block.elements.forEach((element) => {
            if (element.ref) {
                content[element.ref] = {
                    type: element.type,
                    value: element.content,
                    ...(element.mediaUrl && { mediaUrl: element.mediaUrl }),
                    ...(element.caption && { caption: element.caption }),
                };
            }
        });
    });

    return content;
};

/**
 * Extract list items from a specific block.
 * Useful for repeating content like team members, features, FAQs.
 */
export const extractPageListContent = (
    pageData: CMSPage,
    blockRef: string,
    elementRef?: string,
): CMSListItem[] => {
    const block = pageData.blocks.find((b) => b.ref === blockRef);
    if (!block) return [];

    const isListLike = (el: CMSElement) =>
        el.type === 'list' || el.type === 'list-reference' || el.type === 'collection';

    const listElement = elementRef
        ? block.elements.find((el) => isListLike(el) && el.ref === elementRef)
        : block.elements.find(isListLike);

    if (listElement?.list?.items && listElement.list.items.length > 0) {
        return [...listElement.list.items].sort(
            (a, b) => (a.position || a.order || 0) - (b.position || b.order || 0),
        );
    }

    return [];
};

/**
 * Extract dynamic content records from a block.
 */
export const extractPageDynamicContent = (
    pageData: CMSPage,
    blockRef: string,
    typeName?: string,
): any[] => {
    const block = pageData.blocks.find((b) => b.ref === blockRef);
    if (!block) return [];

    const dynamicElements = block.elements.filter(
        (el) => el.type === 'dynamic-content-reference',
    );

    if (dynamicElements.length === 0) return [];

    const targetElement = typeName
        ? dynamicElements.find((el) => el.dynamicContentType?.name === typeName)
        : dynamicElements[0];

    return targetElement?.dynamicContentType?.records || [];
};
