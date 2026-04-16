/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { defineComponent } from 'vue'
import CommandPaletteComponent from './CommandPaletteComponent.vue'
import { createLibI18n } from '@/locales'

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
    router = createTestRouter()
    await router.push('/home')
    await router.isReady()
  })

  function mountComponent() {
    return mount(CommandPaletteComponent, {
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
})
