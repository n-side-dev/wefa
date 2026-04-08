import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'

const require = createRequire(import.meta.url)

const bffOpenApiSource = resolve(__dirname, '../bff/bff_app/openapi/openapi.yaml')
const bffOpenApiDistDir = resolve(__dirname, 'dist/bff')
const bffOpenApiDistFile = resolve(bffOpenApiDistDir, 'openapi.yaml')

function resolveOptionalTidewavePlugin(): PluginOption[] {
  try {
    const tidewave = require('tidewave/vite-plugin').default as () => PluginOption
    return [tidewave()]
  } catch {
    return []
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'copy-bff-openapi',
      writeBundle() {
        if (!existsSync(bffOpenApiSource)) {
          throw new Error(`Missing BFF OpenAPI file at ${bffOpenApiSource}`)
        }

        mkdirSync(bffOpenApiDistDir, { recursive: true })
        copyFileSync(bffOpenApiSource, bffOpenApiDistFile)
      },
    },
    ...resolveOptionalTidewavePlugin(),
    vue({ script: { defineModel: true } }),
    // vueDevTools(),
    tailwindcss(),
    dts({
      include: ['src'],
      tsconfigPath: './tsconfig.app.json',
      rollupTypes: true,
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
        lib: resolve(__dirname, 'src/lib.ts'),
        router: resolve(__dirname, 'src/router/index.ts'),
        containers: resolve(__dirname, 'src/containers/index.ts'),
        network: resolve(__dirname, 'src/network/index.ts'),
      },
      name: 'wefa',
      // the name of the output files when the build is run
      //fileName: "wefa",
      formats: ['es', 'cjs'], // ONLY ESM and CommonJS
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        'vue',
        'vue-router',
        'pinia',
        'primevue',
        'i18n',
        '@primeuix/styled',
        '@primeuix/themes',
        'plotly.js-dist-min',
      ],
      output: {
        // Silence build warnings
        exports: 'named',
      },
    },
  },
})
