import { getApi } from '../api/getApi';
import { getRetryConfig } from '../utils/authErrorHandler';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery } from '@tanstack/react-query';

export function usePersonFilmography(personId: string | null | undefined, userId?: string) {
    return useQuery({
        queryKey: ['personFilmography', personId, userId],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);

            const response = await itemsApi.getItems({
                personIds: [personId!],
                userId: userId,
                recursive: true,
                includeItemTypes: ['Movie', 'Series'],
                fields: ['PrimaryImageAspectRatio', 'Overview', 'Genres'],
                sortBy: ['PremiereDate'],
                sortOrder: ['Descending'],
                enableImages: true,
                enableUserData: true,
                locationTypes: ['FileSystem'],
            });

            return response.data.Items || [];
        },
        enabled: !!personId,
        ...getRetryConfig(),
    });
}
