import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'components/*.html',
          dest: 'components'
        },
        {
          src: 'sw.js',
          dest: '.'
        },
        {
          src: 'assets/*',
          dest: 'assets'
        }
      ]
    })
  ],
  root: 'public',
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
