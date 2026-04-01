// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

const isBuild = process.env.npm_lifecycle_event === 'build';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  // Cloudflare adapter só no build — no dev usa o runtime nativo do Astro
  ...(isBuild ? {
    adapter: cloudflare({
      imageService: 'compile',
    })
  } : {}),
});
