import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopComponent from './TopComponent.vue'

describe('TopComponent', () => {
  it('renders the project title', () => {
    const wrapper = mount(TopComponent, {
      props: {
        projectTitle: 'WeFa',
      },
    })

    expect(wrapper.text()).toContain('WeFa')
  })

  it('builds a single-letter avatar label for one-word titles', () => {
    const wrapper = mount(TopComponent, {
      props: {
        projectTitle: 'wefa',
      },
    })

    expect(wrapper.get('.inline-flex').text()).toBe('W')
  })

  it('builds first/last initials for multi-word titles', () => {
    const wrapper = mount(TopComponent, {
      props: {
        projectTitle: 'North Side',
      },
    })

    expect(wrapper.get('.inline-flex').text()).toBe('NS')
  })

  it('falls back to ? when title is blank', () => {
    const wrapper = mount(TopComponent, {
      props: {
        projectTitle: '   ',
      },
    })

    expect(wrapper.get('.inline-flex').text()).toBe('?')
  })
})
