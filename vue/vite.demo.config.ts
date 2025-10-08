import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

/**
 * Because this project is a lib, dist is populated with lib files, to be imported by other projects
 * This is defined in vite.config.ts
 * However for local development and for e2e tests, we need to have a local app where our components can run
 * npm run preview is used for that, but it needs built app files ! Not lib built files
 * So we have this separate config that is called by npm run build:demo instead
 */

export default defineConfig({
  plugins: [
    vue({ script: { defineModel: true } }), 
    tailwindcss()
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist-demo', // Output demo app to dist-demo/
  },
});