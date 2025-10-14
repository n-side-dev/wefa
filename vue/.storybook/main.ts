import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: [
    '../src/README.mdx',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  // Ensure Storybook build does not run vite-plugin-dts (type declarations are not needed for Storybook)
  viteFinal: async (config) => {
    if (Array.isArray((config as any).plugins)) {
      (config as any).plugins = (config as any).plugins.filter(
        (p: any) => !(p && typeof p.name === 'string' && p.name.includes('vite:dts'))
      );
    }
    return config;
  }
};
export default config;
