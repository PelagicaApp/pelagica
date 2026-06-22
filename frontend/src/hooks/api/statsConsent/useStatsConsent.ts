import { useQuery } from '@tanstack/react-query';
import { getStatsConsent, type StatsConsent } from '@/api/stats';

export function useStatsConsent() {
    return useQuery<StatsConsent>({
        queryKey: ['stats-consent'],
        queryFn: async (): Promise<StatsConsent> => {
            return getStatsConsent();
        },
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });
}
