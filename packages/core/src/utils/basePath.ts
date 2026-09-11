/*
 * Public base path the app is served under, derived from Vite's `base` option.
 *
 * Normalised to either '' (served at the domain root) or '/segment' with no
 * trailing slash, so it can be concatenated directly with an absolute path.
 */
const rawBase = import.meta.env.BASE_URL ?? '/';

export const BASE_PATH =
    rawBase === '/' || rawBase === './' || rawBase === '.'
        ? ''
        : rawBase.replace(/\/+$/, '');

/** Prefixes an absolute app path with the deployment base path. */
export function withBasePath(path: string): string {
    return BASE_PATH + path;
}
