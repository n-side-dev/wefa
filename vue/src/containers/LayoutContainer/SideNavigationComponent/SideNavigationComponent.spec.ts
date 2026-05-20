import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import SideNavigationComponent from './SideNavigationComponent.vue'

const STORAGE_KEY = 'wefa-side-nav-collapsed'

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
  template:
    '<div data-test="top" :data-collapsed="collapsed">{{ projectTitle }}|{{ projectLogo }}</div>',
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

function mountSideNav(
  props: { projectTitle: string; projectLogo?: string } = { projectTitle: 'WeFa' }
) {
  return mount(SideNavigationComponent, {
    props,
    attachTo: document.body,
    global: globalConfig,
  })
}

function isCollapsed(wrapper: VueWrapper): boolean {
  return wrapper.find('button[data-test="side-nav-toggle"]').attributes('aria-pressed') === 'true'
}

describe('SideNavigationComponent', () => {
  enableAutoUnmount(afterEach)

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
  })

  it('renders top, main, and default bottom sections', () => {
    const wrapper = mountSideNav()

    expect(wrapper.find('[data-test="top"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="main"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(true)
  })

  it('passes project title to TopComponent', () => {
    const wrapper = mountSideNav({ projectTitle: 'Energy Forecast' })
    expect(wrapper.get('[data-test="top"]').text()).toBe('Energy Forecast|')
  })

  it('passes custom logo to TopComponent', () => {
    const wrapper = mountSideNav({
      projectTitle: 'Energy Forecast',
      projectLogo: 'https://example.test/logo.svg',
    })
    expect(wrapper.get('[data-test="top"]').text()).toBe(
      'Energy Forecast|https://example.test/logo.svg'
    )
  })

  it('renders custom bottom slot content instead of the default footer', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: { projectTitle: 'Energy Forecast' },
      slots: { bottom: '<div data-test="custom-bottom">Custom Footer</div>' },
      global: globalConfig,
    })

    expect(wrapper.find('[data-test="custom-bottom"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(false)
  })

  it('defaults to expanded (19rem) and aria-pressed=false on the toggle', () => {
    const wrapper = mountSideNav()

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('lg:w-[19rem]')
    expect(aside.classes()).not.toContain('lg:w-[4.5rem]')

    const toggle = wrapper.find('button[data-test="side-nav-toggle"]')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Collapse navigation')
  })

  it('restores the saved collapsed state from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const wrapper = mountSideNav()

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('lg:w-[4.5rem]')
    expect(isCollapsed(wrapper)).toBe(true)
  })

  it('toggles when the edge button is clicked and forwards collapsed to children', async () => {
    const wrapper = mountSideNav()

    expect(wrapper.get('[data-test="top"]').attributes('data-collapsed')).toBe('false')
    expect(wrapper.get('[data-test="main"]').attributes('data-collapsed')).toBe('false')
    expect(wrapper.get('[data-test="bottom"]').attributes('data-collapsed')).toBe('false')

    await wrapper.find('button[data-test="side-nav-toggle"]').trigger('click')

    expect(isCollapsed(wrapper)).toBe(true)
    expect(wrapper.get('[data-test="top"]').attributes('data-collapsed')).toBe('true')
    expect(wrapper.get('[data-test="main"]').attributes('data-collapsed')).toBe('true')
    expect(wrapper.get('[data-test="bottom"]').attributes('data-collapsed')).toBe('true')
  })

  it('persists changes to localStorage', async () => {
    const wrapper = mountSideNav()
    await wrapper.find('button[data-test="side-nav-toggle"]').trigger('click')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('toggles on Cmd/Ctrl+B from the window scope', async () => {
    const wrapper = mountSideNav()

    expect(isCollapsed(wrapper)).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true }))
    await nextTick()
    expect(isCollapsed(wrapper)).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }))
    await nextTick()
    expect(isCollapsed(wrapper)).toBe(false)
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
    const wrapper = mountSideNav()
    expect(isCollapsed(wrapper)).toBe(false)

    const el = makeEl()
    document.body.appendChild(el)
    el.focus()

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true }))
    await nextTick()
    expect(isCollapsed(wrapper)).toBe(false)

    document.body.removeChild(el)
  })

  it('removes the global keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountSideNav()
    wrapper.unmount()

    const keydownCalls = removeSpy.mock.calls.filter(([type]) => type === 'keydown')
    expect(keydownCalls.length).toBeGreaterThan(0)
    removeSpy.mockRestore()
  })
})
