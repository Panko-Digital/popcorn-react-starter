import { useQuery } from '@tanstack/react-query';
import { fetchMedia } from '../lib/api';

/**
 * Fetch media items from Popcorn CMS.
 *
 * @example
 * ```tsx
 * function Gallery() {
 *   const { data, isLoading } = useMedia({ limit: 12 });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {data?.map(item => (
 *         <img
 *           key={item.id}
 *           src={item.url}
 *           alt={item.altText || item.originalFilename}
 *           className="rounded-lg"
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMedia(options?: { limit?: number; tag?: string }) {
    return useQuery({
        queryKey: ['media', options],
        queryFn: () => fetchMedia(options),
        retry: 2,
        retryDelay: 1000,
    });
}
