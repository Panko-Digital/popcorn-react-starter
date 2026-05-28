import { useQuery } from '@tanstack/react-query';
import {
    fetchFullPage,
    extractPageContent,
    extractPageListContent,
    extractPageDynamicContent,
} from '../lib/api';

/**
 * Fetch a full page and extract multiple data types from it.
 *
 * Only ONE API call is made per page slug — all extractions use the cached response.
 * Multiple components using the same slug share the same request automatically.
 *
 * @example
 * ```tsx
 * function AboutPage() {
 *   const { getContent, getList, isLoading } = usePageData('about');
 *
 *   const heroContent = getContent('hero-block');
 *   const teamMembers = getList('team-block');
 *
 *   return (
 *     <div>
 *       <h1>{heroContent?.['heading']?.value}</h1>
 *       {teamMembers.map(m => <div key={m.id}>{m.title}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePageData(slug: string) {
    const query = useQuery({
        queryKey: ['page', slug],
        queryFn: () => fetchFullPage(slug),
        retry: 2,
        retryDelay: 1000,
    });

    /** Extract content fields from a block (or all blocks if no ref given) */
    const getContent = (blockRef?: string) => {
        if (!query.data) return null;
        return extractPageContent(query.data, blockRef);
    };

    /** Extract list items from a block */
    const getList = (blockRef: string, elementRef?: string) => {
        if (!query.data) return [];
        return extractPageListContent(query.data, blockRef, elementRef);
    };

    /** Extract dynamic content records from a block */
    const getDynamicContent = (blockRef: string, typeName?: string) => {
        if (!query.data) return [];
        return extractPageDynamicContent(query.data, blockRef, typeName);
    };

    return {
        ...query,
        pageData: query.data,
        getContent,
        getList,
        getDynamicContent,
    };
}
