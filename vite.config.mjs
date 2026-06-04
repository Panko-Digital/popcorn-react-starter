import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // When VITE_CDN_BASE is set at build time, all asset URLs inside the bundle
    // become absolute CDN paths, allowing the bundle to be hosted at a GCS path
    // and loaded from any origin via the thin shell HTML the publishing service
    // generates.
    base: process.env.VITE_CDN_BASE ?? '/',
    build: {
        rollupOptions: {
            output: {
                // Stable (non-hashed) entry filename so the shell HTML can
                // reference a predictable URL without reading a build manifest.
                entryFileNames: 'assets/index.js',
            },
        },
    },
});
