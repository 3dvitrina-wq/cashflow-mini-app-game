import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Telegram WebViews can retain a previously deployed body even when
        // Pages serves max-age=0 and the generated content hash is reused. A
        // release namespace forces both executable code and CSS onto a new URL.
        entryFileNames: 'assets/dyor-focus-[hash].js',
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css')
          ? 'assets/dyor-focus-[name]-[hash][extname]'
          : 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
