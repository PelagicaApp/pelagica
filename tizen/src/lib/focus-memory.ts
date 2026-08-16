const lastFocusedKeyByPath = new Map<string, string>();

export const rememberFocusedKey = (pathname: string, focusKey: string) => {
    lastFocusedKeyByPath.set(pathname, focusKey);
};

export const getRememberedFocusedKey = (pathname: string) => lastFocusedKeyByPath.get(pathname);
