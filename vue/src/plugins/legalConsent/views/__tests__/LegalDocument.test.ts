import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// SUT
import LegalDocument from '../LegalDocument.vue'

// Mocks for dependencies used by LegalDocument.vue
vi.mock('@/plugins/legalConsent', () => ({
  useLegalStore: () => ({
    legalEndpoint: 'api/legal',
  }),
}))

// We'll spy on applyMarkdownClasses to ensure it is called with the container element
const applyMarkdownClassesSpy = vi.fn()
vi.mock('@/utils/markdown.ts', () => ({
  applyMarkdownClasses: (el: HTMLElement) => applyMarkdownClassesSpy(el),
}))

// Mock marked.parse to return predictable HTML
vi.mock('marked', () => ({
  marked: {
    parse: (md: string) => `<h1>Parsed</h1><p>${md}</p>`,
  },
}))

// Helper to control apiClient.query reactive data
const dataRef = ref<string | undefined>(undefined)
const loadingRef = ref<boolean>(true)
vi.mock('@/network', () => ({
  apiClient: {
    query: () => ({
      data: dataRef,
      isLoading: loadingRef,
    }),
  },
}))

describe('LegalDocument.vue', () => {
  beforeEach(() => {
    // reset refs and spies before each test
    dataRef.value = undefined
    loadingRef.value = true
    applyMarkdownClassesSpy.mockClear()
  })

  it('shows Skeleton while loading and renders parsed markdown when data is available', async () => {
    const wrapper = mount(LegalDocument, {
      props: { documentEndpoint: 'terms-of-use' },
    })

    // Initially loading
    expect(wrapper.findComponent({ name: 'Skeleton' }).exists()).toBe(true)

    // Provide data and stop loading
    dataRef.value = '# Title from markdown'
    loadingRef.value = false

    await nextTick()
    await nextTick() // flush watchers

    // Skeleton should disappear
    expect(wrapper.findComponent({ name: 'Skeleton' }).exists()).toBe(false)

    // Container should have our parsed HTML
    const container = wrapper.get('#legal-document')
    expect(container.element.innerHTML).toContain('<h1>Parsed</h1>')
    expect(container.element.innerHTML).toContain('<p># Title from markdown</p>')

    // And classes should be applied to the generated elements
    expect(applyMarkdownClassesSpy).toHaveBeenCalledTimes(1)
    expect(applyMarkdownClassesSpy).toHaveBeenCalledExactlyOnceWith(
      container.element as HTMLElement
    )
  })

  it('does nothing when there is no data', async () => {
    mount(LegalDocument, {
      props: { documentEndpoint: 'privacy-notice' },
    })

    await nextTick()

    // No data provided, so our class applier should not be called
    expect(applyMarkdownClassesSpy).not.toHaveBeenCalled()
  })
})
