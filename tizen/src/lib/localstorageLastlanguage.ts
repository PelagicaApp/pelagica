const STORAGE_KEY = 'lastLanguageByItem';

type ItemLanguageState = {
    subtitle?: number;
    audio?: number;
};

type LastLanguageMap = Record<string, ItemLanguageState>;

function getMap(): LastLanguageMap {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
        return {};
    }
}

export function getLastSubtitleLanguage(itemId: string | null): number | null {
    if (!itemId) return null;
    return getMap()[itemId]?.subtitle ?? null;
}

export function getLastAudioLanguage(itemId: string | null): number | null {
    if (!itemId) return null;
    return getMap()[itemId]?.audio ?? null;
}

export function setLastSubtitleLanguage(itemId: string, language: number): void {
    const map = getMap();
    map[itemId] = {
        ...map[itemId],
        subtitle: language,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function setLastAudioLanguage(itemId: string, language: number): void {
    const map = getMap();
    map[itemId] = {
        ...map[itemId],
        audio: language,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function removeLastSubtitleLanguage(itemId: string): void {
    const map = getMap();
    if (!map[itemId]) return;

    delete map[itemId].subtitle;

    if (Object.keys(map[itemId]).length === 0) {
        delete map[itemId];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
