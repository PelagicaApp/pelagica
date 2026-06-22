import { Jellyfin } from '@jellyfin/sdk';
import { VERSION } from '../utils/version';
import { getDeviceId } from '@/utils/deviceId';

function getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Browser';
}

export const jellyfin = new Jellyfin({
    clientInfo: { name: 'Pelagica', version: VERSION },
    deviceInfo: { name: getBrowserName(), id: getDeviceId() },
});

export function createApi(server: string, token?: string) {
    return jellyfin.createApi(server, token);
}
