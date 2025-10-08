import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlotlyComponent from './PlotlyComponent.vue'
import type { Data } from 'plotly.js-dist-min'

// Mock Plotly.js
vi.mock('plotly.js-dist-min', () => ({
  default: {
    newPlot: vi.fn(),
    react: vi.fn(),
  },
}))

// Sample test data
const sampleData: Data[] = [
  {
    x: [1, 2, 3, 4],
    y: [10, 11, 12, 13],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Test Data',
  },
]

describe('PlotlyComponent', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('renders correctly with required props', () => {
    const wrapper = mount(PlotlyComponent, {
      props: {
        data: sampleData,
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.plotly-component').exists()).toBe(true)
    expect(wrapper.find('.plotly-container').exists()).toBe(true)
  })

  it('generates unique IDs for multiple component instances', () => {
    const wrapper1 = mount(PlotlyComponent, {
      props: {
        data: sampleData,
      },
    })

    const wrapper2 = mount(PlotlyComponent, {
      props: {
        data: sampleData,
      },
    })

    const container1 = wrapper1.find('.plotly-container')
    const container2 = wrapper2.find('.plotly-container')

    expect(container1.exists()).toBe(true)
    expect(container2.exists()).toBe(true)

    const id1 = container1.attributes('id')
    const id2 = container2.attributes('id')

    // Check that both IDs exist and follow the expected pattern
    expect(id1).toMatch(/^plotly-\d+$/)
    expect(id2).toMatch(/^plotly-\d+$/)

    // Check that the IDs are different
    expect(id1).not.toBe(id2)
  })
})
