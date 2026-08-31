import './webos-globals.d.ts';
import type { TvNavigationAdapter } from './types';
import { dispatchTvBackKey } from './backKeyEvent';

const BACK_KEY_CODE = 461;

export const webosNavigationAdapter: TvNavigationAdapter = {
    init() {
        window.addEventListener('keydown', (event) => {
            if (event.keyCode === BACK_KEY_CODE) dispatchTvBackKey();
        });
    },
    registerMediaKeys() {
        // webOS already delivers hardware media keys as ordinary keydown
    },
    exitApp() {
        try {
            window.PalmSystem?.platformBack?.();
        } catch {
            // Not running on a webOS device
        }
    },
};
