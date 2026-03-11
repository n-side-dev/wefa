import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import BottomComponent from './BottomComponent.vue'

const UserMenuTriggerStub = defineComponent({
  name: 'UserMenuTriggerComponent',
  props: {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      default: 'detailed',
    },
  },
  template: '<div data-test="user-menu">{{ username }}|{{ email }}|{{ mode }}</div>',
})

describe('BottomComponent', () => {
  it('renders UserMenuTriggerComponent with expected static props', () => {
    const wrapper = mount(BottomComponent, {
      global: {
        stubs: {
          UserMenuTriggerComponent: UserMenuTriggerStub,
        },
      },
    })

    expect(wrapper.get('[data-test="user-menu"]').text()).toContain('John Doe')
    expect(wrapper.get('[data-test="user-menu"]').text()).toContain('jdo@example.com')
    expect(wrapper.get('[data-test="user-menu"]').text()).toContain('detailed')
  })
})
