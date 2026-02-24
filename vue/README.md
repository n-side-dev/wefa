# N-SIDE WeFa Frontend Library

N-SIDE WeFa (Web Factory) is a Vue 3 toolkit that accelerates building cohesive product interfaces. It combines a component library, opinionated data layer helpers, internationalisation utilities, and CLI scripts so product teams can ship consistent experiences quickly.

<!-- TOC depthFrom:1 depthTo:3 withLinks:1 orderedList:0 -->
- [About](#about)
- [Feature Highlights](#feature-highlights)
- [Installation](#installation)
  - [Install from npm](#install-from-npm)
  - [Install from a local build](#install-from-a-local-build)
  - [Post-install tooling](#post-install-tooling)
- [Using the library](#using-the-library)
  - [Icons and the registry helper](#icons-and-the-registry-helper)
- [Development workflow](#development-workflow)
  - [Core scripts](#core-scripts)
- [Testing and quality gates](#testing-and-quality-gates)
- [Storybook and documentation](#storybook-and-documentation)
- [Contributing](#contributing)
- [Release process](#release-process)
- [License](#license)
- [Project status](#project-status)
<!-- /TOC -->

## About

The library is built on top of the following ecosystem:

- [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/guide/) for fast DX
- [PrimeVue](https://primevue.org/) and [Tailwind](https://tailwindcss.com/) for UI foundations
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue I18n](https://vue-i18n.intlify.dev/) for localisation
- [Axios](https://axios-http.com/) and [Hey-API](https://heyapi.dev/) for HTTP and schema tooling

A demo playground lives alongside the library so you can experiment locally while developing components.

## Feature Highlights

- Rich component catalogue following the WeFa design language
- Reusable containers, router helpers, and data-client utilities for product scaffolding
- CLI (`wefa-install`) that bootstraps recommended project configuration
- Opinionated linting, formatting, and testing presets aligned with modern Vue best practices

## Installation

### Install from npm

```bash
npm install @nside/wefa
# or
pnpm add @nside/wefa
# or
yarn add @nside/wefa
```

Import the base styles once in your application (for example in `main.ts`):

```ts
import '@nside/wefa/style';
```

### Install from a local build

Use this flow when testing unreleased changes from a cloned repository:

```bash
cd vue
npm install
npm run build
npm pack
# This outputs something like wefa-1.0.0.tgz
```

Then, in your consuming project:

```bash
npm install --force /absolute/path/to/wefa-1.0.0.tgz
```

Repeat the build-and-pack step whenever you change the library.

### Post-install tooling

Run the bundled installer to copy optional helpers (AI prompts, configuration snippets, etc.) into your project:

```bash
npx wefa-install
```

## Using the library

Import components and types directly from the package:

```vue
<script setup lang="ts">
import { WefaButton } from '@nside/wefa';
</script>

<template>
  <WefaButton label="Launch" />
</template>
```

Types live under the `@nside/wefa/types` export:

```ts
import type { WefaButtonProps } from '@nside/wefa/types';
```

### Theme preset

To apply the NSIDE Prime theme preset in your app:

```ts
import PrimeVue from 'primevue/config'
import { NsideTheme } from '@nside/wefa'

app.use(PrimeVue, {
  theme: {
    preset: NsideTheme,
  },
})
```

### Icons and the registry helper

WeFa uses [Iconify](https://iconify.design/) under the hood. Bundled icon collections are registered automatically by calling `setupDefaultIcons()` inside `src/iconRegistry.ts`. If you need extra icons offline:

1. Install the relevant `@iconify-json/<collection>` package.
2. Register the collection at application bootstrap time.

```ts
import { registerCollections } from '@nside/wefa';
import mdi from '@iconify-json/mdi';

registerCollections(mdi);
```

If an icon is missing from the local registry Iconify transparently falls back to an online fetch.

## Development workflow

### Core scripts

From the `vue/` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the demo application with hot-module replacement |
| `npm run build` | Build the library bundle (includes type checking) |
| `npm run preview` | Serve the built demo application |
| `npm run storybook` | Launch Storybook for interactive documentation |
| `npm run build-storybook` | Build the static Storybook site |
| `npm run lint` / `npm run lint-check` | Auto-fix or check ESLint rules |
| `npm run format` / `npm run format-check` | Run Prettier in write/check mode |

The project targets Node.js 20+. Use the included `.nvmrc` (to be added) or your preferred version manager to align with CI.

## Testing and quality gates

- Unit tests: `npm run test:unit`
- Unit tests in watch mode: `npm run test:unit:watch`
- End-to-end tests (Playwright against the demo app): `npm run test:e2e`

Aim for meaningful coverage when adding or changing components. Update or create MDX docs and Storybook stories alongside code changes.

## Storybook and documentation

Storybook acts as both documentation and manual testing ground. Start it locally with `npm run storybook`. When contributing new components:

- create `ComponentName.stories.ts` showcasing variants
- add MDX docs if consumers need contextual guidance (`src/components/ComponentName/ComponentName.mdx`)
- keep props tables and accessibility notes up to date

The file `src/README.mdx` pulls in this README so Storybook stays in sync.

## Contributing

We welcome pull requests! Start with [`CONTRIBUTE`](CONTRIBUTE.md) for the full workflow, environment setup, and quality gates. In short:

1. Align on the problem via an issue or discussion before large changes.
2. Keep linting, formatting, tests, and Storybook docs up to date.
3. Document UI changes with screenshots or recordings when helpful.
4. Run the commands listed in the contribution guide before pushing.

## Release process

Versioning currently follows SemVer. To test a release locally:

```bash
npm version <major|minor|patch>
npm publish --access public
```
