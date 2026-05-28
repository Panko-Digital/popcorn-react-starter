# Popcorn CMS — React Starter

A ready-to-use React + Vite starter for building websites powered by [Popcorn CMS](https://popcorncms.com).

## What's included

- **TanStack Query** for data fetching with automatic caching and deduplication
- **Typed API client** with content extraction helpers
- **React hooks** for loading pages, collections, media, and forms
- **Fallback defaults** so your site renders even when the API is unreachable
- **Tailwind CSS** for styling
- **TypeScript** throughout

## Quick start

```bash
# Clone this repo
git clone https://github.com/popcorncms/react-starter.git my-site
cd my-site

# Install dependencies
npm install

# Add your API key
cp .env.example .env
# Edit .env and add your Popcorn CMS API key

# Start development
npm run dev
```

## Configuration

Create a `.env` file with:

```env
VITE_API_URL=https://api.popcorncms.com/v1/public
VITE_API_KEY=your-api-key-here
```

Get your API key from **Popcorn CMS → Settings → API Keys**.

## Project structure

```
src/
├── lib/
│   ├── api.ts          # API client and content extraction utilities
│   ├── forms.ts        # Form submission helper
│   └── utils.ts        # Utility functions (safeList, etc.)
├── hooks/
│   ├── usePageData.ts      # Full page data with content/list/dynamic helpers
│   ├── usePageContent.ts   # Simple content-only hook
│   ├── useCollection.ts    # Collection/list items hook
│   ├── useMedia.ts         # Media gallery hook
│   └── usePrefetchPage.ts  # Prefetch for instant navigation
├── components/
│   └── ExamplePage.tsx     # Example component showing all patterns
├── pages/
│   └── HomePage.tsx        # Example page with fallback content
├── App.tsx
└── main.tsx
```

## Core concepts

### 1. One API call per page

Each page in Popcorn CMS contains blocks, and each block contains elements. The `usePageData` hook fetches the entire page in a single request, then you extract what you need:

```tsx
import { usePageData } from './hooks/usePageData';

function AboutPage() {
  const { getContent, getList, isLoading } = usePageData('about');

  const content = getContent('hero-block');
  const teamMembers = getList('team-block');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{content?.['heading']?.value}</h1>
      <p>{content?.['description']?.value}</p>

      {teamMembers.map(member => (
        <div key={member.id}>{member.title}</div>
      ))}
    </div>
  );
}
```

### 2. Fallback defaults

Use `safeList` to provide fallback content that renders immediately while CMS data loads (or if the API is down):

```tsx
import { safeList } from './lib/utils';

const features = safeList(
  cmsData,                    // CMS data (may be empty)
  [                           // Fallback defaults
    { title: 'Fast', content: 'Built for speed' },
    { title: 'Secure', content: 'Enterprise-grade security' },
  ],
  (item) => ({               // Optional mapper for CMS data
    title: item.title,
    content: item.content,
  })
);
```

### 3. Form submissions

```tsx
import { submitForm } from './lib/forms';

async function handleSubmit(formData) {
  const result = await submitForm('your-form-id', {
    email: formData.email,
    name: formData.name,
    message: formData.message,
  });

  if (result.success) {
    alert('Thanks for your message!');
  }
}
```

### 4. Prefetching

Prefetch pages on hover or mount for instant navigation:

```tsx
import { usePrefetchPage } from './hooks/usePrefetchPage';

function Navigation() {
  // Prefetch the about page when nav mounts
  usePrefetchPage('about');

  return <a href="/about">About</a>;
}
```

## API reference

### Hooks

| Hook | Purpose |
|------|---------|
| `usePageData(slug)` | Full page with `getContent()`, `getList()`, `getDynamicContent()` |
| `usePageContent(slug, blockRef?)` | Simple content fields from a page |
| `useCollection(id)` | Collection items with pagination |
| `useMedia(options?)` | Media gallery with filters |
| `usePrefetchPage(slug)` | Prefetch page data on mount |

### API utilities

| Function | Purpose |
|----------|---------|
| `fetchFullPage(slug)` | Fetch a complete page with all blocks |
| `fetchPages()` | List all published pages |
| `extractPageContent(page, blockRef?)` | Extract content fields from page data |
| `extractPageListContent(page, blockRef)` | Extract list items from page data |
| `submitForm(formId, fields)` | Submit a form |

## Deployment

This is a standard Vite + React app. Deploy anywhere:

- **Vercel**: `npm run build` → deploy `dist/`
- **Netlify**: Set build command to `npm run build`, publish directory to `dist/`
- **Cloudflare Pages**: Same as above
- **Any static host**: Upload the `dist/` folder

## License

MIT
