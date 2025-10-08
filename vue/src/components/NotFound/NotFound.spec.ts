import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '../NotFound/NotFound.vue'

describe('NotFound', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: {} },
        { path: '/dashboard', component: {} },
      ],
    })
  })

  describe('Component Rendering', () => {
    it('renders PrimeVue Card component', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
      })
      expect(wrapper.findComponent({ name: 'Card' }).exists()).toBe(true)
    })
    it('renders error code and title', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
        props: { code: '404', title: 'Page Not Found' },
      })
      expect(wrapper.text()).toContain('404')
      expect(wrapper.text()).toContain('Page Not Found')
    })
    it('renders message when provided', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
        props: { msg: 'Custom message' },
      })
      expect(wrapper.text()).toContain('Custom message')
    })
    it('renders slot content', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
        slots: { default: '<div class="slot-content">Slot Content</div>' },
      })
      expect(wrapper.html()).toContain('Slot Content')
    })
  })

  describe('Button Props', () => {
    it('renders custom home button label and icon', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
        props: { buttonLabel: 'Return', buttonIcon: 'pi pi-arrow-left' },
      })
      const homeButton = wrapper.findAllComponents({ name: 'Button' })[0]
      expect(homeButton?.props('label')).toBe('Return')
      expect(homeButton?.props('icon')).toBe('pi pi-arrow-left')
    })
    it('renders custom go back button label', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
        props: { goBackLabel: 'Previous Page' },
      })
      const goBackButton = wrapper.findAllComponents({ name: 'Button' })[1]
      expect(goBackButton?.props('label')).toBe('Previous Page')
    })
  })

  describe('Navigation', () => {
    it('navigates to buttonRoute when home button is clicked', async () => {
      router.push = vi.fn()
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
        props: { buttonRoute: '/dashboard' },
      })
      const homeButton = wrapper.findAllComponents({ name: 'Button' })[0]
      await homeButton?.trigger('click')
      expect(router.push).toHaveBeenCalledWith('/dashboard')
    })
    it('calls router.back when go back button is clicked', async () => {
      router.back = vi.fn()
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
      })
      const goBackButton = wrapper.findAllComponents({ name: 'Button' })[1]
      await goBackButton?.trigger('click')
      expect(router.back).toHaveBeenCalled()
    })
  })

  describe('Props Validation', () => {
    it('handles missing optional props gracefully', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
      })
      expect(wrapper.findComponent({ name: 'Card' }).exists()).toBe(true)
    })
    it('applies default values for props', () => {
      const wrapper = mount(NotFound, {
        global: { plugins: [router] },
      })
      expect(wrapper.text()).toContain('404')
      expect(wrapper.text()).toContain('Page Not Found')
      expect(wrapper.text()).toContain('Go Home')
      expect(wrapper.text()).toContain('Go Back')
    })
  })
})
