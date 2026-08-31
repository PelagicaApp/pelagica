import { getPlatform } from '@pelagica/core';
import { getTizenLocalIpAddress } from './tizenLocalIp';
import { getWebosLocalIpAddress } from './webosLocalIp';

export function getLocalIpAddress(): Promise<string | null> {
    switch (getPlatform()) {
        case 'tizen':
            return getTizenLocalIpAddress();
        case 'webos':
            return getWebosLocalIpAddress();
        default:
            return Promise.resolve(null);
    }
}
