import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, '../packages/tv-frontend/src'),
        },
        dedupe: [
            'i18next',
            'react-i18next',
            'react',
            'react-dom',
            '@tanstack/react-query',
            '@noriginmedia/norigin-spatial-navigation',
        ],
    },
    build: {
        outDir: 'www',
        // Vite's default target needs Chrome 111+; Tizen 6.5 ships Chromium 85
        target: 'chrome85',
        cssTarget: 'chrome85',
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [{ name: 'videojs', test: /\/video\.js\// }],
                },
            },
        },
    },
});
