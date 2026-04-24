import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import NotFoundView from '../NotFoundView.vue'

describe('NotFoundView.vue', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: {} }],
    })
  })

  it('renders the NotFound component', () => {
    const wrapper = mount(NotFoundView, {
      global: { plugins: [router] },
    })
    expect(wrapper.findComponent({ name: 'NotFound' }).exists()).toBe(true)
    // NotFound renders the default 404 message via its props, so we should see it here.
    expect(wrapper.text()).toContain('404')
  })
})
