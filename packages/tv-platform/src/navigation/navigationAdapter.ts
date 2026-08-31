import { getPlatform } from '@pelagica/core';
import type { TvNavigationAdapter } from './types';
import { tizenNavigationAdapter } from './tizenAdapter';
import { webosNavigationAdapter } from './webosAdapter';

const noopNavigationAdapter: TvNavigationAdapter = {
    init() {},
    registerMediaKeys() {},
    exitApp() {},
};

/** Returns the TvNavigationAdapter for the platform set via `setClientInfo`. */
export function getNavigationAdapter(): TvNavigationAdapter {
    switch (getPlatform()) {
        case 'tizen':
            return tizenNavigationAdapter;
        case 'webos':
            return webosNavigationAdapter;
        default:
            return noopNavigationAdapter;
    }
}
