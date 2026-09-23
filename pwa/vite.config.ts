import { readFileSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  // Served from a subdirectory on GitHub Pages, so links are relative
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
      manifest: {
        name: 'Cipher Breaker',
        short_name: 'Cipher Breaker',
        description: 'Helper tools for Puzzle Hunts',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fafafa',
        theme_color: '#3f51b5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The dictionaries are precached with the app, so that it works offline from the first load on
        globPatterns: ['**/*.{js,css,html,png,cbfcdict,cbfcmap}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        // Only the files Vite names by their content hash are immutable; the plugin's default
        // treats the whole assets/ folder that way, which would keep an updated dictionary
        // (same name, other content) from ever being downloaded again by an existing install
        dontCacheBustURLsMatching: /-[\w-]{8}\.(js|css)$/,
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.ts'],
  },
});
