import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useComponentResolver } from '../useComponentResolver'
import { componentRegistry } from '@/utils/componentRegistry'

describe('composables/useComponentResolver', () => {
  const snapshot = new Map(componentRegistry)

  afterEach(() => {
    componentRegistry.clear()
    for (const [name, comp] of snapshot) componentRegistry.set(name, comp)
    vi.restoreAllMocks()
  })

  it('returns the registered component when the key exists', () => {
    const custom = defineComponent({ name: 'CustomBody', template: '<div />' })
    componentRegistry.set('CustomBody', custom)

    const { resolve } = useComponentResolver()
    expect(resolve('CustomBody')).toBe(custom)
  })

  it('returns the default `span` fallback and warns when the key is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { resolve } = useComponentResolver()
    expect(resolve('DoesNotExist')).toBe('span')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Component "DoesNotExist" not registered')
    )
  })

  it('uses the supplied custom fallback for unknown keys', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fallback = defineComponent({ name: 'FallbackMarker', template: '<p />' })

    const { resolve } = useComponentResolver(fallback)
    expect(resolve('unknown')).toBe(fallback)
  })
})
