/**
 * App
 *
 * Structure-driven shell for a published Popcorn CMS site.
 *
 * Everything is derived from the API: the brand, navigation, design tokens, and
 * the set of routes. Adding a page in the CMS adds a route here without a code
 * change.
 *
 * Deep links work because the published-sites middleware serves this shell for
 * every path on a site's host, so BrowserRouter can own the URL.
 */
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { useSite } from "./hooks/useSite";
import { blueprintToCssVariables, useBlueprintFonts } from "./lib/blueprint";
import { CmsPage } from "./pages/CmsPage";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { SiteMetadata } from "./lib/api";

/**
 * Renders whichever page slug is in the URL.
 *
 * Only used by the catch-all route, so that pages which exist in the CMS but
 * are absent from navigation still resolve.
 */
function RoutedPage({ site }: { site: SiteMetadata }) {
  const { slug } = useParams<{ slug: string }>();
  const resolved = slug || site.homeSlug;
  return (
    <CmsPage
      key={resolved}
      slug={resolved}
      siteName={site.name}
      blueprint={site.blueprint}
      isHome={resolved === site.homeSlug}
    />
  );
}

function SiteRoutes({ site }: { site: SiteMetadata }) {
  const page = (slug: string) => (
    <CmsPage
      key={slug}
      slug={slug}
      siteName={site.name}
      blueprint={site.blueprint}
      isHome={slug === site.homeSlug}
    />
  );

  return (
    <Routes>
      <Route path="/" element={page(site.homeSlug)} />

      {/*
        Navigation paths are literal, so the slug is bound per route rather than
        read from params — these routes have no param to read.
      */}
      {site.navigation.map((item) => (
        <Route key={item.slug} path={item.path} element={page(item.slug)} />
      ))}

      {/*
        Pages that exist in the CMS but are absent from navigation. CmsPage
        reports a missing page in place, so an unknown slug is not a dead end.
      */}
      <Route path="/:slug" element={<RoutedPage site={site} />} />

      {/* Deeper paths have no page equivalent yet. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SiteShell() {
  const { site, isLoading, isError } = useSite();

  useBlueprintFonts(site?.blueprint);

  const style = blueprintToCssVariables(site?.blueprint);

  // Site metadata drives the whole shell, so hold the frame until it resolves
  // rather than rendering a placeholder brand that then changes.
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-busy="true"
      >
        <span className="sr-only">Loading site</span>
      </div>
    );
  }

  // Without metadata there is no navigation or theme, but the home page can
  // still render from its own request — a degraded site beats a blank document.
  if (isError || !site) {
    return (
      <div className="min-h-screen flex flex-col" style={style}>
        <main className="flex-1">
          <CmsPage slug="home" isHome />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={style}>
      <ErrorBoundary>
        <SiteHeader site={site} />
      </ErrorBoundary>

      <main className="flex-1">
        <SiteRoutes site={site} />
      </main>

      <ErrorBoundary>
        <SiteFooter site={site} />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteShell />
    </BrowserRouter>
  );
}
