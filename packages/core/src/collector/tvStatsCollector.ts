import { getClientVersion, getPlatform, type Platform } from '../api/jellyfinClient';
import { getStatsConsent } from '../api/stats';
import { randomUUID } from '../utils/randomUUID';

const INSTANCE_ID_KEY = 'pelagica_stats_instance_id';
const LAST_PING_KEY = 'pelagica_stats_last_ping';
const PING_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const COLLECTOR_URL = 'https://stats.pelagica.app/ping';

const TV_CLIENT_PLATFORMS: Partial<Record<Platform, string>> = {
    tizen: 'tizen',
    webos: 'webos',
};

const getOrCreateInstanceId = (): string => {
    let id = localStorage.getItem(INSTANCE_ID_KEY);
    if (!id) {
        id = randomUUID();
        localStorage.setItem(INSTANCE_ID_KEY, id);
    }
    return id;
};

// Baked in at build time (see tizen/webos release workflows) from the same secret the backend gets its COLLECTOR_PING_TOKEN from.
const getPingToken = (): string | undefined => import.meta.env.VITE_PING_TOKEN || undefined;

const sendPing = async (clientPlatform: string): Promise<void> => {
    const body = {
        instance_id: getOrCreateInstanceId(),
        version: getClientVersion(),
        client_type: 'tv',
        client_platform: clientPlatform,
        token: getPingToken(),
    };

    const res = await fetch(COLLECTOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (res.ok) {
        localStorage.setItem(LAST_PING_KEY, String(Date.now()));
    }
};

/** Sends a stats ping if the user has consented and it's been more than 24h since the last one. No-op on non-TV platforms. */
export async function checkAndSendTvStatsPing(): Promise<void> {
    const clientPlatform = TV_CLIENT_PLATFORMS[getPlatform()];
    if (!clientPlatform) return;

    const consent = await getStatsConsent();
    if (consent !== 'granted') return;

    const lastPing = Number(localStorage.getItem(LAST_PING_KEY) ?? 0);
    if (Date.now() - lastPing < PING_INTERVAL_MS) return;

    try {
        await sendPing(clientPlatform);
    } catch {
        // Network hiccups are fine, we'll retry on the next check.
    }
}

/**
 * Starts the TV stats collection loop: checks once now, then hourly, whether
 * a ping is due. Call this once at startup on TV clients. No-op elsewhere.
 */
export function initTvStatsCollector(): void {
    if (!TV_CLIENT_PLATFORMS[getPlatform()]) return;

    checkAndSendTvStatsPing();
    setInterval(checkAndSendTvStatsPing, CHECK_INTERVAL_MS);
}
