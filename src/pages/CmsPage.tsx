/**
 * CmsPage
 *
 * Renders a CMS page from its authored structure: every content area in `order`,
 * every element within each area in `order`. No hardcoded refs, no fabricated
 * placeholder copy — what the operator built is what renders.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchFullPage } from "../lib/api";
import type { SiteBlueprint } from "../lib/api";
import { Section } from "../components/Section";
import { SeoHead } from "../components/SeoHead";
import { ErrorBoundary } from "../components/ErrorBoundary";

interface CmsPageProps {
  slug: string;
  siteName?: string;
  blueprint?: SiteBlueprint;
  /** True when this is the site's home page, which gets the <h1> treatment. */
  isHome?: boolean;
}

export function CmsPage({ slug, siteName, blueprint, isHome = false }: CmsPageProps) {
  const {
    data: page,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => fetchFullPage(slug),
    retry: 2,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="py-24 px-4" aria-busy="true" aria-live="polite">
        <div className="mx-auto w-full" style={{ maxWidth: "var(--site-max-width)" }}>
          <span className="sr-only">Loading page content</span>
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-10 w-2/3 rounded" style={{ backgroundColor: "var(--site-muted)" }} />
            <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--site-muted)" }} />
            <div className="h-4 w-5/6 rounded" style={{ backgroundColor: "var(--site-muted)" }} />
          </div>
        </div>
      </div>
    );
  }

  // A failed page fetch is reported in place rather than blanking the document,
  // so navigation and the rest of the shell remain usable.
  if (isError || !page) {
    return (
      <div className="py-24 px-4 text-center">
        <div className="mx-auto w-full" style={{ maxWidth: "var(--site-max-width)" }}>
          <h1 className="text-2xl font-semibold mb-3" style={{ fontFamily: "var(--site-heading-font)" }}>
            This page isn’t available
          </h1>
          <p style={{ color: "var(--site-muted-foreground)" }}>
            The content could not be loaded. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  const blocks = [...(page.blocks || [])].sort((a, b) => a.order - b.order);

  return (
    <>
      <SeoHead
        title={page.title}
        description={page.description || undefined}
        siteName={siteName}
        pageSlug={page.slug}
      />

      {blocks.length === 0 ? (
        <div className="py-24 px-4 text-center" style={{ color: "var(--site-muted-foreground)" }}>
          <div className="mx-auto w-full" style={{ maxWidth: "var(--site-max-width)" }}>
            <p>This page has no content yet.</p>
          </div>
        </div>
      ) : (
        blocks.map((block, index) => (
          // One malformed section must not take down the page.
          <ErrorBoundary key={block.id}>
            <Section
              block={block}
              index={index}
              blueprint={blueprint}
              isPageLead={isHome && index === 0}
            />
          </ErrorBoundary>
        ))
      )}
    </>
  );
}
