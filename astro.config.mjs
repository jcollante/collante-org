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
  markdown: {
    // Light theme to match the site's light-only palette (Shiki defaults to github-dark).
    shikiConfig: { theme: 'github-light' }
  },
  integrations: [mdx(), sitemap()]
});