import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        background: resolve(__dirname, 'src/background/background.js'),
        content: resolve(__dirname, 'src/content/content.js'),
        contentStyle: resolve(__dirname, 'src/content/content.css'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return '[name].js';
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'contentStyle.css' || assetInfo.names?.includes('content.css') || assetInfo.originalFileName?.includes('content.css')) return 'content.css';
          return 'assets/[name].[ext]';
        }
      }
    }
  }
});
