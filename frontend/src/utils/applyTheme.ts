import type { Theme } from '@pelagica/core';

function applyLightColors(colors: Record<string, string>) {
    let styleEl = document.getElementById('dynamic-light-theme') as HTMLStyleElement | null;

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-light-theme';
        document.head.appendChild(styleEl);
    }

    const lightVars = Object.entries(colors)
        .map(([key, value]) => `--${key}: ${value};`)
        .join('');

    styleEl.innerHTML = `
      :root {
        ${lightVars}
      }
    `;
}

function applyDarkColors(colors: Record<string, string>) {
    let styleEl = document.getElementById('dynamic-dark-theme') as HTMLStyleElement | null;

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-dark-theme';
        document.head.appendChild(styleEl);
    }

    const darkVars = Object.entries(colors)
        .map(([key, value]) => `--${key}: ${value};`)
        .join('');

    styleEl.innerHTML = `
      .dark {
        ${darkVars}
      }
    `;
}

export function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme.radius) {
        root.style.setProperty('--radius', theme.radius);
    }

    if (theme.modes.includes('light') && theme.colors.light) {
        applyLightColors(theme.colors.light);
    }

    if (theme.modes.includes('dark') && theme.colors.dark) {
        applyDarkColors(theme.colors.dark);
    }
}
