import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const sessionTokenFile = path.join(os.homedir(), '.latex-editor', '.session-token');

function sessionTokenPlugin(): Plugin {
  return {
    name: 'texcraft-session-token',
    async transformIndexHtml(html) {
      const token = await waitForSessionToken(sessionTokenFile);
      if (!token) return html;
      return html.replaceAll('__TEXCRAFT_SESSION_TOKEN__', token);
    },
  };
}

function waitForSessionToken(file: string): Promise<string> {
  const started = Date.now();
  return new Promise((resolve) => {
    const read = () => {
      try {
        return fs.readFileSync(file, 'utf8').trim();
      } catch {
        return '';
      }
    };
    const existing = read();
    if (existing) {
      resolve(existing);
      return;
    }
    const timer = setInterval(() => {
      const token = read();
      if (token || Date.now() - started > 5000) {
        clearInterval(timer);
        resolve(token);
      }
    }, 50);
  });
}

export default defineConfig({
  plugins: [react(), sessionTokenPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // changeOrigin rewrites Host to 127.0.0.1:3001, which the backend allow-list accepts
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
});
