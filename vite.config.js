import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: {
    // The portable release deliberately embeds the artwork and fonts in one bundle.
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: 2 * 1024 * 1024,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
