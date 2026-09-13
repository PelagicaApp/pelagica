import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setStatsConsent } from '../../api/stats';
import { checkAndSendTvStatsPing } from '../../collector/tvStatsCollector';

export function useSetStatsConsent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (consent: boolean) => {
            return setStatsConsent(consent);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stats-consent'] });
            checkAndSendTvStatsPing();
        },
    });
}
