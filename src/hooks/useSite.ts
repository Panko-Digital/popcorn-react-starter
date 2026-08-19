import { useQuery } from '@tanstack/react-query';
import { fetchSite } from '../lib/api';

/**
 * Fetch site metadata — blueprint, navigation, locale, and site name.
 *
 * One request per session, shared by every component that calls this hook.
 * Cached longer than page content because design and navigation change rarely.
 */
export function useSite() {
    const query = useQuery({
        queryKey: ['site'],
        queryFn: fetchSite,
        retry: 2,
        retryDelay: 1000,
        staleTime: 15 * 60 * 1000,
    });

    return {
        ...query,
        site: query.data,
        blueprint: query.data?.blueprint,
        navigation: query.data?.navigation ?? [],
    };
}
