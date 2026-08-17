import { useQuery } from '@tanstack/react-query';
import { getItemCached } from '../../api/getItemCached';

export function useItemPlayState(itemId: string | undefined, userId: string | undefined) {
    return useQuery({
        queryKey: ['itemPlayState', userId, itemId],
        enabled: !!userId && !!itemId,
        queryFn: async () => {
            if (!itemId || !userId) {
                throw new Error('Missing itemId or userId');
            }
            
            const data = await getItemCached(itemId, userId);

            return {
                played: data.UserData?.Played ?? false,
                playCount: data.UserData?.PlayCount ?? 0,
                lastPlayedDate: data.UserData?.LastPlayedDate ?? null,
            };
        },
    });
}
