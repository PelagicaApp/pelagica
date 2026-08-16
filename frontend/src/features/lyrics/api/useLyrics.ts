import { getApi } from '@pelagica/core';
import { useQuery } from '@tanstack/react-query';
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import type { LyricDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@pelagica/core';

function getErrorStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    if ('response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (typeof response?.status === 'number') {
            return response.status;
        }
    }

    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
        return (error as { status: number }).status;
    }

    return undefined;
}

export function useLyrics(itemId: string | null | undefined) {
    return useQuery<LyricDto>({
        queryKey: ['lyrics', itemId],
        queryFn: async (): Promise<LyricDto> => {
            const api = getApi();
            const lyricsApi = getLyricsApi(api);
            const response = await lyricsApi.getLyrics({ itemId: itemId! });
            return response.data;
        },
        enabled: !!itemId,
        staleTime: 5 * 60_000,
        retry: (failureCount, error) => {
            if (getErrorStatus(error) === 404) {
                return false;
            }

            return getRetryConfig().retry(failureCount, error);
        },
    });
}
