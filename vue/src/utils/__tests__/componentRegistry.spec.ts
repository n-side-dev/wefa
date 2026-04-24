import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import {
  componentRegistry,
  registerAsyncComponent,
  registerSyncComponent,
} from '../componentRegistry'

describe('utils/componentRegistry', () => {
  const snapshot = new Map(componentRegistry)

  afterEach(() => {
    componentRegistry.clear()
    for (const [name, comp] of snapshot) componentRegistry.set(name, comp)
  })

  it('pre-registers the expected PrimeVue component keys', () => {
    const expectedKeys = [
      'InputText',
      'InputNumber',
      'Select',
      'Calendar',
      'Checkbox',
      'Textarea',
      'Chip',
      'ProgressBar',
      'Rating',
      'Badge',
    ]
    for (const key of expectedKeys) {
      expect(componentRegistry.has(key)).toBe(true)
      expect(componentRegistry.get(key)).toBeTruthy()
    }
  })

  it('registers a synchronous component and overwrites existing entries', () => {
    const custom = defineComponent({ name: 'CustomMarker', template: '<div />' })
    registerSyncComponent('CustomMarker', custom)
    expect(componentRegistry.get('CustomMarker')).toBe(custom)

    const replacement = defineComponent({ name: 'CustomReplacement', template: '<span />' })
    registerSyncComponent('CustomMarker', replacement)
    expect(componentRegistry.get('CustomMarker')).toBe(replacement)
  })

  it('registers an async component under the requested key', () => {
    registerAsyncComponent('DynamicOne', 'primevue/inputtext')
    const entry = componentRegistry.get('DynamicOne')
    expect(entry).toBeTruthy()
    expect(typeof entry).toBe('object')
  })
})
