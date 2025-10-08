import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlotlyFromTableComponent from './PlotlyFromTableComponent.vue'
import type { PlotlyFromTableComponentProps } from './PlotlyFromTableComponent.vue'

// Mock Plotly.js
vi.mock('plotly.js-dist-min', () => ({
  default: {
    newPlot: vi.fn(),
    react: vi.fn(),
  },
}))

// Sample test data - tabular format
const sampleTableData = [
  { month: 'Jan', consumption: 120, temperature: 5 },
  { month: 'Feb', consumption: 110, temperature: 8 },
  { month: 'Mar', consumption: 95, temperature: 12 },
  { month: 'Apr', consumption: 80, temperature: 18 },
]

const basicConfig = {
  x: 'month',
  y: 'consumption',
  layout: {
    title: 'Test Chart',
    xaxis: { title: 'Month' },
    yaxis: { title: 'Consumption (kWh)' },
  },
}

describe('PlotlyFromTableComponent', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('renders correctly with required props', () => {
    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    expect(wrapper.exists()).toBe(true)
    // The component should render the underlying PlotlyComponent
    expect(wrapper.findComponent({ name: 'PlotlyComponent' }).exists()).toBe(true)
  })

  it('transforms tabular data correctly', () => {
    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    // Access the computed plotlyData
    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData).toHaveLength(1)
    expect(plotlyData[0]).toEqual({
      x: ['Jan', 'Feb', 'Mar', 'Apr'],
      y: [120, 110, 95, 80],
    })
  })

  it('handles empty data gracefully', () => {
    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: [],
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData).toHaveLength(1)
    expect(plotlyData[0]).toEqual({
      x: [],
      y: [],
    })
  })

  it('applies trace configuration correctly', () => {
    const configWithTrace = {
      x: 'month',
      y: 'consumption',
      traceConfig: {
        type: 'bar',
        name: 'Monthly Consumption',
        marker: { color: 'blue' },
      },
    }

    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: configWithTrace,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData[0]).toEqual({
      x: ['Jan', 'Feb', 'Mar', 'Apr'],
      y: [120, 110, 95, 80],
      type: 'bar',
      name: 'Monthly Consumption',
      marker: { color: 'blue' },
    })
  })

  it('passes layout configuration to PlotlyComponent', () => {
    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const layout = plotlyComponent.props('layout')

    expect(layout).toEqual({
      title: 'Test Chart',
      xaxis: { title: 'Month' },
      yaxis: { title: 'Consumption (kWh)' },
    })
  })

  it('passes config configuration to PlotlyComponent', () => {
    const configWithPlotlyConfig = {
      x: 'month',
      y: 'consumption',
      config: {
        displayModeBar: false,
        responsive: true,
      },
    }

    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: configWithPlotlyConfig,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const config = plotlyComponent.props('config')

    expect(config).toEqual({
      displayModeBar: false,
      responsive: true,
    })
  })

  it('handles missing columns gracefully', () => {
    const configWithMissingColumn = {
      x: 'nonexistent',
      y: 'consumption',
    }

    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: configWithMissingColumn,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData[0]).toEqual({
      x: [undefined, undefined, undefined, undefined],
      y: [120, 110, 95, 80],
    })
  })

  it('updates when table data changes', async () => {
    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    // Initial data check
    let plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    let plotlyData = plotlyComponent.props('data')
    expect(plotlyData[0].x).toHaveLength(4)

    // Update with new data
    const newData = [
      { month: 'May', consumption: 70, temperature: 22 },
      { month: 'Jun', consumption: 85, temperature: 28 },
    ]

    await wrapper.setProps({ value: newData })

    plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    plotlyData = plotlyComponent.props('data')

    expect(plotlyData[0]).toEqual({
      x: ['May', 'Jun'],
      y: [70, 85],
    })
  })

  it('updates when config changes', async () => {
    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: sampleTableData,
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    // Change to different columns
    const newConfig = {
      x: 'temperature',
      y: 'consumption',
    }

    await wrapper.setProps({ config: newConfig })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData[0]).toEqual({
      x: [5, 8, 12, 18],
      y: [120, 110, 95, 80],
    })
  })

  it('handles single data point', () => {
    const singleDataPoint = [{ month: 'Jan', consumption: 120 }]

    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: singleDataPoint,
        config: basicConfig,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData[0]).toEqual({
      x: ['Jan'],
      y: [120],
    })
  })

  it('handles numeric data correctly', () => {
    const numericData = [
      { x_val: 1, y_val: 10 },
      { x_val: 2, y_val: 20 },
      { x_val: 3, y_val: 30 },
    ]

    const numericConfig = {
      x: 'x_val',
      y: 'y_val',
    }

    const wrapper = mount(PlotlyFromTableComponent, {
      props: {
        value: numericData,
        config: numericConfig,
      } as PlotlyFromTableComponentProps,
    })

    const plotlyComponent = wrapper.findComponent({ name: 'PlotlyComponent' })
    const plotlyData = plotlyComponent.props('data')

    expect(plotlyData[0]).toEqual({
      x: [1, 2, 3],
      y: [10, 20, 30],
    })
  })
})
