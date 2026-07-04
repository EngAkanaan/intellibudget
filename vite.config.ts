import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks for better code splitting
              'react-vendor': ['react', 'react-dom'],
              'chart-vendor': ['recharts'],
              'icon-vendor': ['lucide-react'],
            },
          },
        },
        chunkSizeWarningLimit: 1000,
      },
    };
});
