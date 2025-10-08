# N-SIDE WeFa- Development Instructions

## Project Overview
**This is a PrimeVue-based component library superset** (`@nside/wefa`) built with Vue 3 and TypeScript. The library extends and enhances PrimeVue components with additional functionality, custom styling using Tailwind CSS, and domain-specific features for energy management applications.

### Core Architecture
- **Base Framework**: PrimeVue 4.3.6 as the foundational UI component library
- **Enhancement Layer**: Custom components that wrap, extend, or compose PrimeVue components
- **Styling**: Tailwind CSS 4.1.11 with PrimeUI integration - **NO custom CSS files**
- **Component Pattern**: Each component is a superset that adds value to existing PrimeVue functionality

## Component Development Guidelines

### Required Deliverables for Each Component
Every component exposed by this library **MUST** include:

1. **Single File Component (SFC)**: The main `.vue` component file
2. **Storybook Stories**: `.stories.ts` file with interaction tests. Never includes the `autodocs` tag.
3. **Unit Tests**: `.spec.ts` file with comprehensive test coverage
4. **MDX Documentation**: `.mdx` file with complete documentation including use cases.

### Component Development Pattern
When creating new components, follow this established pattern:

#### 1. Use PrimeVue as Foundation
```typescript
// Import PrimeVue components when needed
import Breadcrumb from 'primevue/breadcrumb'
import type { MenuItem } from 'primevue/menuitem'

// Extend or compose PrimeVue functionality
export interface YourComponentProps {
  // Add your custom props that enhance PrimeVue behavior
}
```

#### 2. Style with Tailwind Only
- **DO**: Use Tailwind CSS classes for all styling
- **DO**: Leverage `tailwindcss-primeui` for PrimeVue component styling
- **DON'T**: Create custom CSS files or `<style>` blocks
- **DON'T**: Use inline styles

#### 3. Component Structure Example
Reference the `AutoroutedBreadcrumb` component as the gold standard:
```
src/components/YourComponent/
├── YourComponent.vue          # Main SFC component
├── YourComponent.stories.ts   # Storybook stories with interactions
├── YourComponent.spec.ts      # Unit tests
└── YourComponent.mdx          # Complete documentation
```

### Development Workflow
1. **Plan**: Identify which PrimeVue component(s) to extend or compose
2. **Implement**: Create the SFC using PrimeVue + Tailwind styling
3. **Document**: Write comprehensive MDX documentation with use cases, as well as stories for Storybook
4. **Test**: Create unit tests and Storybook stories with interactions
5. **Validate**: Ensure all four deliverables are complete and working

## Build/Configuration Instructions

### Prerequisites
- Node.js (version compatible with ES2022)
- npm for package management

### Development Setup
```bash
npm install
npm run dev  # Starts development server on http://localhost:5173
```

### Build Process
```bash
npm run build  # Runs type-checking and Vite build in parallel
```
- **Type Checking**: `vue-tsc --build` validates TypeScript across the project
- **Build Output**: Creates demo application in `dist/` directory
- **Bundle Analysis**: Main bundle ~237KB (63KB gzipped)

### Key Configuration Files
- **vite.config.ts**: Standard Vue 3 setup with Tailwind CSS integration
- **tsconfig.json**: Uses project references for modular TypeScript configuration
  - `tsconfig.app.json`: Main application config (ES2022 target, DOM libraries)
  - `tsconfig.node.json`: Node.js tooling configuration
  - `tsconfig.vitest.json`: Test-specific TypeScript settings

## Testing Information

### Test Architecture
The project uses a multi-layered testing approach with three distinct test projects:

#### 1. Component Tests
- **Location**: `src/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- **Framework**: Vitest + Vue Test Utils
- **Environment**: jsdom

**Example Component Test** (PrimeVue-based component):
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AutoroutedBreadcrumb from '../AutoroutedBreadcrumb/AutoroutedBreadcrumb.vue'

describe('AutoroutedBreadcrumb', () => {
  it('renders PrimeVue breadcrumb with route-based items', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/dashboard/settings', component: {} }]
    })
    
    const wrapper = mount(AutoroutedBreadcrumb, {
      global: { plugins: [router] }
    })
    
    // Test that PrimeVue Breadcrumb component is rendered
    expect(wrapper.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true)
  })
})
```

#### 2. Network Layer Tests
- **Location**: `src/network/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- **Framework**: Vitest with axios-mock-adapter
- **Coverage**: 18 comprehensive API client tests

#### 3. Storybook Visual Tests
- **Framework**: Storybook + Vitest browser mode
- **Browsers**: Chromium, WebKit (Firefox commented out)
- **Integration**: Tests run against actual Storybook stories
- **Setup**: `.storybook/vitest.setup.ts`

#### 4. End-to-End Tests
- **Location**: `e2e/`
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Configuration**: Auto-starts dev server before tests

**Example E2E Test**:
```typescript
import { test, expect } from '@playwright/test';

