import { defineAsyncComponent } from 'vue'

import type { Component } from 'vue'

export type ResolvableComponent = string | Component | ReturnType<typeof defineAsyncComponent>

export const componentRegistry = new Map<string, ResolvableComponent>()

// Pre-register common PrimeVue components as lazy imports (add more based on your needs; these are examples for editors/bodies)
// Import paths are lowercase as per PrimeVue convention (e.g., 'InputText' maps to 'primevue/inputtext')
componentRegistry.set(
  'InputText',
  defineAsyncComponent(() => import('primevue/inputtext'))
)
componentRegistry.set(
  'InputNumber',
  defineAsyncComponent(() => import('primevue/inputnumber'))
)
componentRegistry.set(
  'Select',
  defineAsyncComponent(() => import('primevue/select'))
)
componentRegistry.set(
  'Calendar',
  defineAsyncComponent(() => import('primevue/calendar'))
)
componentRegistry.set(
  'Checkbox',
  defineAsyncComponent(() => import('primevue/checkbox'))
)
componentRegistry.set(
  'Textarea',
  defineAsyncComponent(() => import('primevue/textarea'))
)
componentRegistry.set(
  'Chip',
  defineAsyncComponent(() => import('primevue/chip'))
)
componentRegistry.set(
  'ProgressBar',
  defineAsyncComponent(() => import('primevue/progressbar'))
)
componentRegistry.set(
  'Rating',
  defineAsyncComponent(() => import('primevue/rating'))
)
componentRegistry.set(
  'Badge',
  defineAsyncComponent(() => import('primevue/badge'))
)
// Add others like MultiSelect, Slider, ColorPicker, etc., from PrimeVue docs: https://primevue.org/

// Pre-register WeFa's own components (example; adjust paths to your lib's components)
// componentRegistry.set('CustomEditor', defineAsyncComponent(() => import('../components/CustomEditor.vue'))) // Lazy
// Or synchronous: import CustomBody from '../components/CustomBody.vue'; componentRegistry.set('CustomBody', CustomBody) // No wrap needed for sync

/**
 * Registers a component asynchronously by providing the import path.
 * @param name - The registry key (component name)
 * @param importPath - The module path to import (e.g., 'primevue/inputtext')
 */
export function registerAsyncComponent(name: string, importPath: string) {
  componentRegistry.set(
    name,
    defineAsyncComponent(() => import(/* @vite-ignore */ importPath))
  )
}

/**
 * Registers a component synchronously by providing the component itself.
 * @param name - The registry key (component name)
 * @param component - The component to register (e.g., a Vue component object)
 */
export function registerSyncComponent(name: string, component: ResolvableComponent) {
  componentRegistry.set(name, component)
}
