import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { resolve } from "path"
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import tidewave from 'tidewave/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tidewave(),
    vue({script: {defineModel: true}}),
    // vueDevTools(),
    tailwindcss(),
    dts({
      include: ['src'],
      tsconfigPath: './tsconfig.app.json',
      rollupTypes: true
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      // src/lib.ts is where we have exported the component(s)
      entry: {
        lib: resolve(__dirname, "src/lib.ts"),
        router: resolve(__dirname, "src/router/index.ts"),
        containers: resolve(__dirname, "src/containers/index.ts"),
        network: resolve(__dirname, "src/network/index.ts")
      },
      name: "wefa",
      // the name of the output files when the build is run
      //fileName: "wefa",
      formats: ['es', 'cjs'], // ONLY ESM and CommonJS
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        "vue",
        "vue-router",
        "pinia",
        "primevue",
        "i18n",
        "@primeuix/styled",
        "@primeuix/themes",
        "plotly.js-dist-min"
      ],
      output: {
        // Silence build warnings
        exports: 'named'
      },
    }
  }
})