test('visits the app root url', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('You did it!');
})
```

### Running Tests
```bash
# Unit and component tests
npm run test:unit        # Run once
npm run test:unit:watch  # Watch mode

# End-to-end tests
npm run test:e2e

# All tests run automatically include:
# - Component tests (jsdom environment)
# - Network layer tests
# - Storybook visual tests (browser mode)
```

### Test Coverage
- **Provider**: Istanbul
- **Reporters**: text, cobertura, lcov
- **Output**: `./coverage` directory

### Adding New Tests
1. **Component Tests**: Create `*.spec.ts` files in `src/components/__tests__/` (centralized location for all component tests)
2. **Network Tests**: Create `*.test.ts` files in `src/network/__tests__/`
3. **E2E Tests**: Create `*.spec.ts` files in `e2e/`
4. **Storybook Tests**: Tests automatically generated from `*.stories.ts` files

## Additional Development Information

### Technology Stack
- **Framework**: Vue 3.5.18 with Composition API
- **Build Tool**: Vite 7.0.5
- **Language**: TypeScript 5.8.3
- **UI Framework**: PrimeVue 4.3.6 with PrimeIcons
- **Styling**: Tailwind CSS 4.1.11 with PrimeUI integration
- **State Management**: Pinia 3.0.3
- **HTTP Client**: Axios 1.11.0
- **Router**: Vue Router 4.5.1

### Code Quality & Standards

#### ESLint Configuration
Comprehensive linting setup with multiple plugins:
- **Vue**: `eslint-plugin-vue` with flat/recommended config
- **TypeScript**: Vue TypeScript recommended rules
- **Security**: `eslint-plugin-security` for vulnerability detection
- **Code Quality**: `eslint-plugin-sonarjs` for code smells
- **Documentation**: `eslint-plugin-jsdoc` for JSDoc validation
- **Testing**: Specific rules for Vitest and Playwright
- **Storybook**: `eslint-plugin-storybook` integration
- **Spelling**: `@cspell/eslint-plugin` for spell checking

**Custom Rules**:
```json
{
  "vue/block-order": ["error", {
    "order": ["template", "script", "style"]
  }]
}
```

#### Code Formatting
- **Tool**: Prettier 3.6.2
- **Integration**: ESLint skip-formatting config prevents conflicts
- **Commands**: 
  - `npm run format` - Format code
  - `npm run format-check` - Check formatting

### Development Workflow

#### Storybook Integration
```bash
npm run storybook        # Start Storybook dev server (port 6006)
npm run build-storybook  # Build static Storybook
```

#### Linting & Type Checking
```bash
npm run lint           # Fix linting issues
npm run lint-check     # Check without fixing
npm run type-check     # TypeScript validation
```

### Project Structure
```
src/
├── components/         # Reusable Vue components
│   └── */              # Component directories with stories and tests
├── network/            # API client and network utilities
│   ├── __tests__/      # Network layer tests
│   ├── apiClient.ts    # Main HTTP client
│   └── index.ts        # Network exports
├── stores/             # Pinia stores
├── stories/            # Storybook stories
├── App.vue             # Main application component
└── main.ts             # Application entry point
```

### Special Configurations

#### Path Aliases
- `@/*` maps to `./src/*` (configured in both Vite and TypeScript)

#### Bundle Size Monitoring
- **Tool**: bundlesize package
- **Limit**: 300 kB for `./dist/**/*.js`

#### CI/CD Considerations
- Playwright runs in headless mode on CI
- Different server ports for dev (5173) vs preview (4173)
- Test retries enabled on CI (2 retries)
- Parallel test execution disabled on CI

### Development Tips
1. **Component Development**: Use Storybook for isolated component development
2. **Testing Strategy**: Write component tests first, then add Storybook stories for visual testing
3. **Network Layer**: Mock API responses using axios-mock-adapter in tests
4. **Type Safety**: Leverage TypeScript strict mode and Vue 3's improved TypeScript support
5. **Performance**: Monitor bundle size with the configured bundlesize limits

### Debugging
- **Vue DevTools**: Enabled in development via `vite-plugin-vue-devtools`
- **Test Debugging**: Use `npm run test:unit:watch` for interactive test development
- **E2E Debugging**: Playwright traces available on test failures
- **Storybook**: Visual debugging of components in isolation