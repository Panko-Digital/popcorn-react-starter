import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFullPage } from '../lib/api';

/**
 * Prefetch a page's data when a component mounts.
 *
 * Use this in navigation components or parent layouts to ensure
 * page data is ready before the user navigates there.
 *
 * @example
 * ```tsx
 * function Navigation() {
 *   // Prefetch pages the user is likely to visit
 *   usePrefetchPage('about');
 *   usePrefetchPage('services');
 *
 *   return (
 *     <nav>
 *       <a href="/about">About</a>
 *       <a href="/services">Services</a>
 *     </nav>
 *   );
 * }
 * ```
 */
export function usePrefetchPage(slug: string, enabled = true) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) return;

        const queryKey = ['page', slug];
        const existingData = queryClient.getQueryData(queryKey);

        // Skip if we already have fresh data
        if (existingData) return;

        queryClient.prefetchQuery({
            queryKey,
            queryFn: () => fetchFullPage(slug),
        });
    }, [slug, enabled, queryClient]);
}
