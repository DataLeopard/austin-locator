import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/austin-locator/',
  server: { port: 5174 },
  optimizeDeps: {
    exclude: ['sql.js'],
  },
});
