/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { defineComponent } from 'vue'
import CommandPaletteComponent from './CommandPaletteComponent.vue'
import { createLibI18n } from '@/locales'
import type { CommandPaletteAssistantConfig } from './CommandPaletteComponent.types'

const StubView = defineComponent({
  template: '<div />',
})

const PrimeDialogStub = defineComponent({
  name: 'PrimeDialogStub',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible'],
  template: `
    <section v-if="visible" data-test="dialog">
      <header><slot name="header" /></header>
      <div><slot /></div>
    </section>
  `,
})

const PrimeInputTextStub = defineComponent({
  name: 'PrimeInputTextStub',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'keydown'],
  template: `
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target && $event.target.value) || '')"
      @keydown="$emit('keydown', $event)"
    />
  `,
})

const PrimeListboxStub = defineComponent({
  name: 'PrimeListboxStub',
  inheritAttrs: false,
  props: {
    options: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: String,
      default: null,
    },
    optionLabel: {
      type: String,
      default: 'label',
    },
    optionValue: {
      type: String,
      default: 'value',
    },
  },
  emits: ['update:modelValue'],
  template: `
    <ul v-bind="$attrs">
      <li
        v-for="option in options"
        :key="option[optionValue]"
        :data-selected="String(option[optionValue] === modelValue)"
      >
        <button type="button" @click="$emit('update:modelValue', option[optionValue])">
          <slot name="option" :option="option">
            {{ option[optionLabel] }}
          </slot>
        </button>
      </li>
    </ul>
  `,
})

function createTestRouter() {
  const routes: RouteRecordRaw[] = [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: StubView,
      meta: {
        wefa: {
          title: 'Home',
          showInCommandPalette: true,
          assistant: {
            docId: 'home.page',
          },
        },
      },
    },
    {
      path: '/showcase',
      name: 'showcase',
      component: StubView,
      meta: {
        wefa: {
          title: 'Showcase',
          showInCommandPalette: true,
          assistant: {
            docId: 'showcase.page',
          },
        },
      },
    },
    {
      path: '/playground',
      name: 'playground',
      component: StubView,
      meta: {
        wefa: {
          title: 'Playground',
          showInCommandPalette: true,
          section: 'Examples',
        },
      },
    },
    {
      path: '/products/:id/edit',
      name: 'productEdit',
      component: StubView,
      meta: {
        wefa: {
          title: 'Edit Product',
          assistant: {
            docId: 'catalog.product.edit',
          },
        },
      },
    },
    {
      path: '/users/:id',
      name: 'userDetails',
      component: StubView,
      meta: {
        wefa: {
          title: 'User Details',
          showInCommandPalette: true,
        },
      },
    },
    {
      path: '/hidden',
      name: 'hidden',
      component: StubView,
      meta: {
        wefa: {
          title: 'Hidden',
        },
      },
    },
  ]

  return createRouter({
    history: createMemoryHistory(),
    routes,
  })
}

