import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { dirname, resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import tidewave from 'tidewave/vite-plugin'

const bffOpenApiSource = resolve(__dirname, '../bff/bff_app/openapi/openapi.yaml')
const bffOpenApiDistDir = resolve(__dirname, 'dist/bff')
const bffOpenApiDistFile = resolve(bffOpenApiDistDir, 'openapi.yaml')
const distDir = resolve(__dirname, 'dist')
const distSrcDir = resolve(distDir, 'src')

const libraryEntryPoints = {
  lib: resolve(__dirname, 'src/lib.ts'),
  router: resolve(__dirname, 'src/router/index.ts'),
  containers: resolve(__dirname, 'src/containers/index.ts'),
  network: resolve(__dirname, 'src/network/index.ts'),
}

const declarationEntryPoints = {
  lib: [
    "export * from './src/lib';",
    "export { default } from './src/lib';",
  ].join('\n'),
  router: "export * from './src/router/index';",
  containers: "export * from './src/containers/index';",
  network: [
    "export { default as axiosInstance } from './src/network/axios';",
    "export { default as apiClient } from './src/network/apiClient';",
    "export { default as typedApiClient } from './src/network/typedApiClient';",
  ].join('\n'),
}

function writeDeclarationEntryPoints() {
  return {
    name: 'write-declaration-entry-points',
    closeBundle() {
      mkdirSync(distDir, { recursive: true })

      for (const [entryName, declarationContent] of Object.entries(declarationEntryPoints)) {
        writeFileSync(resolve(distDir, `${entryName}.d.ts`), `${declarationContent}\n`)
      }
    },
  }
}

function rewriteDeclarationImportPath(filePath: string, importPath: string) {
  if (!filePath.startsWith(distSrcDir) || !importPath.startsWith('../')) {
    return importPath
  }

  const sourceDir = dirname(filePath)
  const resolvedCurrentTarget = resolve(sourceDir, importPath)
  if (resolvedCurrentTarget.startsWith(distSrcDir)) {
    return importPath
  }

  const correctedImportPath = importPath.replace(/^((?:\.\.\/)+)(?!src\/)/, '$1src/')
  if (correctedImportPath === importPath) {
    return importPath
  }

  const resolvedCorrectedTarget = resolve(sourceDir, correctedImportPath)
  return resolvedCorrectedTarget.startsWith(distSrcDir) ? correctedImportPath : importPath
}

function rewriteDeclarationContent(filePath: string, content: string) {
  return content.replace(/(from\s+['"])([^'"]+)(['"])/g, (_match, prefix, importPath, suffix) => {
    const rewrittenImportPath = rewriteDeclarationImportPath(filePath, importPath)
    return `${prefix}${rewrittenImportPath}${suffix}`
  })
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
    tidewave(),
    vue({script: {defineModel: true}}),
    tailwindcss(),
    dts({
      include: ['src'],
      exclude: [
        'src/**/*.mdx',
        'src/**/*.stories.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/demo/**',
      ],
      tsconfigPath: './tsconfig.app.json',
      rollupTypes: false,
      beforeWriteFile: (filePath, content) => ({
        content: rewriteDeclarationContent(filePath, content),
      }),
    }),
    writeDeclarationEntryPoints(),
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
      entry: libraryEntryPoints,
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
