import { useQuery } from '@tanstack/react-query';
import { fetchCollection } from '../lib/api';

/**
 * Fetch a collection (list) by ID.
 *
 * Collections in Popcorn CMS are reusable lists of items — blog posts,
 * team members, products, testimonials, etc.
 *
 * @example
 * ```tsx
 * function TeamGrid() {
 *   const { data, isLoading } = useCollection('clx-team-collection-id');
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {data?.items?.map(member => (
 *         <div key={member.id}>
 *           <img src={member.mediaUrl} alt={member.title} />
 *           <h3>{member.title}</h3>
 *           <p>{member.content}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCollection(id: string) {
    return useQuery({
        queryKey: ['collection', id],
        queryFn: () => fetchCollection(id),
        enabled: !!id,
        retry: 2,
        retryDelay: 1000,
    });
}
