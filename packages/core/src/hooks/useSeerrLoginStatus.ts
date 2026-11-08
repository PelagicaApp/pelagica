import { useQuery } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { getAccessToken, getServerUrl, getUserId } from '../utils/localstorageCredentials';
import { getSeerrLoginStatus } from '../api/seerr/status';

export function useSeerrLoginStatus() {
    const { config } = useConfig();
    const seerrUrl = config?.seerrUrl;

    return useQuery({
        // keyed by user so a status fetched before signing in to Jellyfin isn't reused after
        queryKey: ['seerrLoginStatus', seerrUrl, getServerUrl(), getUserId()],
        queryFn: getSeerrLoginStatus,
        enabled: !!seerrUrl && !!getAccessToken(),
        staleTime: 60 * 1000,
    });
}
