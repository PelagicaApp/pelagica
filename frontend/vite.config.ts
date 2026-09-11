import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const basePath = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

// https://vite.dev/config/
export default defineConfig({
    base: `${basePath}/`,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    server: {
        port: 3000,
        allowedHosts: ['mbjan.local'],
        proxy: {
            [`${basePath}/api`]: {
                target: 'http://localhost:4321/api',
                changeOrigin: true,
                rewrite: (path) => path.replace(new RegExp(`^${basePath}/api`), ''), // remove /api prefix when forwarding to backend
            },
        },
    },
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [{ name: 'videojs', test: /\/video\.js\// }],
                },
            },
        },
    },
});
