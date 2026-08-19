/**
 * SiteHeader
 *
 * Brand and navigation come from the API, not hardcoded strings. Renders
 * nothing until site metadata resolves, so no placeholder brand ever flashes.
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import type { SiteMetadata } from "../lib/api";

interface SiteHeaderProps {
  site?: SiteMetadata;
}

export function SiteHeader({ site }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (!site) return null;

  const { blueprint, navigation, homeSlug } = site;
  const header = blueprint?.header || {};
  const brand = blueprint?.metadata?.title || site.name;

  const sticky = header.sticky !== false;
  const showBorder = header.borderBottom !== false;

  const isActive = (path: string, slug: string) =>
    location.pathname === path || (location.pathname === "/" && slug === homeSlug);

  return (
    <header
      className={`${sticky ? "sticky top-0 z-40" : ""} ${header.blur ? "backdrop-blur" : ""}`}
      style={{
        backgroundColor: header.backgroundColour || "var(--site-background)",
        color: header.textColour || "var(--site-text)",
        borderBottom: showBorder ? "1px solid var(--site-border)" : undefined,
      }}
    >
      <div
        className="mx-auto w-full px-4 py-4 flex items-center justify-between gap-6"
        style={{ maxWidth: "var(--site-max-width)" }}
      >
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg shrink-0">
          {header.hasLogo && header.logoUrl ? (
            <img src={header.logoUrl} alt={brand} className="h-8 w-auto" />
          ) : (
            <span style={{ fontFamily: "var(--site-heading-font)" }}>{brand}</span>
          )}
        </Link>

        {navigation.length > 0 && (
          <>
            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-6 text-sm">
                {navigation.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={item.path}
                      aria-current={isActive(item.path, item.slug) ? "page" : undefined}
                      className="hover:opacity-70 transition-opacity"
                      style={
                        isActive(item.path, item.slug)
                          ? { color: "var(--site-primary)", fontWeight: 500 }
                          : undefined
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              className="md:hidden p-2 -mr-2"
              aria-expanded={open}
              aria-controls="site-mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </>
        )}
      </div>

      {open && navigation.length > 0 && (
        <nav
          id="site-mobile-nav"
          aria-label="Main"
          className="md:hidden px-4 pb-4"
          style={{ borderTop: "1px solid var(--site-border)" }}
        >
          <ul className="flex flex-col gap-1 pt-3">
            {navigation.map((item) => (
              <li key={item.slug}>
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.path, item.slug) ? "page" : undefined}
                  className="block py-2 text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
