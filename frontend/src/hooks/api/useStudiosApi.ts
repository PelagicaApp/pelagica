import { getAccessToken, getServerUrl } from '@/utils/localstorageCredentials';
import { useQuery } from '@tanstack/react-query';

export interface StudioSummary {
    id: string;
    name: string;
    count: number;
    hasThumb?: boolean;
}

export function useStudiosBackendAvailable() {
    return useQuery({
        queryKey: ['studios', 'backend-available'],
        queryFn: async () => {
            try {
                const response = await fetch('/api/studios/health');
                if (!response.ok) return false;
                const data = (await response.json()) as { ok?: boolean };
                return data.ok === true;
            } catch {
                return false;
            }
        },
        staleTime: Infinity,
        retry: false,
    });
}

export function useStudiosByItemCount(limit: number = 20, hasThumb: boolean = true) {
    return useQuery({
        queryKey: ['studios', 'byItemCount', limit, hasThumb],
        queryFn: async () => {
            const server = getServerUrl();
            const token = getAccessToken();

            if (!server || !token) {
                return [] as StudioSummary[];
            }

            const params = new URLSearchParams({
                jellyfin_url: server,
                limit: String(limit),
                hasThumb: String(hasThumb),
            });

            const response = await fetch(`/api/studios?${params.toString()}`, {
                headers: {
                    Authorization: token,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch studios');
            }

            return (await response.json()) as StudioSummary[];
        },
    });
}
