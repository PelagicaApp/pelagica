import { useState, useCallback, useEffect, useRef } from 'react';
import { VERSION } from '@/utils/version';
import { isWindowsDesktop } from '@/utils/desktopApp';

export interface GitHubAsset {
    name: string;
    browser_download_url: string;
    size: number;
    content_type?: string;
}

export interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    html_url: string;
    assets: GitHubAsset[];
}

export interface UpdateInfo {
    version: string;
    tagName: string;
    releaseName: string;
    releaseNotes: string;
    publishedAt: string;
    releaseUrl: string;
    installerName?: string;
    installerDownloadUrl?: string;
    installerSize?: number;
    isUpdateAvailable: boolean;
}

export type UpdaterState =
    | 'idle'
    | 'checking'
    | 'up-to-date'
    | 'update-available'
    | 'downloading'
    | 'downloaded'
    | 'installing'
    | 'error';

export function compareVersions(a: string, b: string): number {
    const cleanA = a.replace(/^v/, '').trim();
    const cleanB = b.replace(/^v/, '').trim();
    const partsA = cleanA.split('.').map((p) => parseInt(p, 10) || 0);
    const partsB = cleanB.split('.').map((p) => parseInt(p, 10) || 0);
    const maxLen = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < maxLen; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }
    return 0;
}

export function findWindowsInstallerAsset(assets: GitHubAsset[] = []): GitHubAsset | undefined {
    // Look specifically for Windows installer exe
    const exeAssets = assets.filter((a) => a.name.toLowerCase().endsWith('.exe'));
    return (
        exeAssets.find(
            (a) =>
                a.name.toLowerCase().includes('windows') &&
                a.name.toLowerCase().includes('installer')
        ) ||
        exeAssets.find((a) => a.name.toLowerCase().includes('windows')) ||
        exeAssets[0]
    );
}

