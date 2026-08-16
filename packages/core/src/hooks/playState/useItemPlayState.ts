import { useQuery } from '@tanstack/react-query';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getApi } from '../../api/getApi';

export function useItemPlayState(itemId: string | undefined, userId: string | undefined) {
    return useQuery({
        queryKey: ['itemPlayState', userId, itemId],
        enabled: !!userId && !!itemId,
        queryFn: async () => {
            if (!itemId || !userId) {
                throw new Error('Missing itemId or userId');
            }

            const api = getApi();
            const userLibraryApi = getUserLibraryApi(api);

            const { data } = await userLibraryApi.getItem({
                userId,
                itemId,
            });

            return {
                played: data.UserData?.Played ?? false,
                playCount: data.UserData?.PlayCount ?? 0,
                lastPlayedDate: data.UserData?.LastPlayedDate ?? null,
            };
        },
    });
}
