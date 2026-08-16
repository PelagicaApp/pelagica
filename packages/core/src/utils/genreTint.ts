const STORAGE_KEY = 'genreTintColors';

type TintMap = Record<string, string>;

function getStoredTints(): TintMap {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveStoredTints(map: TintMap) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function generateTintColor(): string {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 35 + Math.random() * 10; // 35–45%
    const lightness = 42 + Math.random() * 8; // 42–50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getGenreTint(genreId: string): string {
    const map = getStoredTints();
    if (map[genreId]) return map[genreId];

    const newColor = generateTintColor();
    map[genreId] = newColor;
    saveStoredTints(map);

    return newColor;
}
