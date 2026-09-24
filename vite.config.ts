import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api/onemap/token': {
          target: 'https://www.onemap.gov.sg',
          changeOrigin: true,
          rewrite: () => '/api/auth/post/getToken',
          secure: false,
        },
        '/api/onemap/search': {
          target: 'https://www.onemap.gov.sg',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/onemap\/search/, '/api/common/elastic/search'),
          secure: false,
        },
        '/api/onemap/revgeocode': {
          target: 'https://www.onemap.gov.sg',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/onemap\/revgeocode/, '/api/public/revgeocode'),
          secure: false,
        },
        '/api/onemap/route': {
          target: 'https://www.onemap.gov.sg',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/onemap\/route/, '/api/public/routingsvc/route'),
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
