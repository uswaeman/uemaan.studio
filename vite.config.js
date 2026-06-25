import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: 'src/main.tsx',
            output: {
                entryFileNames: 'assets/app.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'assets/app.css';
                    }
                    return 'assets/[name][extname]';
                },
            },
        },
    },
});
