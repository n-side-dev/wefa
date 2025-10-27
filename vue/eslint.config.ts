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

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/openapi/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  pluginSecurity.configs.recommended,
  sonarjs.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  storybook.configs['flat/recommended'],
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/**/*', 'src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
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
      }],
      "vitest/prefer-called-exactly-once-with": "off", // Exactly once is not always possible
      'sonarjs/todo-tag': 'warn' // TODOs can refer to issues that are not yet fixed
    }
  },
  {
    // Disable JSDoc and other requirements in test files (unit and e2e) and stories.
    files: ['src/**/__tests__/**/*', 'src/**/*.{test,spec,stories}.{js,ts,jsx,tsx}', 'e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'security/detect-object-injection': 'off'
    }
  }
)
