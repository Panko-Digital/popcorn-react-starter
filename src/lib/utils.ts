/**
 * Safely map CMS list data with a fallback.
 *
 * If the CMS returns data, it's mapped through the optional mapper function.
 * If the CMS data is empty or unavailable, the fallback array is returned instead.
 *
 * This ensures your UI always renders — even if the API is slow or down.
 *
 * @example
 * ```ts
 * const features = safeList(
 *   cmsFeatures,
 *   [{ title: 'Fast', description: 'Built for speed' }],
 *   (item) => ({ title: item.title, description: item.content })
 * );
 * ```
 */
export function safeList<T>(
    data: any,
    fallback: T[],
    mapper?: (item: any) => T,
): T[] {
    if (Array.isArray(data) && data.length > 0) {
        return mapper ? data.map(mapper) : (data as T[]);
    }
    return fallback;
}
