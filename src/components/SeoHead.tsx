import { useEffect } from "react";

interface SeoHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  siteName?: string;
  pageSlug?: string;
}

/**
 * SeoHead — Dynamically injects SEO meta tags and structured data into <head>.
 *
 * Since published Popcorn CMS sites are client-rendered SPAs, search engines
 * and AI agents that execute JavaScript will pick up these tags after render.
 * For bots that don't execute JS, the static shell HTML has base-level meta.
 *
 * Usage:
 *   <SeoHead title="About Us" description="Learn about our team" />
 */
export function SeoHead({
  title,
  description,
  ogImage,
  siteName,
  pageSlug,
}: SeoHeadProps) {
  useEffect(() => {
    if (!title) return;

    // Update document title
    const fullTitle = siteName ? `${title} — ${siteName}` : title;
    document.title = fullTitle;

    // Helper to upsert a meta tag
    const setMeta = (
      attr: "name" | "property",
      key: string,
      content: string | undefined,
    ) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    // Standard meta
    setMeta("name", "description", description);

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    if (ogImage) setMeta("property", "og:image", ogImage);
    if (siteName) setMeta("property", "og:site_name", siteName);

    // Twitter Card
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    if (ogImage) setMeta("name", "twitter:image", ogImage);

    // Schema.org JSON-LD — inject or update
    const ldId = "popcorn-schema-ld";
    let ldScript = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement("script");
      ldScript.id = ldId;
      ldScript.type = "application/ld+json";
      document.head.appendChild(ldScript);
    }

    const schemaData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: fullTitle,
    };
    if (description) schemaData.description = description;
    if (pageSlug) schemaData.url = `${window.location.origin}/${pageSlug}`;
    if (siteName) {
      schemaData.isPartOf = {
        "@type": "WebSite",
        name: siteName,
        url: window.location.origin,
      };
    }

    ldScript.textContent = JSON.stringify(schemaData);
  }, [title, description, ogImage, siteName, pageSlug]);

  return null;
}
