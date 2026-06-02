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
import { containsIframe } from "../lib/content-utils";
import type { CMSBlock, CMSElement, CMSListItem } from "../lib/api";

// ─── Element renderers ────────────────────────────────────────────────────────

function ElementText({ el }: { el: CMSElement }) {
  if (!el.content) return null;
  return <p className="text-gray-700 leading-relaxed">{el.content}</p>;
}

function ElementHeading({ el }: { el: CMSElement }) {
  if (!el.content) return null;
  return <h2 className="text-2xl font-semibold text-gray-900">{el.content}</h2>;
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

function BlockElement({ el }: { el: CMSElement }) {
  switch (el.type) {
    case "text":
      return <ElementText el={el} />;
    case "heading":
      return <ElementHeading el={el} />;
    case "html":
      return <ElementHtml el={el} />;
    case "image":
      return <ElementImage el={el} />;
    case "video":
      return <ElementVideo el={el} />;
    case "list":
    case "list-reference":
    case "collection":
      return <ElementList el={el} />;
    case "dynamic-content-reference":
      return <ElementDynamicContent el={el} />;
    // video-background is a full-screen decoration — use VideoBackground instead
    case "video-background":
      return null;
    default:
      // Graceful fallback: render text content if present
      return el.content ? <p className="text-gray-600">{el.content}</p> : null;
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
