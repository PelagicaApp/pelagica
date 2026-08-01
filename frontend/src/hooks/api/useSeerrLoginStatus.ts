import { useQuery } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { getSeerrLoginStatus } from '@/api/seerr/status';

export function useSeerrLoginStatus() {
    const { config } = useConfig();
    const seerrUrl = config?.seerrUrl;

    return useQuery({
        queryKey: ['seerrLoginStatus', seerrUrl, getServerUrl()],
        queryFn: getSeerrLoginStatus,
        enabled: !!seerrUrl,
        staleTime: 60 * 1000,
    });
}
