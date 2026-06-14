import { HomePage } from "./pages/HomePage";
import { ContactForm } from "./components/ContactForm";
import { SeoHead } from "./components/SeoHead";

function App() {
  // Site config from the published shell or env vars
  const siteConfig =
    typeof window !== "undefined" ? (window as any).POPCORN_SITE_CONFIG : null;
  const siteName = siteConfig?.siteName || "My Site";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic SEO meta tags — updates <head> after content loads */}
      <SeoHead
        title="Home"
        siteName={siteName}
        description="Welcome to our site"
        pageSlug="home"
      />
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-gray-900">
            My Site
          </a>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">
              Features
            </a>
            <a href="#contact" className="hover:text-gray-900">
              Contact
            </a>
          </div>
        </nav>
      </header>

      {/* Page content — loaded from Popcorn CMS */}
      <HomePage />

      {/* Contact form — submits to Popcorn CMS */}
      <section id="contact" className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Get in Touch
          </h2>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-200">
        Powered by{" "}
        <a href="https://popcorncms.com" className="underline">
          Popcorn CMS
        </a>
      </footer>
    </div>
  );
}

export default App;
