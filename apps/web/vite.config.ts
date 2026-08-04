import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the public entry namespace explicit. Cloudflare Pages can retain
        // an older canonical asset when two deployments reuse the default
        // `index-[hash].js` path even though the deployment preview is fresh.
        entryFileNames: 'assets/dyor-[hash].js',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
