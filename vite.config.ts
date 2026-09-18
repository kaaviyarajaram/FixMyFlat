import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dbServerPlugin } from './vite-db-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dbServerPlugin()],
  server: {
    port: 5173,
    host: true
  }
});

