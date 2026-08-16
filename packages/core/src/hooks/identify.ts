import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getItemLookupApi } from '@jellyfin/sdk/lib/utils/api';
import type {
    MovieInfoRemoteSearchQuery,
    RemoteSearchResult,
    SeriesInfoRemoteSearchQuery,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getApi } from '../api/getApi';

// Fetch remote search results for a movie item
export function useMovieRemoteSearchResults(query: MovieInfoRemoteSearchQuery, enabled = true) {
    return useQuery({
        queryKey: ['itemLookup', 'movieRemoteSearch', query],
        queryFn: async () => {
            const api = getApi();
            const itemLookupApi = getItemLookupApi(api);
            const { data } = await itemLookupApi.getMovieRemoteSearchResults({
                movieInfoRemoteSearchQuery: query,
            });
            return data;
        },
        enabled: enabled && !!query.ItemId,
    });
}

export function useSeriesRemoteSearchResults(query: SeriesInfoRemoteSearchQuery, enabled = true) {
    return useQuery({
        queryKey: ['itemLookup', 'seriesRemoteSearch', query],
        queryFn: async () => {
            const api = getApi();
            const itemLookupApi = getItemLookupApi(api);
            const { data } = await itemLookupApi.getSeriesRemoteSearchResults({
                seriesInfoRemoteSearchQuery: query,
            });
            return data;
        },
        enabled: enabled && !!query.ItemId,
    });
}

export function useExternalIdInfos(itemId: string | undefined) {
    return useQuery({
        queryKey: ['itemLookup', 'externalIdInfos', itemId],
        queryFn: async () => {
            const api = getApi();
            const itemLookupApi = getItemLookupApi(api);
            const { data } = await itemLookupApi.getExternalIdInfos({
                itemId: itemId as string,
            });
            return data;
        },
        enabled: !!itemId,
    });
}

export function useApplySearchCriteria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            itemId,
            remoteSearchResult,
            replaceAllImages = true,
        }: {
            itemId: string;
            remoteSearchResult: RemoteSearchResult;
            replaceAllImages?: boolean;
        }) => {
            const api = getApi();
            const itemLookupApi = getItemLookupApi(api);
            await itemLookupApi.applySearchCriteria({
                itemId,
                remoteSearchResult,
                replaceAllImages,
            });
        },
        onSuccess: (_data, variables) => {
            // Invalidate whatever query key you use to fetch this item's details
            queryClient.invalidateQueries({ queryKey: ['item', variables.itemId] });
        },
    });
}
