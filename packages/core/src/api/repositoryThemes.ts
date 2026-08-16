const themeRepositoryBaseUrl = 'https://themes.pelagica.app/';

export interface RepositoryTheme {
    id: string;
    name: string;
    author: string;
    description: string;
    version: string;
    path: string;
    previews: string[];
}

export interface ThemesRepository {
    themes: RepositoryTheme[];
}

export const getRepositoryThemeUrl = (theme: RepositoryTheme): string => {
    return new URL(theme.path, themeRepositoryBaseUrl).toString();
};

export const fetchThemesRepository = async (): Promise<ThemesRepository> => {
    const indexUrl = new URL('index.json', themeRepositoryBaseUrl).toString();
    const response = await fetch(indexUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch theme index: ${response.statusText}`);
    }
    const themes = await response.json();
    return themes;
};

export const getThemePreviewUrl = (theme: RepositoryTheme, previewIndex: number = 0): string => {
    if (previewIndex < 0 || previewIndex >= theme.previews.length) {
        throw new Error('Invalid preview index');
    }
    return new URL(theme.previews[previewIndex], themeRepositoryBaseUrl).toString();
};
