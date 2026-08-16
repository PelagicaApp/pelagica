import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getServerUrl } from '@pelagica/core';
import type { AppConfig } from '@pelagica/core';
import {
    fetchPluginConfig,
    fetchPluginEnabled,
    getInstalledPluginInfo,
    installPelagicaPlugin,
    restartJellyfinServer,
    savePluginConfig,
} from '@pelagica/core';

export type PelagicaPluginStatus = 'checking' | 'active' | 'needs-restart' | 'not-installed';

const INSTALL_POLL_TIMEOUT_MS = 30_000;
const INSTALL_POLL_INTERVAL_MS = 2_000;

async function resolvePluginStatus(serverUrl: string): Promise<PelagicaPluginStatus> {
    const enabled = await fetchPluginEnabled(serverUrl);
    if (enabled) return 'active';

    const installed = await getInstalledPluginInfo();
    return installed ? 'needs-restart' : 'not-installed';
}

async function fetchLegacyConfig(serverUrl: string): Promise<Record<string, unknown> | null> {
    try {
        const response = await fetch('/api/config?jellyfin_url=' + encodeURIComponent(serverUrl));
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

async function migrateLegacyConfigIfNeeded(serverUrl: string): Promise<boolean> {
    const pluginConfig = await fetchPluginConfig(serverUrl);
    if (Object.keys(pluginConfig).length > 0) return false;

    const legacyConfig = await fetchLegacyConfig(serverUrl);
    if (!legacyConfig || Object.keys(legacyConfig).length === 0) return false;

    await savePluginConfig(serverUrl, legacyConfig as AppConfig);
    return true;
}

export const usePelagicaPluginStatus = () => {
    const { t } = useTranslation('settings');
    const queryClient = useQueryClient();
    const serverUrl = getServerUrl() || '';

    const [installing, setInstalling] = useState(false);
    const [restarting, setRestarting] = useState(false);
    const installDeadlineRef = useRef(0);
    const migratedForServerRef = useRef<string | null>(null);

    const queryKey = ['pelagica-plugin-status', serverUrl];

    const query = useQuery({
        queryKey,
        queryFn: () => resolvePluginStatus(serverUrl),
        enabled: !!serverUrl,
        refetchInterval: (q) =>
            installing &&
            q.state.data === 'not-installed' &&
            Date.now() < installDeadlineRef.current
                ? INSTALL_POLL_INTERVAL_MS
                : false,
    });

    useEffect(() => {
        if (query.data !== 'active' || !serverUrl || migratedForServerRef.current === serverUrl) {
            return;
        }
        migratedForServerRef.current = serverUrl;

        void migrateLegacyConfigIfNeeded(serverUrl).then((migrated) => {
            if (migrated) {
                void queryClient.invalidateQueries({ queryKey: ['config', serverUrl] });
            }
        });
    }, [query.data, serverUrl, queryClient]);

    const install = async () => {
        setInstalling(true);
        installDeadlineRef.current = Date.now() + INSTALL_POLL_TIMEOUT_MS;
        setTimeout(() => setInstalling(false), INSTALL_POLL_TIMEOUT_MS);
        try {
            toast.promise(
                async () => {
                    await installPelagicaPlugin();
                    await queryClient.invalidateQueries({ queryKey });
                },
                {
                    loading: t('plugin_install_started'),
                    success: t('plugin_install_success'),
                    error: t('plugin_install_error'),
                }
            );
        } catch {
            toast.error(t('plugin_install_error'));
            setInstalling(false);
        }
    };

    const restart = async () => {
        setRestarting(true);
        try {
            await restartJellyfinServer();
            toast.success(t('plugin_restart_started'));
        } catch {
            toast.error(t('plugin_restart_error'));
        } finally {
            setRestarting(false);
        }
    };

    return {
        status: (!serverUrl ? 'checking' : (query.data ?? 'checking')) as PelagicaPluginStatus,
        loading: query.isLoading,
        installing,
        restarting,
        install,
        restart,
    };
};
