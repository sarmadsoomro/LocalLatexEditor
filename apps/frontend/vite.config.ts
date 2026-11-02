import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// The app version, shown in Settings → About. All workspace packages share it.
const appVersion: string = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;

const sessionTokenFile = path.join(os.homedir(), '.latex-editor', '.session-token');

function sessionTokenPlugin(): Plugin {
  return {
    name: 'texcraft-session-token',
    // dev server only: a build must keep the placeholder so the backend injects the live token
    apply: 'serve',
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
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
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
        // keep Monaco in its own cached chunk
        manualChunks(id) {
          if (id.includes('/node_modules/monaco-editor/')) return 'monaco';
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/edcore.main', 'monaco-editor/esm/vs/editor/editor.api'],
  },
});
