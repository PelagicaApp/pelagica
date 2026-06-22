import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        allowedHosts: ['mbjan.local'],
        proxy: {
            '/api': {
                target: 'http://localhost:4321/api',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''), // remove /api prefix when forwarding to backend
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
