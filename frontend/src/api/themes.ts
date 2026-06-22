import { getServerUrl } from '@/utils/localstorageCredentials';
import { getAuthorizationHeader } from '@/api/getApi';

export interface ThemeSummary {
    id: string;
    name: string;
    version: string;
    author: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Theme {
    name: string;
    author: string;
    description: string;
    version: string;
    colors: Colors;
    radius: string;
    modes: ThemeMode[];
}

export interface Colors {
    light: Record<string, string>;
    dark: Record<string, string>;
}

export const fetchThemes = async (): Promise<ThemeSummary[]> => {
    const response = await fetch('/api/themes');
    if (!response.ok) {
        throw new Error('Failed to fetch themes');
    }
    return response.json();
};

export const fetchThemeById = async (id: string): Promise<Theme> => {
    const response = await fetch(`/api/themes/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch theme with id: ${id}`);
    }
    return response.json();
};

export const createTheme = async (theme: string): Promise<{ id: string }> => {
    const response = await fetch(
        '/api/themes?jellyfin_url=' + encodeURIComponent(getServerUrl() || ''),
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthorizationHeader(),
            },
            body: JSON.stringify(theme),
        }
    );
    if (!response.ok) {
        throw new Error('Failed to create theme');
    }
    return response.json();
};

export const deleteTheme = async (id: string): Promise<void> => {
    const response = await fetch(
        `/api/themes/${id}?jellyfin_url=` + encodeURIComponent(getServerUrl() || ''),
        {
            method: 'DELETE',
            headers: {
                Authorization: getAuthorizationHeader(),
            },
        }
    );
    if (!response.ok) {
        throw new Error(`Failed to delete theme with id: ${id}`);
    }
};

export const updateTheme = async (id: string, theme: Theme): Promise<void> => {
    const response = await fetch(
        `/api/themes/${id}?jellyfin_url=` + encodeURIComponent(getServerUrl() || ''),
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthorizationHeader(),
            },
            body: JSON.stringify(theme),
        }
    );
    if (!response.ok) {
        throw new Error(`Failed to update theme with id: ${id}`);
    }
};

export const installThemeFromRepository = async (themeId: string): Promise<void> => {
    const response = await fetch(
        `/api/themes/${themeId}/install?jellyfin_url=` + encodeURIComponent(getServerUrl() || ''),
        {
            method: 'POST',
            headers: {
                Authorization: getAuthorizationHeader(),
            },
        }
    );
    if (!response.ok) {
        throw new Error(`Failed to install theme with id: ${themeId}`);
    }
};
