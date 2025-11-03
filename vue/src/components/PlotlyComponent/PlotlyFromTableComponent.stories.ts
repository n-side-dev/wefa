import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, waitFor } from 'storybook/test'
import { useI18nLib } from '@/locales'

import PlotlyFromTableComponent from './PlotlyFromTableComponent.vue'

const meta: Meta<typeof PlotlyFromTableComponent> = {
  title: 'Components/PlotlyComponent/PlotlyFromTableComponent',
  component: PlotlyFromTableComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A wrapper component for PlotlyComponent that works with tabular data containing rows.',
      },
    },
  },
  argTypes: {
    value: {
      description: 'Array of objects representing table rows with data',
      control: { type: 'object' },
    },
    config: {
      description: 'Configuration object specifying x/y columns and chart settings',
      control: { type: 'object' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample tabular data for energy consumption
const energyConsumptionData = [
  { month: 'Jan', consumption: 120, temperature: 5 },
  { month: 'Feb', consumption: 110, temperature: 8 },
  { month: 'Mar', consumption: 95, temperature: 12 },
  { month: 'Apr', consumption: 80, temperature: 18 },
  { month: 'May', consumption: 70, temperature: 22 },
  { month: 'Jun', consumption: 85, temperature: 28 },
  { month: 'Jul', consumption: 95, temperature: 32 },
  { month: 'Aug', consumption: 90, temperature: 30 },
  { month: 'Sep', consumption: 75, temperature: 25 },
  { month: 'Oct', consumption: 85, temperature: 18 },
  { month: 'Nov', consumption: 100, temperature: 12 },
  { month: 'Dec', consumption: 115, temperature: 7 },
]

// Sample sales data
const salesData = [
  { product: 'Solar Panels', sales: 150, profit: 45000 },
  { product: 'Wind Turbines', sales: 80, profit: 120000 },
  { product: 'Batteries', sales: 200, profit: 30000 },
  { product: 'Inverters', sales: 120, profit: 18000 },
  { product: 'Smart Meters', sales: 300, profit: 15000 },
]

// Sample time series data
const timeSeriesData = [
  { timestamp: '2024-01-01T00:00:00Z', power: 1200, voltage: 230 },
  { timestamp: '2024-01-01T01:00:00Z', power: 1150, voltage: 228 },
  { timestamp: '2024-01-01T02:00:00Z', power: 1100, voltage: 225 },
  { timestamp: '2024-01-01T03:00:00Z', power: 1050, voltage: 227 },
  { timestamp: '2024-01-01T04:00:00Z', power: 1000, voltage: 230 },
  { timestamp: '2024-01-01T05:00:00Z', power: 1080, voltage: 232 },
]

const timeSeriesData2 = [
  { timestamp: '2024-01-01T00:00:00Z', forecast: 1200, actual: 1100 },
  { timestamp: '2024-01-01T01:00:00Z', forecast: 1120, actual: 1050 },
  { timestamp: '2024-01-01T02:00:00Z', forecast: 1100, actual: 1250 },
  { timestamp: '2024-01-01T03:00:00Z', forecast: 1050, actual: 1200 },
  { timestamp: '2024-01-01T04:00:00Z', forecast: 1100, actual: 1250 },
  { timestamp: '2024-01-01T05:00:00Z', forecast: 1080, actual: 1200 },
  { timestamp: '2024-01-01T06:00:00Z', forecast: 1000 },
  { timestamp: '2024-01-01T07:00:00Z', forecast: 1080 },
]

export const BasicLineChart: Story = {
  args: {
    value: energyConsumptionData,
    config: {
      data: [
        {
          xKey: 'month',
          yKey: 'consumption',
        },
      ],
      layout: {
        title: { text: 'plot.title.text', subtitle: { text: 'plot.title.subtitle' } },
        xaxis: { title: { text: 'plot.xaxis.title' } },
        yaxis: { title: { text: 'plot.yaxis.title' } },
      },
    },
  },
  render: (args) => ({
    components: { PlotlyFromTableComponent },
    setup() {
      const { mergeLocaleMessage } = useI18nLib()
      // Register French translations
      mergeLocaleMessage('en', {
        plot: {
          title: { text: 'Monthly Energy Consumption', subtitle: 'kWh' },
          xaxis: { title: 'Month' },
          yaxis: { title: 'Consumption (kWh)' },
        },
      })
      return { args }
    },
    template: '<PlotlyFromTableComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByText('Monthly Energy Consumption')).toBeInTheDocument()
    })
  },
}

export const ScatterPlot: Story = {
  args: {
    value: energyConsumptionData,
    config: {
      data: [
        {
          xKey: 'temperature',
          yKey: 'consumption',
          mode: 'markers',
          type: 'scatter',
          name: 'Temperature vs Consumption',
          marker: { size: 8, color: 'blue' },
        },
      ],
      layout: {
        title: { text: 'Energy Consumption vs Temperature' },
        xaxis: { title: { text: 'Temperature (°C)' } },
        yaxis: { title: { text: 'Consumption (kWh)' } },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByText('Energy Consumption vs Temperature')).toBeInTheDocument()
    })
  },
}

export const BarChart: Story = {
  args: {
    value: salesData,
    config: {
      data: [
        {
          xKey: 'product',
          yKey: 'sales',
          type: 'bar',
          name: 'Product Sales',
          marker: { color: 'green' },
        },
      ],
      layout: {
        title: { text: 'Product Sales by Category' },
        xaxis: { title: { text: 'Product' } },
        yaxis: { title: { text: 'Units Sold' } },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByText('Product Sales by Category')).toBeInTheDocument()
    })
  },
}

export const TimeSeriesChart: Story = {
  args: {
    value: timeSeriesData,
    config: {
      data: [
        {
          xKey: 'timestamp',
          yKey: 'power',
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Power Output',
          line: { color: 'red' },
        },
      ],
      layout: {
        title: { text: 'Power Output Over Time' },
        xaxis: {
          title: { text: 'Time' },
          type: 'date',
        },
        yaxis: { title: { text: 'Power (W)' } },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByText('Power Output Over Time')).toBeInTheDocument()
    })
  },
}

export const MultipleTraces: Story = {
  args: {
    value: timeSeriesData2,
    config: {
      data: [
        {
          xKey: 'timestamp',
          yKey: 'forecast',
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Forecast',
          line: { color: 'red' },
        },
        {
          xKey: 'timestamp',
          yKey: 'actual',
          type: 'scatter',
          mode: 'lines',
          name: 'Actual',
          line: { color: 'green', shape: 'spline' },
        },
      ],
      layout: {
        title: { text: 'Power Forecast and Actuals' },
        xaxis: {
          title: { text: 'Time' },
          type: 'date',
        },
        yaxis: { title: { text: 'Power (W)' } },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByText('Power Forecast and Actuals')).toBeInTheDocument()
    })
  },
}

export const CustomConfiguration: Story = {
  args: {
    value: salesData,
    config: {
      data: [
        {
          xKey: 'sales',
          yKey: 'profit',
          type: 'scatter',
          mode: 'markers',
          name: 'Sales vs Profit',
          marker: {
            size: 12,
            color: 'purple',
            opacity: 0.7,
          },
        },
      ],
      layout: {
        title: { text: 'Sales vs Profit Analysis' },
        xaxis: { title: { text: 'Units Sold' } },
        yaxis: { title: { text: 'Profit ($)' } },
        height: 500,
        showlegend: true,
      },
      config: {
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByText('Sales vs Profit Analysis')).toBeInTheDocument()
    })
  },
}
