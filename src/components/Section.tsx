/**
 * Section
 *
 * Renders one CMS content area with a layout inferred from its role and element
 * composition — deliberately mirroring `inferSectionLayout()` in
 * `api/src/modules/site-scanner/site-generator.service.ts` so the published site
 * and the builder preview agree on structure.
 *
 * The blueprint may also carry an explicit layout per section ref
 * (`blueprint.sections[].layout`); when present it wins over inference.
 */
import type { CMSBlock, CMSElement, SiteBlueprint } from "../lib/api";
import { BlockElement } from "./ContentBlock";

export type SectionLayout =
  | "hero"
  | "hero-split"
  | "cards-grid"
  | "steps"
  | "contact-split"
  | "two-column"
  | "three-column"
  | "grid"
  | "cta"
  | "single-column";

const MEDIA_TYPES = ["image", "video", "video-background"];
const TEXT_TYPES = ["heading", "text", "button", "link"];
const CARD_TYPES = ["card", "step", "icon-text", "stat"];
const COLLECTION_TYPES = ["collection", "list", "list-reference", "gallery", "dynamic-content-reference"];

/**
 * Choose a layout for a content area.
 *
 * Role is the strongest signal because it is explicit authored intent. Element
 * composition is the fallback.
 */
export function inferSectionLayout(block: CMSBlock, index: number): SectionLayout {
  const elements = block.elements || [];
  const types = elements.map((e) => e.type);
  const weights = elements.map((e) => e.weight).filter(Boolean);
  const semanticRoles = elements.map((e) => e.semanticRole).filter(Boolean);

  const hasMedia = types.some((t) => MEDIA_TYPES.includes(t));
  const hasForm = types.includes("form");
  const hasCards = types.some((t) => CARD_TYPES.includes(t));
  const hasCollections = types.some((t) => COLLECTION_TYPES.includes(t));

  switch (block.role) {
    case "hero":
      return hasMedia ? "hero-split" : "hero";
    case "cta":
      return "cta";
    case "feature":
      return types.length > 3 ? "cards-grid" : "two-column";
    case "testimonial":
    case "pricing":
    case "stats":
      return "cards-grid";
    case "gallery":
      return "grid";
    case "faq":
      return "single-column";
    case "steps":
      return "steps";
    case "contact":
      return hasForm ? "contact-split" : "single-column";
    default:
      break;
  }

  // Hero-weight content implies a hero treatment even without an explicit role.
  if (
    weights.includes("hero") ||
    semanticRoles.includes("hero-image") ||
    semanticRoles.includes("hero-video")
  ) {
    const hasText = types.includes("heading") || types.includes("text");
    return hasMedia && hasText ? "hero-split" : "hero";
  }

  // A leading section with a heading and a call to action reads as a hero.
  if (index === 0 && types.includes("heading") && types.includes("button")) {
    return hasMedia ? "hero-split" : "hero";
  }

  if (hasForm && types.includes("text")) return "contact-split";
  if (hasCards && types.length >= 3) return "cards-grid";
  // Collections manage their own internal layout, so give them full width.
  if (hasCollections && !hasCards) return "single-column";

  const nonCta = types.filter((t) => !["heading", "button", "text"].includes(t));
  if (nonCta.length === 0 && types.includes("button") && types.length <= 4) return "cta";

  return "single-column";
}

/** Explicit layout from the blueprint for this section ref, if any. */
function blueprintLayoutFor(block: CMSBlock, blueprint?: SiteBlueprint): SectionLayout | null {
  const sections = blueprint?.sections;
  if (!Array.isArray(sections) || !block.ref) return null;

  const match = sections.find((s: any) => s?.ref === block.ref);
  const layout = match?.layout;

  const allowed: SectionLayout[] = [
    "hero", "hero-split", "cards-grid", "steps", "contact-split",
    "two-column", "three-column", "grid", "cta", "single-column",
  ];
  return allowed.includes(layout) ? layout : null;
}

function columnsFor(block: CMSBlock, blueprint?: SiteBlueprint): number {
  const sections = blueprint?.sections;
  if (Array.isArray(sections) && block.ref) {
    const match = sections.find((s: any) => s?.ref === block.ref);
    const columns = Number(match?.columns);
    if (Number.isFinite(columns) && columns >= 2 && columns <= 4) return columns;
  }
  const count = (block.elements || []).filter((e) => CARD_TYPES.includes(e.type)).length;
  return count >= 4 ? 3 : count === 3 ? 3 : 2;
}

const GRID_CLASS: Record<number, string> = {
  2: "grid grid-cols-1 md:grid-cols-2 gap-6",
  3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
};

function partition(elements: CMSElement[]) {
  return {
    headings: elements.filter((e) => e.type === "heading"),
    body: elements.filter((e) => e.type === "text"),
    ctas: elements.filter((e) => e.type === "button" || e.type === "link"),
    media: elements.filter((e) => MEDIA_TYPES.includes(e.type)),
    cards: elements.filter((e) => CARD_TYPES.includes(e.type)),
    rest: elements.filter(
      (e) =>
        !TEXT_TYPES.includes(e.type) &&
        !MEDIA_TYPES.includes(e.type) &&
        !CARD_TYPES.includes(e.type),
    ),
  };
}