export function formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function useAppUpdater() {
    const [state, setState] = useState<UpdaterState>('idle');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [progress, setProgress] = useState(0);
    const [bytesDownloaded, setBytesDownloaded] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSimulated, setIsSimulated] = useState(false);
    const pollIntervalRef = useRef<number | null>(null);

    const cleanupPolling = () => {
        if (pollIntervalRef.current !== null) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => cleanupPolling();
    }, []);

    const checkForUpdates = useCallback(async () => {
        setState('checking');
        setErrorMessage(null);
        setProgress(0);

        try {
            const res = await fetch(
                'https://api.github.com/repos/PelagicaApp/pelagica/releases/latest',
                {
                    headers: { Accept: 'application/vnd.github.v3+json' },
                }
            );

            if (!res.ok) {
                throw new Error(`GitHub API HTTP ${res.status}`);
            }

            const data: GitHubRelease = await res.json();
            const latestVer = data.tag_name.replace(/^v/, '');
            const currentVer = VERSION.replace(/^v/, '');
            const isNewer = compareVersions(latestVer, currentVer) > 0;
            const winAsset = findWindowsInstallerAsset(data.assets);

            const info: UpdateInfo = {
                version: latestVer,
                tagName: data.tag_name,
                releaseName: data.name || `Pelagica v${latestVer}`,
                releaseNotes: data.body || '',
                publishedAt: data.published_at,
                releaseUrl: data.html_url,
                installerName: winAsset?.name,
                installerDownloadUrl: winAsset?.browser_download_url,
                installerSize: winAsset?.size,
                isUpdateAvailable: isNewer,
            };

            setUpdateInfo(info);
            setIsSimulated(false);
            if (isNewer) {
                setState('update-available');
            } else {
                setState('up-to-date');
            }
        } catch (err: unknown) {
            console.error('Failed to check for updates:', err);
            setState('error');
            setErrorMessage(err instanceof Error ? err.message : 'Güncellemeler denetlenemedi');
        }
    }, []);

    const startDownloadAndInstall = useCallback(async () => {
        if (!updateInfo) return;

        const downloadUrl = updateInfo.installerDownloadUrl;
        const targetVersion = updateInfo.version;

        if (isWindowsDesktop() && downloadUrl) {
            try {
                setState('downloading');
                setProgress(0);
                setErrorMessage(null);

                const startRes = await fetch('/api/desktop/update/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: downloadUrl, version: targetVersion }),
                });

                if (!startRes.ok) {
                    const errJson = await startRes.json().catch(() => ({}));
                    throw new Error(errJson.error || `Download failed: ${startRes.statusText}`);
                }

                // Poll status
                cleanupPolling();
                pollIntervalRef.current = window.setInterval(async () => {
                    try {
                        const statusRes = await fetch('/api/desktop/update/status');
                        if (!statusRes.ok) return;

                        const data = await statusRes.json();
                        setProgress(data.progress || 0);
                        setBytesDownloaded(data.bytesDownloaded || 0);
                        setTotalBytes(data.totalBytes || 0);

                        if (data.status === 'downloaded') {
                            cleanupPolling();
                            setState('downloaded');

                            // Automatically trigger installation
                            setState('installing');
                            const installRes = await fetch('/api/desktop/update/install', {
                                method: 'POST',
                            });

                            if (!installRes.ok) {
                                const errJson = await installRes.json().catch(() => ({}));
                                throw new Error(errJson.error || 'Kurulum başlatılamadı');
                            }
                        } else if (data.status === 'error') {
                            cleanupPolling();
                            setState('error');
                            setErrorMessage(data.error || 'İndirme sırasında hata oluştu');
                        }
                    } catch (e: unknown) {
                        cleanupPolling();
                        setState('error');
                        setErrorMessage(e instanceof Error ? e.message : 'Güncelleme hatası');
                    }
                }, 400);
            } catch (err: unknown) {
                cleanupPolling();
                setState('error');
                setErrorMessage(err instanceof Error ? err.message : 'Güncelleme başlatılamadı');
            }
        } else {
            // Simulated / Dev mode or non-Wails browser
            setState('downloading');
            setProgress(0);
            const total = updateInfo.installerSize || 45 * 1024 * 1024;
            setTotalBytes(total);

            let current = 0;
            const timer = window.setInterval(() => {
                current += 7;
                if (current >= 100) {
                    current = 100;
                    window.clearInterval(timer);
                    setProgress(100);
                    setBytesDownloaded(total);
                    setState('downloaded');

                    // Prompt or simulate install launch
                    window.setTimeout(() => {
                        setState('installing');
                        window.setTimeout(() => {
                            setState('up-to-date');
                        }, 2500);
                    }, 800);
                } else {
                    setProgress(current);
                    setBytesDownloaded(Math.floor((total * current) / 100));
                }
            }, 120);
        }
    }, [updateInfo]);

    // Allows user/developer to test update UI when the current version is already latest
    const simulateUpdate = useCallback((simulatedVersion = '4.12.0') => {
        setIsSimulated(true);
        const info: UpdateInfo = {
            version: simulatedVersion,
            tagName: `v${simulatedVersion}`,
            releaseName: `Pelagica v${simulatedVersion} (Yeni Özellikler & Güncellemeler)`,
            releaseNotes:
                '✨ Windows için otomatik güncelleme sistemi eklendi.\n🇹🇷 Eksiksiz Türkçe dil desteği ve arayüz geliştirmeleri.\n⚡ Performans ve kararlılık iyileştirmeleri.',
            publishedAt: new Date().toISOString(),
            releaseUrl: 'https://github.com/PelagicaApp/pelagica/releases',
            installerName: `pelagica-windows-amd64-installer-${simulatedVersion}.exe`,
            installerDownloadUrl: `https://github.com/PelagicaApp/pelagica/releases/download/${simulatedVersion}/pelagica-windows-amd64-installer-${simulatedVersion}.exe`,
            installerSize: 46800000,
            isUpdateAvailable: true,
        };
        setUpdateInfo(info);
        setState('update-available');
        setProgress(0);
        setErrorMessage(null);
    }, []);

    const resetToCurrent = useCallback(() => {
        setIsSimulated(false);
        checkForUpdates();
    }, [checkForUpdates]);

    return {
        state,
        updateInfo,
        progress,
        bytesDownloaded,
        totalBytes,
        errorMessage,
        isSimulated,
        checkForUpdates,
        startDownloadAndInstall,
        simulateUpdate,
        resetToCurrent,
    };
}
