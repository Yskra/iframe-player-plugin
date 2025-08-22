import process from 'node:process';
import { fileURLToPath } from 'node:url';


import { defineConfig } from 'vite';

const isDev = process.env.NODE_ENV === 'development';


export default defineConfig({
  build: {
    emptyOutDir: false,
    watch: isDev ? ({}) : null,
    lib: {
      entry: fileURLToPath(new URL('./src/main.js', import.meta.url)),
      name: `injected`,
      fileName: 'injected',
      formats: ['iife'],
    },
  },
});
