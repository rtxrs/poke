import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
export default defineConfig({
    plugins: [vue()],
    root: 'public', // Keep public as the root for now to minimize disruption
    build: {
        outDir: '../dist/client',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'public/index.html'),
                login: path.resolve(__dirname, 'public/login.html'),
                register: path.resolve(__dirname, 'public/register.html'),
                private: path.resolve(__dirname, 'public/private.html'),
            }
        }
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
            '/auth': 'http://localhost:3000',
            '/data': 'http://localhost:3000'
        }
    }
});
