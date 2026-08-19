/**
 * SiteFooter
 *
 * Uses the blueprint's footer configuration and the site's own navigation.
 */
import { Link } from "react-router-dom";
import type { SiteMetadata } from "../lib/api";

interface SiteFooterProps {
  site?: SiteMetadata;
}

export function SiteFooter({ site }: SiteFooterProps) {
  if (!site) return null;

  const footer = site.blueprint?.footer || {};
  const brand = site.blueprint?.metadata?.title || site.name;
  const copyright = footer.copyrightText || `© ${new Date().getFullYear()} ${brand}`;
  const socialLinks = Array.isArray(footer.socialLinks) ? footer.socialLinks : [];

  return (
    <footer
      className="mt-auto px-4 py-12"
      style={{
        backgroundColor: footer.backgroundColour || "var(--site-muted)",
        color: footer.textColour || "var(--site-text)",
        borderTop: "1px solid var(--site-border)",
      }}
    >
      <div
        className="mx-auto w-full flex flex-col gap-8"
        style={{ maxWidth: "var(--site-max-width)" }}
      >
        {site.navigation.length > 0 && (
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {site.navigation.map((item) => (
                <li key={item.slug}>
                  <Link to={item.path} className="hover:opacity-70 transition-opacity">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {socialLinks.length > 0 && (
          <ul className="flex flex-wrap gap-4 text-sm">
            {socialLinks.map((link) => (
              <li key={`${link.platform}-${link.url}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div
          className="flex flex-col sm:flex-row justify-between gap-2 text-sm pt-6"
          style={{ borderTop: "1px solid var(--site-border)", color: "var(--site-muted-foreground)" }}
        >
          <p>{copyright}</p>
          <p>
            Powered by{" "}
            <a href="https://popcorncms.com" className="underline">
              Popcorn CMS
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
