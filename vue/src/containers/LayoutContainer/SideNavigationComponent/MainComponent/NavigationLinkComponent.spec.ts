import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import NavigationLinkComponent from './NavigationLinkComponent.vue'

function createRouterLinkStub(isActive: boolean, isExactActive: boolean) {
  return defineComponent({
    name: 'RouterLink',
    props: {
      to: {
        type: [String, Object],
        required: true,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'a',
          {
            'data-test': 'router-link',
            href: typeof props.to === 'string' ? props.to : '#',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.({
            isActive,
            isExactActive,
          })
        )
    },
  })
}

describe('NavigationLinkComponent', () => {
  it('renders label and icon', () => {
    const wrapper = mount(NavigationLinkComponent, {
      props: {
        route: '/products',
        icon: 'pi pi-box',
        label: 'Products',
      },
      global: {
        stubs: {
          RouterLink: createRouterLinkStub(false, false),
        },
      },
    })

    expect(wrapper.text()).toContain('Products')
    expect(wrapper.find('i.pi-box').exists()).toBe(true)
  })

  it('shows active indicator for active links', () => {
    const wrapper = mount(NavigationLinkComponent, {
      props: {
        route: '/products',
        icon: 'pi pi-box',
        label: 'Products',
      },
      global: {
        stubs: {
          RouterLink: createRouterLinkStub(true, false),
        },
      },
    })

    expect(
      wrapper
        .find(
          'span.bg-\\[var\\(--brand-teal\\)\\].shadow-\\[0_0_18px_rgba\\(5\\,181\\,200\\,0\\.55\\)\\]'
        )
        .exists()
    ).toBe(true)
  })

  it('does not show active indicator for inactive links', () => {
    const wrapper = mount(NavigationLinkComponent, {
      props: {
        route: '/products',
        icon: 'pi pi-box',
        label: 'Products',
      },
      global: {
        stubs: {
          RouterLink: createRouterLinkStub(false, false),
        },
      },
    })

    expect(
      wrapper
        .find(
          'span.bg-\\[var\\(--brand-teal\\)\\].shadow-\\[0_0_18px_rgba\\(5\\,181\\,200\\,0\\.55\\)\\]'
        )
        .exists()
    ).toBe(false)
  })

  it('emits navigation-item-click when clicked', async () => {
    const wrapper = mount(NavigationLinkComponent, {
      props: {
        route: '/products',
        icon: 'pi pi-box',
        label: 'Products',
      },
      global: {
        stubs: {
          RouterLink: createRouterLinkStub(false, false),
        },
      },
    })

    await wrapper.get('[data-test="router-link"]').trigger('click')

    expect((wrapper.emitted('navigation-item-click') ?? []).length).toBeGreaterThan(0)
  })
})
