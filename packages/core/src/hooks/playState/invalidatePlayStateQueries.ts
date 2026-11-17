import type { QueryClient } from '@tanstack/react-query';

const PLAY_STATE_LIST_QUERY_KEYS = [
    'items',
    'libraryItems',
    'sectionItems',
    'episodes',
    'seasons',
    'resume',
    'nextUp',
    'seriesNextUp',
    'continueWatchingAndNextUp',
    'similarItems',
    'boxSetItems',
    'itemCollections',
    'playlistItems',
    'searchItems',
    'mediaBarItems',
    'personFilmography',
    'useRecommendedItems',
];

export function invalidatePlayStateQueries(
    queryClient: QueryClient,
    itemId: string,
    userId?: string
) {
    queryClient.invalidateQueries({
        queryKey: ['userLibraryItem', itemId, userId],
    });
    queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    for (const key of PLAY_STATE_LIST_QUERY_KEYS) {
        queryClient.invalidateQueries({ queryKey: [key] });
    }
}
