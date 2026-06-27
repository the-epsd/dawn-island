import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ptcgServerRoot = path.resolve(__dirname, '../ptcg-server');

// https://vite.dev/config/
export default defineConfig({
  // ptcg-server (and some transitive code) references Node's `global`; browsers only have globalThis.
  define: {
    global: 'globalThis',
  },
  plugins: [react()],
  server: {
    proxy: {
      '/v1': { target: 'http://localhost:8080', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
    },
    watch: {
      // ptcg-server compile writes thousands of files under dist/ — ignore to avoid HMR storms.
      ignored: [
        `${ptcgServerRoot}/dist/**`,
        `${ptcgServerRoot}/output/**`,
      ],
    },
  },
  optimizeDeps: {
    include: ['ptcg-server'],
  },
});
