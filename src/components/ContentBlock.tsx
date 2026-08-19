/**
 * ContentBlock
 *
 * Generic CMS content-area renderer. Drop it into any page and it will
 * render every element type that Popcorn CMS can produce:
 *
 * | Element type | Renders as                                              |
 * |---|---|
 * | `text`        | `<p>` — plain text                                     |
 * | `heading`     | `<h2>` — section heading                               |
 * | `html`        | `dangerouslySetInnerHTML` — rich text, iframes, embeds |
 * | `image`       | `<img>` with optional caption                         |
 * | `video`       | `<VideoPlayer>` — interactive hosted-media player      |
 * | `list`        | Unordered list of CMS list items                       |
 *
 * ### Iframe embeds (YouTube, Vimeo, Genially, etc.)
 * An `html` element that contains an `<iframe>` tag will render correctly
 * because it goes through `dangerouslySetInnerHTML`. The outer wrapper applies
 * `overflow-hidden` and a responsive aspect-ratio container so iframes sized
 * with `width="560"` still fill their column naturally.
 *
 * The content originates from your own CMS, so it is considered trusted — the
 * same assumption used throughout this boilerplate.
 *
 * @example
 * ```tsx
 * // Render every element in the 'hero' block
 * import { usePageData } from '@/hooks/usePageData';
 * import { ContentBlock } from '@/components/ContentBlock';
 *
 * function HeroSection() {
 *   const { pageData } = usePageData('home');
 *   const block = pageData?.blocks.find(b => b.ref === 'hero');
 *   if (!block) return null;
 *   return <ContentBlock block={block} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Render a specific element by its elementId ref
 * <ContentBlock block={block} elementRef="intro-video" />
 * ```
 */

import { VideoPlayer } from "./VideoPlayer";
import { EnhancedCollection } from "./EnhancedCollection";
import { ImageGallery } from "./ImageGallery";
import { containsIframe } from "../lib/content-utils";
import type { CMSBlock, CMSElement, CMSListItem } from "../lib/api";

// ─── Element renderers ────────────────────────────────────────────────────────

/**
 * Text sizing follows the element's authored `weight`, so the published site
 * reproduces the hierarchy set in the builder rather than flattening it.
 */
function ElementText({ el }: { el: CMSElement }) {
  if (!el.content) return null;
  const weight = el.weight || "secondary";
  const size =
    weight === "hero" || weight === "primary"
      ? "text-lg md:text-xl"
      : weight === "utility"
        ? "text-sm"
        : "text-base md:text-lg";
  return (
    <p
      className={`${size} leading-relaxed`}
      style={{ color: "var(--site-muted-foreground)" }}
    >
      {el.content}
    </p>
  );
}

function ElementHeading({
  el,
  asPageTitle = false,
}: {
  el: CMSElement;
  asPageTitle?: boolean;
}) {
  if (!el.content) return null;

  const weight = el.weight || "secondary";
  const isTop =
    asPageTitle || weight === "hero" || el.semanticRole === "page-title";

  const size =
    weight === "hero"
      ? "text-4xl md:text-5xl lg:text-6xl"
      : weight === "primary"
        ? "text-3xl md:text-4xl"
        : "text-2xl md:text-3xl";

  const Tag = isTop ? "h1" : "h2";

  return (
    <Tag
      className={`${size} font-semibold tracking-tight`}
      style={{ fontFamily: "var(--site-heading-font)" }}
    >
      {el.content}
    </Tag>
  );
}