describe('CommandPaletteComponent', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    sessionStorage.clear()
    router = createTestRouter()
    await router.push('/home')
    await router.isReady()
  })

  function mountComponent(assistant?: CommandPaletteAssistantConfig) {
    return mount(CommandPaletteComponent, {
      props: {
        assistant,
      },
      global: {
        plugins: [router, createLibI18n({})],
        stubs: {
          Dialog: PrimeDialogStub,
          InputText: PrimeInputTextStub,
          Listbox: PrimeListboxStub,
        },
      },
    })
  }

  it('opens with Cmd+K and Ctrl+K', async () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-test="command-palette-search"]').exists()).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-search"]').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-search"]').exists()).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-search"]').exists()).toBe(true)
  })

  it('filters actions by search query', async () => {
    const wrapper = mountComponent()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    await wrapper.get('[data-test="command-palette-search"]').setValue('play')

    expect(wrapper.text()).toContain('Playground')
    expect(wrapper.text()).not.toContain('Home')
  })

  it('navigates with arrow keys and executes selected action with Enter', async () => {
    const wrapper = mountComponent()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    const searchInput = wrapper.get('[data-test="command-palette-search"]')
    await searchInput.trigger('keydown', { key: 'ArrowDown' })
    await searchInput.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/showcase')
    expect(wrapper.find('[data-test="command-palette-search"]').exists()).toBe(false)
  })

  it('closes on Escape', async () => {
    const wrapper = mountComponent()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    await wrapper.get('[data-test="command-palette-search"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-search"]').exists()).toBe(false)
  })

  it('only shows routes marked for command palette and skips dynamic routes', async () => {
    const wrapper = mountComponent()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Showcase')
    expect(wrapper.text()).toContain('Playground')
    expect(wrapper.text()).not.toContain('Hidden')
    expect(wrapper.text()).not.toContain('User Details')
  })

  it('shows mode switch and ask input when assistant is enabled', async () => {
    const generateRecipe = vi.fn().mockResolvedValue({
      status: 'unsupported',
      message: 'Not supported',
    })
    const wrapper = mountComponent({
      enabled: true,
      generateRecipe,
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-mode-navigate"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="command-palette-mode-ask"]').exists()).toBe(true)

    await wrapper.get('[data-test="command-palette-mode-ask"]').trigger('click')

    expect(wrapper.find('[data-test="command-palette-ask-input"]').exists()).toBe(true)
  })

  it('handles clarification flow and renders generated recipe', async () => {
    const generateRecipe = vi
      .fn()
      .mockResolvedValueOnce({
        status: 'needs_clarification',
        conversationToken: 'token-1',
        questions: ['Which product category should be used?'],
      })
      .mockResolvedValueOnce({
        status: 'recipe',
        conversationToken: 'token-2',
        summary: 'Create the product and open its edit view.',
        steps: [
          {
            id: 'step-1',
            title: 'Open product edit',
            target: {
              docId: 'catalog.product.edit',
              params: {
                id: '42',
              },
            },
          },
        ],
      })

    const wrapper = mountComponent({
      enabled: true,
      generateRecipe,
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()
    await wrapper.get('[data-test="command-palette-mode-ask"]').trigger('click')

    await wrapper.get('[data-test="command-palette-ask-input"]').setValue('Create a product')
    await wrapper
      .get('[data-test="command-palette-ask-input"]')
      .trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-clarification"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Which product category should be used?')

    await wrapper.get('[data-test="command-palette-ask-input"]').setValue('Outdoor')
    await wrapper.get('[data-test="command-palette-ask-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-recipe"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create the product and open its edit view.')

    expect(generateRecipe).toHaveBeenCalledTimes(2)
    expect(generateRecipe).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        prompt: 'Create a product',
        conversationToken: 'token-1',
        answers: ['Outdoor'],
      })
    )
  })

  it('navigates using recipe step target docId', async () => {
    const generateRecipe = vi.fn().mockResolvedValue({
      status: 'recipe',
      conversationToken: 'token-1',
      summary: 'Go to showcase.',
      steps: [
        {
          id: 'step-1',
          title: 'Open showcase',
          target: {
            docId: 'showcase.page',
          },
        },
      ],
    })

    const wrapper = mountComponent({
      enabled: true,
      generateRecipe,
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()
    await wrapper.get('[data-test="command-palette-mode-ask"]').trigger('click')

    await wrapper.get('[data-test="command-palette-ask-input"]').setValue('Show me showcase')
    await wrapper.get('[data-test="command-palette-ask-submit"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-test="command-palette-recipe-step-action"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/showcase')
    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(false)
  })

  it('restores last recipe from session storage when reopened', async () => {
    const generateRecipe = vi.fn().mockResolvedValue({
      status: 'recipe',
      conversationToken: 'token-1',
      summary: 'Persisted recipe summary',
      steps: [
        {
          id: 'step-1',
          title: 'Open home',
          target: {
            docId: 'home.page',
          },
        },
      ],
    })

    const wrapper = mountComponent({
      enabled: true,
      generateRecipe,
      resumeOnOpen: true,
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()
    await wrapper.get('[data-test="command-palette-mode-ask"]').trigger('click')
    await wrapper.get('[data-test="command-palette-ask-input"]').setValue('Persist this')
    await wrapper.get('[data-test="command-palette-ask-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Persisted recipe summary')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()
    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    expect(wrapper.find('[data-test="command-palette-recipe"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Persisted recipe summary')
  })
})
