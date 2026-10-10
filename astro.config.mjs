// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.collante.org',
  // Allow the code-server proxy host (e.g. dev.collante.org) so Vite's
  // Host check doesn't block requests arriving through the tunnel.
  server: {
    allowedHosts: true
  },
  integrations: [mdx(), sitemap()]
});