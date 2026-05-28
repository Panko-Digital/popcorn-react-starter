import { useQuery } from '@tanstack/react-query';
import { fetchFullPage, extractPageContent } from '../lib/api';

/**
 * Simple hook to fetch page content fields.
 *
 * Use this when you only need text/media content from a page (no lists or dynamic content).
 * For more complex pages, use `usePageData` instead.
 *
 * @example
 * ```tsx
 * function HeroSection() {
 *   const { content, isLoading } = usePageContent('home', 'hero');
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>{content?.['heading']?.value || 'Welcome'}</h1>
 *       <p>{content?.['subtitle']?.value || 'Default subtitle'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePageContent(slug: string, blockRef?: string) {
    const query = useQuery({
        queryKey: ['page', slug],
        queryFn: () => fetchFullPage(slug),
        retry: 2,
        retryDelay: 1000,
    });

    const content =
        query.data && blockRef
            ? extractPageContent(query.data, blockRef)
            : query.data
                ? extractPageContent(query.data)
                : null;

    return {
        ...query,
        content,
    };
}
