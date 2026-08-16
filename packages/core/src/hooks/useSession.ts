import { getApi } from '../api/getApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useQuery } from '@tanstack/react-query';
import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models';

export function useSession(itemId: string | null | undefined, enabled = true) {
    return useQuery<SessionInfoDto | undefined>({
        queryKey: ['currentSession', itemId],
        queryFn: async () => {
            const api = getApi();
            const sessionApi = getSessionApi(api);
            const sessions = await sessionApi.getSessions();
            const session = sessions.data?.find((s) => s.NowPlayingItem?.Id === itemId);
            return session;
        },
        enabled: !!itemId && enabled,
        staleTime: 2000,
        refetchInterval: 2000,
    });
}