function ElementButton({ el }: { el: CMSElement }) {
  if (!el.content) return null;

  // Emphasis can come from the authored weight, the semantic role, or the
  // element config — generated content uses `style`, imported content `variant`.
  const isPrimary =
    el.weight === "primary" ||
    el.semanticRole === "primary-cta" ||
    el.config?.style === "primary" ||
    el.config?.variant === "primary";

  const rawHref = el.config?.link || el.config?.href || el.config?.url;
  const href =
    typeof rawHref === "string" &&
    /^(https?:\/\/|\/|#|mailto:|tel:)/.test(rawHref)
      ? rawHref
      : undefined;

  const className = isPrimary
    ? "inline-flex items-center justify-center px-7 py-3.5 rounded-md font-medium text-white transition-opacity hover:opacity-90"
    : "inline-flex items-center justify-center px-6 py-3 rounded-md font-medium border transition-colors";

  const style = isPrimary
    ? { backgroundColor: "var(--site-primary)" }
    : { borderColor: "var(--site-border)", color: "var(--site-text)" };

  // A button with a link is a link; without one it is inert, so render a
  // non-interactive element rather than a button that does nothing.
  if (href) {
    return (
      <a href={href} className={className} style={style}>
        {el.content}
      </a>
    );
  }

  return (
    <span className={className} style={style}>
      {el.content}
    </span>
  );
}

function ElementLink({ el }: { el: CMSElement }) {
  if (!el.content) return null;

  const rawHref = el.config?.href || el.config?.link || "#";
  const isSafe = /^(https?:\/\/|\/|#|mailto:|tel:)/.test(String(rawHref));
  const href = isSafe ? String(rawHref) : "#";
  const external = Boolean(el.config?.external);

  return (
    <a
      href={href}
      className="underline underline-offset-2 hover:opacity-80"
      style={{ color: "var(--site-primary)" }}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {el.content}
    </a>
  );
}

function ElementCard({ el }: { el: CMSElement }) {
  const description = el.config?.description;
  if (!el.content && !description) return null;

  return (
    <article
      className="p-6 rounded-xl border h-full"
      style={{
        backgroundColor: "var(--site-card)",
        borderColor: "var(--site-border)",
      }}
    >
      {el.content && (
        <h3
          className="font-semibold mb-2"
          style={{ fontFamily: "var(--site-heading-font)" }}
        >
          {el.content}
        </h3>
      )}
      {description && (
        <p
          className="text-sm"
          style={{ color: "var(--site-muted-foreground)" }}
        >
          {description}
        </p>
      )}
    </article>
  );
}

function ElementStep({ el }: { el: CMSElement }) {
  const number = el.config?.number;
  const description = el.config?.description;
  if (!el.content && !description) return null;

  return (
    <div className="flex gap-5 items-start">
      {number && (
        <div
          className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-medium"
          style={{
            backgroundColor: "var(--site-muted)",
            color: "var(--site-primary)",
          }}
        >
          {number}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {el.content && (
          <h3
            className="font-semibold mb-1"
            style={{ fontFamily: "var(--site-heading-font)" }}
          >
            {el.content}
          </h3>
        )}
        {description && (
          <p
            className="text-sm"
            style={{ color: "var(--site-muted-foreground)" }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ElementIconText({ el }: { el: CMSElement }) {
  const label = el.config?.label;
  if (!el.content && !label) return null;

  return (
    <div className="flex items-start gap-4">
      <span
        className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: "var(--site-primary)" }}
        aria-hidden="true"
      />
      <div>
        {label && <div className="font-medium mb-1">{label}</div>}
        {el.content && (
          <p
            className="text-sm"
            style={{ color: "var(--site-muted-foreground)" }}
          >
            {el.content}
          </p>
        )}
      </div>
    </div>
  );
}

function ElementStat({ el }: { el: CMSElement }) {
  const label = el.config?.label || el.content;
  const description = el.config?.description;
  if (!label && !description) return null;

  return (
    <div className="text-center">
      <div
        className="text-3xl md:text-4xl font-semibold"
        style={{
          fontFamily: "var(--site-heading-font)",
          color: "var(--site-primary)",
        }}
      >
        {label}
      </div>
      {description && (
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--site-muted-foreground)" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * HTML element — renders rich text and embeds (YouTube, Vimeo, Genially, etc.).
 *
 * Iframes are wrapped in a responsive container. If the HTML contains a single
 * `<iframe>` with a fixed width/height, it will be stretched to fill the column
 * while maintaining its aspect ratio.
 */
function ElementHtml({ el }: { el: CMSElement }) {
  if (!el.content) return null;

  // Detect whether the content contains an iframe so we can apply responsive
  // wrapper styles.
  const hasIframe = containsIframe(el.content);

  return (
    <div
      className={
        hasIframe
          ? // Responsive iframe wrapper — neutralises fixed width/height attrs
            "relative w-full overflow-hidden [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!w-full [&_iframe]:!h-full aspect-video rounded-lg"
          : "prose prose-gray max-w-none"
      }
      // Content originates from the operator's own CMS — treated as trusted.
      dangerouslySetInnerHTML={{ __html: el.content }}
    />
  );
}

function ElementImage({ el }: { el: CMSElement }) {
  if (!el.mediaUrl) return null;
  return (
    <figure className="w-full">
      <img
        src={el.mediaUrl}
        alt={el.caption || el.content || ""}
        className="w-full rounded-lg object-cover"
        loading="lazy"
      />
      {el.caption && (
        <figcaption className="mt-2 text-sm text-gray-500 text-center italic">
          {el.caption}
        </figcaption>
      )}
    </figure>
  );
}

function ElementVideo({ el }: { el: CMSElement }) {
  return <VideoPlayer src={el.mediaUrl} caption={el.caption} />;
}

function ElementList({ el }: { el: CMSElement }) {
  const items: CMSListItem[] = el.list?.items ?? [];
  if (items.length === 0) return null;

  return (
    <ul className="space-y-3">
      {[...items]
        .sort(
          (a, b) => (a.position ?? a.order ?? 0) - (b.position ?? b.order ?? 0),
        )
        .map((item) => (
          <li key={item.id} className="flex gap-3">
            {item.mediaUrl && (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
                loading="lazy"
              />
            )}
            <div>
              {item.title && (
                <p className="font-medium text-gray-900">{item.title}</p>
              )}
              {item.content && (
                <p className="text-sm text-gray-600">{item.content}</p>
              )}
            </div>
          </li>
        ))}
    </ul>
  );
}

function ElementGallery({ el }: { el: CMSElement }) {
  // Media collection images from the API (config.mediaCollection or list items)
  const mc = (el as any).mediaCollection || (el.config as any)?.mediaCollection;
  const items = mc?.items || [];

  // Fallback: if the element has a list with image items, use those
  const listItems = el.list?.items ?? [];
  const imageItems =
    items.length > 0 ? items : listItems.filter((i: any) => i.mediaUrl);

  if (imageItems.length === 0) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg text-center text-gray-500">
        <p className="text-sm">Gallery images will appear here once added.</p>
      </div>
    );
  }

  const galleryImages = imageItems.map((item: any, idx: number) => ({
    id: item.id || item.mediaItemId || `img-${idx}`,
    src: item.url || item.mediaUrl || "",
    alt: item.altText || item.originalFilename || item.title || "",
    wide: idx === 0 && imageItems.length > 3,
  }));

  return (
    <div className="w-full">
      {el.content && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {el.content}
        </h3>
      )}
      <ImageGallery images={galleryImages} columns={4} />
    </div>
  );
}

function ElementDynamicContent({ el }: { el: CMSElement }) {
  const dct = el.dynamicContentType;
  if (!dct || !dct.records || dct.records.length === 0) return null;

  // Read display settings from element config or schema
  const displaySettings =
    el.config?.displaySettings || (dct as any).schema?.displaySettings;
  const displayType = displaySettings?.displayType || "list";
  const showSearch = displaySettings?.showSearch || false;
  const showFilters = displaySettings?.showFilters || false;
  const showMap = displaySettings?.showMap || false;

  // Extract schema fields from the dynamic content type
  const schema = (dct as any).schema;
  const fields = schema?.fields || [];

  // Records have their data nested under a `data` key from the API
  const records = dct.records.map((r: any) => ({
    id: r.id,
    ...(r.data || r),
  }));

  return (
    <EnhancedCollection
      records={records}
      fields={fields}
      displayType={displayType}
      showSearch={showSearch}
      showFilters={showFilters}
      showMap={showMap}
      title={dct.name}
    />
  );
}

// ─── Single-element dispatcher ────────────────────────────────────────────────

/**
 * Render one CMS element.
 *
 * Covers every `status: 'supported'` entry in the element contract
 * (`shared/element-types.ts`). Types marked `legacy` there — `menu`, `map`,
 * `custom-widget`, `custom` — deliberately fall through to the documented text
 * fallback rather than rendering nothing, so existing content stays visible.
 *
 * Exported so section layouts can place individual elements into panes.
 */
export function BlockElement({
  el,
  asPageTitle = false,
}: {
  el: CMSElement;
  asPageTitle?: boolean;
}) {
  switch (el.type) {
    case "text":
      return <ElementText el={el} />;
    case "heading":
      return <ElementHeading el={el} asPageTitle={asPageTitle} />;
    case "html":
      return <ElementHtml el={el} />;
    case "image":
      return <ElementImage el={el} />;
    case "video":
      return <ElementVideo el={el} />;
    case "button":
      return <ElementButton el={el} />;
    case "link":
      return <ElementLink el={el} />;
    case "card":
      return <ElementCard el={el} />;
    case "step":
      return <ElementStep el={el} />;
    case "icon-text":
      return <ElementIconText el={el} />;
    case "stat":
      return <ElementStat el={el} />;
    case "list":
    case "list-reference":
    case "collection":
      return <ElementList el={el} />;
    case "gallery":
      return <ElementGallery el={el} />;
    case "dynamic-content-reference":
      return <ElementDynamicContent el={el} />;
    // video-background is a full-screen decoration — use VideoBackground instead
    case "video-background":
      return null;
    default:
      // Documented fallback for legacy and unrecognised types.
      return el.content ? (
        <p style={{ color: "var(--site-muted-foreground)" }}>{el.content}</p>
      ) : null;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ContentBlockProps {
  /** The CMS block to render */
  block: CMSBlock;
  /**
   * Optional element ref filter — renders only the element with this `ref`.
   * Useful when you need fine-grained control over layout.
   */
  elementRef?: string;
  /** Additional className applied to the outer wrapper */
  className?: string;
}

export function ContentBlock({
  block,
  elementRef,
  className = "",
}: ContentBlockProps) {
  const elements = elementRef
    ? block.elements.filter((el) => el.ref === elementRef)
    : [...block.elements].sort((a, b) => a.order - b.order);

  if (elements.length === 0) return null;

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {elements.map((el) => (
        <BlockElement key={el.id} el={el} />
      ))}
    </div>
  );
}
