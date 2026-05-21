import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useBackendStore, type AuthenticationType } from '@/stores'
import Can from './Can.vue'

const seedPermissions = (perms: readonly string[]) => {
  const store = useBackendStore({ authenticationType: 'TOKEN' as AuthenticationType })
  store.setPermissions(perms)
  return store
}

describe('components/Can', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the default slot when permission is granted', () => {
    seedPermissions(['order.delete'])
    const wrapper = mount(Can, {
      props: { permission: 'order.delete' },
      slots: { default: '<button>Delete</button>' },
    })
    expect(wrapper.html()).toContain('<button>Delete</button>')
  })

  it('renders nothing when permission is missing and no fallback slot is supplied', () => {
    seedPermissions([])
    const wrapper = mount(Can, {
      props: { permission: 'order.delete' },
      slots: { default: '<button>Delete</button>' },
    })
    expect(wrapper.html()).not.toContain('<button>Delete</button>')
    expect(wrapper.text()).toBe('')
  })

  it('renders the fallback slot when permission is missing', () => {
    seedPermissions([])
    const wrapper = mount(Can, {
      props: { permission: 'order.delete' },
      slots: {
        default: '<button>Delete</button>',
        fallback: '<span class="denied">Not allowed</span>',
      },
    })
    expect(wrapper.html()).not.toContain('<button>Delete</button>')
    expect(wrapper.html()).toContain('Not allowed')
  })

  it('exposes the `allowed` flag via the default scoped slot', () => {
    seedPermissions(['feature.beta'])
    const Probe = defineComponent({
      components: { Can },
      template: `
        <Can :permission="'feature.beta'" v-slot="{ allowed }">
          <span data-test="probe">{{ allowed }}</span>
        </Can>
      `,
    })
    const wrapper = mount(Probe)
    expect(wrapper.get('[data-test="probe"]').text()).toBe('true')
  })

  it("supports 'any' mode with an array of permissions", () => {
    seedPermissions(['a'])
    const wrapper = mount(Can, {
      props: { permission: ['a', 'b'], mode: 'any' },
      slots: { default: () => h('span', 'visible') },
    })
    expect(wrapper.text()).toContain('visible')
  })

  it("denies in 'all' mode (default) when any required permission is missing", () => {
    seedPermissions(['a'])
    const wrapper = mount(Can, {
      props: { permission: ['a', 'b'] },
      slots: { default: '<span class="ok">ok</span>' },
    })
    expect(wrapper.html()).not.toContain('class="ok"')
  })
})
