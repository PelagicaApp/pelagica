import { getUnauthenticatedApi } from '@/api/getApi';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { useQuery } from '@tanstack/react-query';

export function useServerBranding(serverUrl?: string) {
    return useQuery({
        queryKey: ['serverBranding', serverUrl],
        enabled: !!serverUrl,
        queryFn: async () => {
            const api = getUnauthenticatedApi();
            const brandingApi = getBrandingApi(api);
            const branding = await brandingApi.getBrandingOptions();
            return branding.data;
        },
        staleTime: 30000,
    });
}
