import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';


export default defineConfig({
  server: {
    port: 5174,
  },
  plugins: [cloudflare({
    configPath: fileURLToPath(new URL('./wrangler.json', import.meta.url)),
    experimental: {
      headersAndRedirectsDevModeSupport: true,
    },
  })],
});
