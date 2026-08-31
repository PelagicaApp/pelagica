import { Jellyfin } from '@jellyfin/sdk';
import { getDeviceId } from '../utils/deviceId';

export type Platform = 'web' | 'tizen' | 'webos';

export interface PlatformCapabilities {
    /** Direct-play containers this platforms player supports beyond the browser default mp4/webm. */
    extraDirectPlayContainers: string[];
    /** Direct-play/passthrough audio codecs this platform supports beyond aac/mp3/opus/flac. */
    extraDirectPlayAudioCodecs: string[];
}

const PLATFORM_CAPABILITIES: Record<Platform, PlatformCapabilities> = {
    web: {
        extraDirectPlayContainers: [],
        extraDirectPlayAudioCodecs: [],
    },
    tizen: {
        extraDirectPlayContainers: ['mkv'],
        extraDirectPlayAudioCodecs: ['ac3', 'eac3'],
    },
    webos: {
        extraDirectPlayContainers: [],
        extraDirectPlayAudioCodecs: [],
    },
};

function getBrowserName(): string {
    if (platform === 'tizen') return 'Samsung Smart TV';
    if (platform === 'webos') return 'LG webOS';

    const ua = navigator.userAgent;
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Browser';
}

let clientName = 'Pelagica';
let clientVersion = '0.0.0';
let platform: Platform = 'web';
let jellyfinInstance: Jellyfin | null = null;

// Consuming apps must call this once at startup with their own package.json
// name/version, since the Jellyfin client identifies itself to the server.
export function setClientInfo(info: { name: string; version: string; platform?: Platform }) {
    clientName = info.name;
    clientVersion = info.version;
    platform = info.platform ?? 'web';
    jellyfinInstance = null;
}

export function getPlatform(): Platform {
    return platform;
}

export function getPlatformCapabilities(): PlatformCapabilities {
    return PLATFORM_CAPABILITIES[platform];
}

export function getJellyfinInstance(): Jellyfin {
    if (!jellyfinInstance) {
        jellyfinInstance = new Jellyfin({
            clientInfo: { name: clientName, version: clientVersion },
            deviceInfo: { name: getBrowserName(), id: getDeviceId() },
        });
    }
    return jellyfinInstance;
}

export function createApi(server: string, token?: string) {
    return getJellyfinInstance().createApi(server, token);
}
