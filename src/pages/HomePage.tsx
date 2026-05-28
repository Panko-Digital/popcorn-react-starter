import { usePageData } from "../hooks/usePageData";
import { safeList } from "../lib/utils";
import type { ContentField } from "../lib/api";

/**
 * Example home page demonstrating all Popcorn CMS patterns:
 * - Content fields with fallback defaults
 * - List data with safeList mapping
 * - Loading states
 */

// Default content — renders immediately while CMS data loads
const defaults: Record<string, ContentField> = {
  "hero-heading": { type: "text", value: "Welcome to Our Site" },
  "hero-subtitle": {
    type: "text",
    value: "Built with React and powered by Popcorn CMS",
  },
  "about-heading": { type: "text", value: "About Us" },
  "about-description": {
    type: "text",
    value: "We build great things for great people.",
  },
};

export function HomePage() {
  const { getContent, getList, isLoading } = usePageData("home");

  // Content fields — falls back to defaults if CMS is unavailable
  const content = getContent() || defaults;

  // List data — falls back to hardcoded items
  const features = safeList(
    getList("features"),
    [
      { title: "Fast", content: "Lightning-fast page loads" },
      { title: "Flexible", content: "Works with any frontend framework" },
      { title: "Secure", content: "Enterprise-grade security built in" },
    ],
    (item) => ({ title: item.title, content: item.content }),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {content["hero-heading"]?.value || defaults["hero-heading"].value}
        </h1>
        <p className="text-xl text-gray-600">
          {content["hero-subtitle"]?.value || defaults["hero-subtitle"].value}
        </p>
        {isLoading && (
          <p className="text-sm text-gray-400 mt-2">Loading fresh content...</p>
        )}
      </section>

      {/* Features grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {content["about-heading"]?.value || defaults["about-heading"].value}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {content["about-description"]?.value ||
            defaults["about-description"].value}
        </p>
      </section>
    </div>
  );
}
