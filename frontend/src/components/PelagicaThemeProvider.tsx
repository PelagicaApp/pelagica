import { fetchThemeById } from '@pelagica/core';
import { useConfig } from '@pelagica/core';
import { applyTheme } from '@/utils/applyTheme';
import {
    getLocalTheme,
    LOCAL_THEME_PELAGICA_DEFAULT,
    LOCAL_THEME_SERVER_DEFAULT,
} from '@/utils/localTheme';
import { useEffect } from 'react';

const PelagicaThemeLoader = () => {
    const { config } = useConfig();

    useEffect(() => {
        let mounted = true;

        async function loadTheme() {
            let effectiveThemeId: string | null | undefined =
                getLocalTheme() || config?.serverThemeId;

            if (effectiveThemeId === LOCAL_THEME_SERVER_DEFAULT)
                effectiveThemeId = config?.serverThemeId;
            if (effectiveThemeId === LOCAL_THEME_PELAGICA_DEFAULT) effectiveThemeId = null;

            if (!effectiveThemeId) return;

            const theme = await fetchThemeById(effectiveThemeId);
            if (!mounted || !theme) return;

            applyTheme(theme);
        }

        loadTheme();

        return () => {
            mounted = false;
        };
    }, [config?.serverThemeId]);

    return null;
};

export default PelagicaThemeLoader;
