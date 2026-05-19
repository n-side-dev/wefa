import { afterEach, describe, it, expect, beforeEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import SideNavigationComponent from './SideNavigationComponent.vue'
import { useSideNavStore } from '@/stores'

const TopComponentStub = defineComponent({
  name: 'TopComponent',
  props: {
    projectTitle: {
      type: String,
      required: true,
    },
    projectLogo: {
      type: String,
      default: undefined,
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  template: '<div data-test="top" :data-collapsed="collapsed">{{ projectTitle }}|{{ projectLogo }}</div>',
})

const MainComponentStub = defineComponent({
  name: 'MainComponent',
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  template: '<div data-test="main" :data-collapsed="collapsed">Main Navigation</div>',
})

const BottomComponentStub = defineComponent({
  name: 'BottomComponent',
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  template: '<div data-test="bottom" :data-collapsed="collapsed">Default Footer</div>',
})

const globalConfig = {
  stubs: {
    TopComponent: TopComponentStub,
    MainComponent: MainComponentStub,
    BottomComponent: BottomComponentStub,
  },
}

describe('SideNavigationComponent', () => {
  enableAutoUnmount(afterEach)

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders top, main, and default bottom sections', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'WeFa',
      },
      global: globalConfig,
    })

    expect(wrapper.find('[data-test="top"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="main"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(true)
  })

  it('passes project title to TopComponent', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'Energy Forecast',
      },
      global: globalConfig,
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe('Energy Forecast|')
  })

  it('passes custom logo to TopComponent', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'Energy Forecast',
        projectLogo: 'https://example.test/logo.svg',
      },
      global: globalConfig,
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe(
      'Energy Forecast|https://example.test/logo.svg'
    )
  })

  it('renders custom bottom slot content instead of the default footer', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'Energy Forecast',
      },
      slots: {
        bottom: '<div data-test="custom-bottom">Custom Footer</div>',
      },
      global: globalConfig,
    })

    expect(wrapper.find('[data-test="custom-bottom"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(false)
  })

  it('defaults to expanded (19rem) and aria-pressed=false on the toggle', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      global: globalConfig,
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('lg:w-[19rem]')
    expect(aside.classes()).not.toContain('lg:w-[4.5rem]')

    const toggle = wrapper.find('button[data-test="side-nav-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Collapse navigation')
  })

  it('applies collapsed width and aria-pressed=true when store is collapsed', async () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      global: globalConfig,
    })

    const store = useSideNavStore()
    store.toggle()
    await nextTick()

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('lg:w-[4.5rem]')
    expect(aside.classes()).not.toContain('lg:w-[19rem]')

    const toggle = wrapper.find('button[data-test="side-nav-toggle"]')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(toggle.attributes('aria-label')).toBe('Expand navigation')
  })

  it('forwards collapsed state to child components', async () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      global: globalConfig,
    })

    expect(wrapper.get('[data-test="top"]').attributes('data-collapsed')).toBe('false')
    expect(wrapper.get('[data-test="main"]').attributes('data-collapsed')).toBe('false')
    expect(wrapper.get('[data-test="bottom"]').attributes('data-collapsed')).toBe('false')

    useSideNavStore().setCollapsed(true)
    await nextTick()

    expect(wrapper.get('[data-test="top"]').attributes('data-collapsed')).toBe('true')
    expect(wrapper.get('[data-test="main"]').attributes('data-collapsed')).toBe('true')
    expect(wrapper.get('[data-test="bottom"]').attributes('data-collapsed')).toBe('true')
  })

  it('toggles when the edge button is clicked', async () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      global: globalConfig,
    })

    const store = useSideNavStore()
    expect(store.collapsed).toBe(false)

    await wrapper.find('button[data-test="side-nav-toggle"]').trigger('click')

    expect(store.collapsed).toBe(true)
  })

  it('toggles on Cmd/Ctrl+B from the window scope', async () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      attachTo: document.body,
      global: globalConfig,
    })

    const store = useSideNavStore()
    expect(store.collapsed).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true }))
    await nextTick()
    expect(store.collapsed).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }))
    await nextTick()
    expect(store.collapsed).toBe(false)

    wrapper.unmount()
  })

  it.each([
    ['input', () => document.createElement('input')],
    ['textarea', () => document.createElement('textarea')],
    ['select', () => document.createElement('select')],
    [
      'contenteditable',
      () => {
        const div = document.createElement('div')
        div.setAttribute('contenteditable', 'true')
        return div
      },
    ],
  ] as const)('ignores Cmd+B when focus is inside %s', async (_label, makeEl) => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      attachTo: document.body,
      global: globalConfig,
    })

    const store = useSideNavStore()
    expect(store.collapsed).toBe(false)

    const el = makeEl()
    document.body.appendChild(el)
    el.focus()

    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true })
    )
    await nextTick()
    expect(store.collapsed).toBe(false)

    document.body.removeChild(el)
    wrapper.unmount()
  })

  it('removes the global keydown listener on unmount', async () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'WeFa' },
      attachTo: document.body,
      global: globalConfig,
    })

    const store = useSideNavStore()
    wrapper.unmount()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true }))
    await nextTick()
    expect(store.collapsed).toBe(false)
  })
})
