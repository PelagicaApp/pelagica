import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';
import { getPluginsApi } from '@jellyfin/sdk/lib/utils/api/plugins-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import type { PluginInfo } from '@jellyfin/sdk/lib/generated-client/models';
import { getApi, getAuthorizationHeader } from './getApi';
import type { AppConfig } from '../hooks/useConfig';

export const PELAGICA_PLUGIN_GUID = '3b9ad352-24fd-4792-a41d-b7673744bb03';
export const PELAGICA_PLUGIN_NAME = 'Pelagica';
export const PELAGICA_MANIFEST_URL =
    'https://raw.githubusercontent.com/PelagicaApp/jellyfin-plugin/main/manifest.json';
export const PELAGICA_PLUGIN_REPO_URL = 'https://github.com/PelagicaApp/jellyfin-plugin';

function pluginUrl(serverUrl: string, path: string): string {
    return serverUrl.replace(/\/+$/, '') + path;
}

function normalizeGuid(guid: string): string {
    return guid.replace(/-/g, '').toLowerCase();
}

export async function fetchPluginEnabled(serverUrl: string): Promise<boolean> {
    try {
        const response = await fetch(pluginUrl(serverUrl, '/Pelagica/Enabled'));
        if (!response.ok) return false;
        return (await response.json()) === true;
    } catch {
        return false;
    }
}

export async function fetchPluginConfig(serverUrl: string): Promise<AppConfig> {
    const response = await fetch(pluginUrl(serverUrl, '/Pelagica/Config'));
    if (!response.ok) {
        throw new Error(`Failed to fetch plugin config: ${response.statusText}`);
    }
    return (await response.json()) as AppConfig;
}

export async function savePluginConfig(serverUrl: string, config: AppConfig): Promise<void> {
    const response = await fetch(pluginUrl(serverUrl, '/Pelagica/Config'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: getAuthorizationHeader(),
        },
        body: JSON.stringify(config),
    });
    if (!response.ok) {
        throw new Error(`Failed to save plugin config: ${response.statusText}`);
    }
}

export async function getInstalledPluginInfo(): Promise<PluginInfo | undefined> {
    const { data: plugins } = await getPluginsApi(getApi()).getPlugins();
    return plugins.find(
        (p) => !!p.Id && normalizeGuid(p.Id) === normalizeGuid(PELAGICA_PLUGIN_GUID)
    );
}

export async function installPelagicaPlugin(): Promise<void> {
    const api = getApi();
    const packageApi = getPackageApi(api);

    const { data: repositories } = await packageApi.getRepositories();
    const alreadyAdded = repositories.some((repo) => repo.Url === PELAGICA_MANIFEST_URL);

    if (!alreadyAdded) {
        await packageApi.setRepositories({
            repositoryInfo: [
                ...repositories,
                { Name: PELAGICA_PLUGIN_NAME, Url: PELAGICA_MANIFEST_URL, Enabled: true },
            ],
        });
    }

    await packageApi.installPackage({
        name: PELAGICA_PLUGIN_NAME,
        assemblyGuid: PELAGICA_PLUGIN_GUID,
    });
}

export async function restartJellyfinServer(): Promise<void> {
    await getSystemApi(getApi()).restartApplication();
}

export function getPluginLogoUrl(serverUrl: string, mode: 'light' | 'dark'): string {
    return pluginUrl(serverUrl, `/Pelagica/Logo/${mode}`);
}

export async function uploadPluginLogo(
    serverUrl: string,
    mode: 'light' | 'dark',
    file: File
): Promise<void> {
    const response = await fetch(getPluginLogoUrl(serverUrl, mode), {
        method: 'POST',
        headers: {
            'Content-Type': file.type,
            Authorization: getAuthorizationHeader(),
        },
        body: file,
    });
    if (!response.ok) {
        throw new Error(`Failed to upload ${mode} logo: ${response.statusText}`);
    }
}
