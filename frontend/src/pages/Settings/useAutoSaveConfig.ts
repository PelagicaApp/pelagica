import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig, useUpdateConfig, type AppConfig } from '@/hooks/api/useConfig';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useAutoSaveConfig = () => {
    const { t } = useTranslation('settings');
    const { config, loading, error } = useConfig();
    const { updateConfig } = useUpdateConfig();
    const queryClient = useQueryClient();

    const saveConfig = useCallback(
        (updater: (prev: AppConfig) => AppConfig) => {
            const newConfig = updater(config);
            queryClient.setQueryData(['config'], newConfig);
            void (async () => {
                try {
                    await updateConfig(newConfig);
                } catch {
                    toast.error(t('settings_save_error'));
                }
            })();
        },
        [config, queryClient, updateConfig, t]
    );

    return { config, loading, error, saveConfig };
};
