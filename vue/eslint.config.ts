// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginSecurity from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import jsdoc from 'eslint-plugin-jsdoc'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import cspellPlugin from '@cspell/eslint-plugin'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  pluginSecurity.configs.recommended,
  sonarjs.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  storybook.configs['flat/recommended'],
  {
    plugins: { '@cspell': cspellPlugin },
    ignores: ['src/**/__tests__/**/*', 'src/**/*.stories.ts', 'src/**/*.spec.ts', 'src/**/*.vue'],
    rules: {
      '@cspell/spellchecker': ['warn', { configFile: './cspell.config.yaml' }],
      'sonarjs/todo-tag': 'warn'
    }
  },
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
  {
    rules: {
      "vue/block-order": ["error", {
        "order": [ "template", "script", "style" ] // Enforce this precise order in component definition!
      }]
    }
  }
)
