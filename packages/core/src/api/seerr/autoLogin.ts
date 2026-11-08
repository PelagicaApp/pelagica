const AUTO_LOGIN_DISABLED_PREFIX = 'seerrAutoLoginDisabled:';

export function isSeerrAutoLoginDisabled(server: string): boolean {
    return localStorage.getItem(AUTO_LOGIN_DISABLED_PREFIX + server) === 'true';
}

export function setSeerrAutoLoginDisabled(server: string, disabled: boolean): void {
    if (disabled) {
        localStorage.setItem(AUTO_LOGIN_DISABLED_PREFIX + server, 'true');
    } else {
        localStorage.removeItem(AUTO_LOGIN_DISABLED_PREFIX + server);
    }
}
