import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults, coverageConfigDefaults } from 'vitest/config'
import viteConfig from './vite.config'
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'dist-demo/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      // Global timeout settings to prevent pipeline timeouts
      testTimeout: 30000, // 30 seconds for individual tests
      hookTimeout: 10000, // 10 seconds for setup/teardown hooks
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'cobertura', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          ...coverageConfigDefaults.exclude,
          'dist-demo/**',
          'src/demo.ts',
          'src/demo/**'
        ]
      },
      projects: [
        // Default project for component tests
        {
          extends: true,
          test: {
            name: 'components',
            environment: 'jsdom',
            include: ['src/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            // Component tests may involve complex async operations and DOM manipulation
            testTimeout: 45000, // 45 seconds for component tests
            hookTimeout: 15000, // 15 seconds for component setup/teardown
            setupFiles: ['vitetestPlugins.setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'network',
            environment: 'jsdom',
            include: ['src/network/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            // Network tests may involve API calls and async operations
            testTimeout: 30000, // 30 seconds for network tests
            hookTimeout: 10000, // 10 seconds for network setup/teardown
            setupFiles: ['vitetestPlugins.setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'stores',
            environment: 'jsdom',
            include: ['src/stores/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            // Store tests may involve state management and async operations
            testTimeout: 30000, // 30 seconds for store tests
            hookTimeout: 10000, // 10 seconds for store setup/teardown
            setupFiles: ['vitetestPlugins.setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'plugins',
            environment: 'jsdom',
            include: ['src/plugins/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            // Plugin tests may involve Vue app initialization and routing
            testTimeout: 30000, // 30 seconds for plugin tests
            hookTimeout: 10000, // 10 seconds for plugin setup/teardown
            setupFiles: ['vitetestPlugins.setup.ts'],
          },
        },
        // Storybook tests project
        {
          extends: true,
          plugins: [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
            }),
          ],
          test: {
            name: 'storybook',
            // Browser tests are significantly slower and more resource-intensive
            testTimeout: 120000, // 2 minutes for storybook browser tests
            hookTimeout: 30000, // 30 seconds for browser setup/teardown
            browser: {
              enabled: true,
              headless: true,
              provider: 'playwright',
              instances: [
                {
                  browser: 'chromium',
                },
                // SOFA-271-restore-network-helpers-and-associated-tests
                {
                  browser: 'firefox',
                },
                {
                  browser: 'webkit',
                },
              ],
            },
            setupFiles: ['.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  }),
)
