import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    cacheDir: './node_modules/.vite',
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/tests/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/tests/',
                '**/*.test.js',
                '**/*.config.js',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
