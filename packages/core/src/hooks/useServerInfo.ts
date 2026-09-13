import { getUnauthenticatedApi } from '../api/getApi';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';

export function useServerInfo() {
    return useQuery({
        queryKey: ['serverInfo'],
        queryFn: async () => {
            const api = getUnauthenticatedApi();
            const systemApi = getSystemApi(api);
            const info = await systemApi.getPublicSystemInfo();
            return info.data;
        },
        staleTime: 30000,
    });
}
