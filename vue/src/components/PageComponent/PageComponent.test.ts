import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import PageComponent from './PageComponent.vue'

// Mock i18n composable
vi.mock('@/locales', () => ({
  useI18nLib: () => ({
    t: (key: string) => `translated:${key}`,
  }),
}))

// Mock AutoroutedBreadcrumb to avoid rendering complexity
vi.mock('@/components/AutoroutedBreadcrumb/AutoroutedBreadcrumb.vue', () => ({
  default: {
    name: 'AutoroutedBreadcrumb',
    template: '<div class="mock-breadcrumb" />',
  },
}))

describe('PageComponent', () => {
  it('renders card with slot content', () => {
    const wrapper = mount(PageComponent, {
      slots: {
        default: '<p class="slot-content">Hello Slot</p>',
      },
    })
    expect(wrapper.findComponent({ name: 'Card' }).exists()).toBe(true)
    expect(wrapper.find('.slot-content').text()).toBe('Hello Slot')
  })

  it('renders title when prop is passed', () => {
    const wrapper = mount(PageComponent, {
      props: { title: 'page.title' },
    })
    expect(wrapper.find('span').text()).toBe('translated:page.title')
  })

  it('renders subtitle when prop is passed', () => {
    const wrapper = mount(PageComponent, {
      props: { subtitle: 'page.subtitle' },
    })
    const spans = wrapper.findAll('span')
    expect(spans).toHaveLength(1)
    expect(spans[0]?.text()).toBe('translated:page.subtitle')
  })

  it('renders breadcrumb when showBreadcrumb is true', () => {
    const wrapper = mount(PageComponent, {
      props: { showBreadcrumb: true },
    })
    expect(wrapper.find('.mock-breadcrumb').exists()).toBe(true)
  })

  it('renders both breadcrumb and title when both are passed', () => {
    const wrapper = mount(PageComponent, {
      props: { showBreadcrumb: true, title: 'page.title' },
    })
    expect(wrapper.find('.mock-breadcrumb').exists()).toBe(true)
    expect(wrapper.find('span').text()).toBe('translated:page.title')
  })
})