interface SectionProps {
  block: CMSBlock;
  index: number;
  blueprint?: SiteBlueprint;
  /** True for the first section of the site's home page. */
  isPageLead?: boolean;
}

export function Section({ block, index, blueprint, isPageLead = false }: SectionProps) {
  const elements = [...(block.elements || [])].sort((a, b) => a.order - b.order);
  if (elements.length === 0) return null;

  const layout = blueprintLayoutFor(block, blueprint) || inferSectionLayout(block, index);
  const parts = partition(elements);

  // Alternate surface tint to separate stacked sections without a blueprint.
  const tinted = index % 2 === 1;
  const sectionStyle = tinted ? { backgroundColor: "var(--site-muted)" } : undefined;

  const inner = (children: React.ReactNode) => (
    <section
      id={block.ref || undefined}
      aria-label={block.name || block.ref || undefined}
      className="py-14 md:py-20 px-4"
      style={sectionStyle}
    >
      <div className="mx-auto w-full" style={{ maxWidth: "var(--site-max-width)" }}>
        {children}
      </div>
    </section>
  );

  const leadHeading = (el: CMSElement, i: number) => (
    <BlockElement key={el.id} el={el} asPageTitle={isPageLead && i === 0} />
  );

  switch (layout) {
    case "hero":
      return inner(
        <div className="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto">
          {parts.headings.map(leadHeading)}
          {parts.body.map((el) => (
            <BlockElement key={el.id} el={el} />
          ))}
          {parts.ctas.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {parts.ctas.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
          {parts.media.map((el) => (
            <div key={el.id} className="w-full mt-6">
              <BlockElement el={el} />
            </div>
          ))}
          {parts.rest.map((el) => (
            <div key={el.id} className="w-full">
              <BlockElement el={el} />
            </div>
          ))}
        </div>,
      );

    case "hero-split":
      return inner(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="flex flex-col gap-5">
            {parts.headings.map(leadHeading)}
            {parts.body.map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
            {parts.ctas.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {parts.ctas.map((el) => (
                  <BlockElement key={el.id} el={el} />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {parts.media.slice(0, 2).map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
          </div>
          {parts.rest.length > 0 && (
            <div className="md:col-span-2 flex flex-col gap-6">
              {parts.rest.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
        </div>,
      );

    case "cards-grid": {
      const columns = columnsFor(block, blueprint);
      return inner(
        <div className="flex flex-col gap-8">
          {(parts.headings.length > 0 || parts.body.length > 0) && (
            <div className="flex flex-col gap-3 max-w-3xl">
              {parts.headings.map(leadHeading)}
              {parts.body.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
          {parts.cards.length > 0 && (
            <div className={GRID_CLASS[columns] || GRID_CLASS[3]}>
              {parts.cards.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
          {parts.media.length > 0 && (
            <div className={GRID_CLASS[Math.min(columns, 3)] || GRID_CLASS[3]}>
              {parts.media.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
          {parts.rest.map((el) => (
            <BlockElement key={el.id} el={el} />
          ))}
          {parts.ctas.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {parts.ctas.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
        </div>,
      );
    }

    case "steps":
      return inner(
        <div className="flex flex-col gap-8">
          {parts.headings.map(leadHeading)}
          {parts.body.map((el) => (
            <BlockElement key={el.id} el={el} />
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {parts.cards.map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
          </div>
          {parts.rest.map((el) => (
            <BlockElement key={el.id} el={el} />
          ))}
        </div>,
      );

    case "contact-split":
      return inner(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          <div className="flex flex-col gap-4">
            {parts.headings.map(leadHeading)}
            {parts.body.map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
            {parts.ctas.map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
          </div>
          <div className="flex flex-col gap-6">
            {parts.rest.map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
            {parts.media.map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
          </div>
        </div>,
      );

    case "two-column":
    case "three-column":
    case "grid": {
      const columns = layout === "three-column" ? 3 : layout === "grid" ? 3 : 2;
      return inner(
        <div className="flex flex-col gap-8">
          {parts.headings.map(leadHeading)}
          {parts.body.length > 0 && (
            <div className="max-w-3xl flex flex-col gap-3">
              {parts.body.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
          <div className={GRID_CLASS[columns]}>
            {[...parts.media, ...parts.cards, ...parts.rest].map((el) => (
              <BlockElement key={el.id} el={el} />
            ))}
          </div>
          {parts.ctas.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {parts.ctas.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
        </div>,
      );
    }

    case "cta":
      return inner(
        <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
          {parts.headings.map(leadHeading)}
          {parts.body.map((el) => (
            <BlockElement key={el.id} el={el} />
          ))}
          {parts.ctas.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {parts.ctas.map((el) => (
                <BlockElement key={el.id} el={el} />
              ))}
            </div>
          )}
        </div>,
      );

    case "single-column":
    default:
      return inner(
        <div className="flex flex-col gap-6">
          {elements.map((el, i) => (
            <BlockElement key={el.id} el={el} asPageTitle={isPageLead && i === 0 && el.type === "heading"} />
          ))}
        </div>,
      );
  }
}
