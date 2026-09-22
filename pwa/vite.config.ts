import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Served from a subdirectory on GitHub Pages, so links are relative
  base: './',
  test: {
    include: ['test/**/*.test.ts'],
  },
});
