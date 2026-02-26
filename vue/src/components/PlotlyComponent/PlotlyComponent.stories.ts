import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, waitFor } from 'storybook/test'

import PlotlyComponent from './PlotlyComponent.vue'
import type { Data } from 'plotly.js-dist-min'

const meta: Meta<typeof PlotlyComponent> = {
  title: 'Components/PlotlyComponent',
  component: PlotlyComponent,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of data objects that define the traces to be plotted',
      table: {
        type: { summary: 'Data[]' },
        defaultValue: { summary: '[]' },
      },
    },
    layout: {
      control: 'object',
      description: "Layout configuration object that defines the plot's appearance and behavior",
      table: {
        type: { summary: 'Partial<Layout>' },
        defaultValue: { summary: '{ height: 400 }' },
      },
    },
    config: {
      control: 'object',
      description: 'Configuration object that defines plot interaction and display options',
      table: {
        type: { summary: 'Partial<Config>' },
        defaultValue: { summary: '{ responsive: true }' },
      },
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="padding: 20px; min-height: 500px;">
          <story />
        </div>
      `,
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const canUseWebGL = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

const shouldUseWebGL = import.meta.env.MODE !== 'test' && canUseWebGL()

// Sample data for different chart types
const lineChartData: Data[] = [
  {
    x: [1, 2, 3, 4, 5, 6],
    y: [10, 15, 13, 17, 20, 18],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Energy Consumption',
    line: { color: '#1f77b4' },
  },
]

const barChartData: Data[] = [
  {
    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    y: [20, 14, 23, 25, 22, 16],
    type: 'bar',
    name: 'Monthly Usage',
    marker: { color: '#ff7f0e' },
  },
]

const multipleTracesData: Data[] = [
  {
    x: [1, 2, 3, 4, 5, 6],
    y: [10, 15, 13, 17, 20, 18],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Solar Energy',
    line: { color: '#2ca02c' },
  },
  {
    x: [1, 2, 3, 4, 5, 6],
    y: [16, 18, 17, 19, 25, 23],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Wind Energy',
    line: { color: '#d62728' },
  },
  {
    x: [1, 2, 3, 4, 5, 6],
    y: [8, 12, 10, 14, 16, 15],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Hydro Energy',
    line: { color: '#9467bd' },
  },
]

const pieChartData: Data[] = [
  {
    values: [35, 25, 20, 15, 5],
    labels: ['Solar', 'Wind', 'Hydro', 'Nuclear', 'Coal'],
    type: 'pie',
    marker: {
      colors: ['#2ca02c', '#d62728', '#1f77b4', '#ff7f0e', '#8c564b'],
    },
  },
]

/**
 * Default example with a simple line chart showing energy consumption over time.
 */
export const LineChart: Story = {
  args: {
    data: lineChartData,
    layout: {
      title: { text: 'Energy Consumption Over Time' },
      xaxis: { title: { text: 'Time Period' } },
      yaxis: { title: { text: 'Energy (kWh)' } },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Energy Consumption Over Time')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

/**
 * Bar chart example showing monthly energy usage data.
 */
export const BarChart: Story = {
  args: {
    data: barChartData,
    layout: {
      title: { text: 'Monthly Energy Usage' },
      xaxis: { title: { text: 'Month' } },
      yaxis: { title: { text: 'Usage (MWh)' } },
      height: 400,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Monthly Energy Usage')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

/**
 * Multiple traces example showing different energy sources over time.
 */
export const MultipleTraces: Story = {
  args: {
    data: multipleTracesData,
    layout: {
      title: { text: 'Renewable Energy Sources Comparison' },
      xaxis: { title: { text: 'Time Period' } },
      yaxis: { title: { text: 'Energy Output (GWh)' } },
      height: 450,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Renewable Energy Sources Comparison')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

/**
 * Pie chart example showing energy source distribution.
 */
export const PieChart: Story = {
  args: {
    data: pieChartData,
    layout: {
      title: { text: 'Energy Source Distribution' },
      height: 500,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Energy Source Distribution')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

/**
 * Custom configuration example with disabled toolbar and custom styling.
 */
export const CustomConfig: Story = {
  args: {
    data: lineChartData,
    layout: {
      title: { text: 'Chart with Custom Configuration' },
      xaxis: { title: { text: 'Time' } },
      yaxis: { title: { text: 'Value' } },
      plot_bgcolor: '#f8f9fa',
      paper_bgcolor: '#ffffff',
    },
    config: {
      displayModeBar: false,
      staticPlot: false,
      responsive: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Chart with Custom Configuration')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

/**
 * Large dataset example demonstrating performance with more data points.
 */
export const LargeDataset: Story = {
  args: {
    data: [
      {
        x: Array.from({ length: 1000 }, (_, i) => i),
        y: Array.from(
          { length: 1000 },
          (_, i) => Math.sin(i * 0.01) * 100 + Math.sin(i * 0.03) * 20
        ),
        type: 'scatter',
        mode: 'lines',
        name: 'Large Dataset',
        line: { color: '#1f77b4', width: 1 },
      },
    ],
    layout: {
      title: { text: 'Large Dataset Performance Test' },
      xaxis: { title: { text: 'Data Points' } },
      yaxis: { title: { text: 'Values' } },
      height: 400,
    },
    config: {
      responsive: true,
      displayModeBar: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Large Dataset Performance Test')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

/**
 * Minimal example with just data and default settings.
 */
export const MinimalExample: Story = {
  args: {
    data: [
      {
        x: [1, 2, 3, 4],
        y: [10, 11, 12, 13],
        type: 'scatter',
        mode: 'lines+markers',
      },
    ],
  },
  play: async ({ canvasElement }) => {
    // Wait for the component to render and check for the chart container
    await waitFor(() => {
      const chartContainer = canvasElement.querySelector('.plotly-container')
      expect(chartContainer).toBeInTheDocument()
    })
  },
}

/**
 * Interactive example with custom toolbar configuration.
 */
export const InteractiveChart: Story = {
  args: {
    data: multipleTracesData,
    layout: {
      title: { text: 'Interactive Energy Chart' },
      xaxis: { title: { text: 'Time Period' } },
      yaxis: { title: { text: 'Energy (GWh)' } },
      hovermode: 'x unified',
    },
    config: {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'energy_chart',
        height: 500,
        width: 700,
        scale: 1,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Interactive Energy Chart')).toBeInTheDocument()
    })

    // Check that the chart container exists
    const chartContainer = canvasElement.querySelector('.plotly-container')
    expect(chartContainer).toBeInTheDocument()
  },
}

// Advanced visualization examples with complex data patterns and custom styling
/* eslint-disable sonarjs/pseudo-random */

/**
 * Advanced 3D surface plot demonstrating complex mathematical functions with custom lighting and contour projections.
 * Features sophisticated color mapping and camera positioning for optimal data visualization.
 */
export const Advanced3DSurfacePlot: Story = {
  args: {
    data: shouldUseWebGL
      ? [
          {
            z: Array.from({ length: 50 }, (_, i) =>
              Array.from({ length: 50 }, (_, j) => {
                const x = (i - 25) / 5
                const y = (j - 25) / 5
                return (
                  Math.sin(Math.sqrt(x * x + y * y)) *
                    Math.exp(-Math.sqrt(x * x + y * y) / 10) *
                    10 +
                  Math.cos(x * 2) * Math.sin(y * 2) * 5 +
                  Math.random() * 2
                )
              })
            ),
            type: 'surface',
            colorscale: [
              [0, '#FF00FF'], // Magenta
              [0.1, '#FF0080'], // Hot Pink
              [0.2, '#FF4000'], // Red Orange
              [0.3, '#FF8000'], // Orange
              [0.4, '#FFFF00'], // Yellow
              [0.5, '#80FF00'], // Lime
              [0.6, '#00FF00'], // Green
              [0.7, '#00FF80'], // Spring Green
              [0.8, '#00FFFF'], // Cyan
              [0.9, '#0080FF'], // Sky Blue
              [1, '#8000FF'], // Purple
            ],
            showscale: true,
            lighting: {
              ambient: 0.8,
              diffuse: 0.9,
              fresnel: 0.1,
              specular: 2,
              roughness: 0.05,
            },
            contours: {
              z: {
                show: true,
                usecolormap: true,
                highlightcolor: '#42f462',
                project: { z: true },
              },
            } as Record<string, unknown>,
          } as Record<string, unknown>,
        ]
      : [
          {
            x: [1, 2, 3, 4, 5, 6],
            y: [10, 15, 13, 17, 20, 18],
            type: 'scatter',
            mode: 'lines+markers',
            name: 'WebGL unavailable',
            line: { color: '#1f77b4' },
          },
        ],
    layout: {
      title: {
        text: shouldUseWebGL
          ? 'Advanced 3D Energy Surface Analysis'
          : 'Advanced Surface (WebGL unavailable)',
        font: { size: 24, color: '#FF00FF', family: 'Arial Black' },
      },
      scene: {
        xaxis: { title: { text: 'X-Dimension' }, backgroundcolor: '#000011', gridcolor: '#FF00FF' },
        yaxis: { title: { text: 'Y-Dimension' }, backgroundcolor: '#000011', gridcolor: '#00FFFF' },
        zaxis: {
          title: { text: 'Energy Intensity' },
          backgroundcolor: '#000011',
          gridcolor: '#FFFF00',
        },
        bgcolor: '#000022',
        camera: {
          eye: { x: 1.87, y: 0.88, z: -0.64 },
        },
      },
      paper_bgcolor: '#000033',
      plot_bgcolor: '#000033',
      height: 600,
      margin: { l: 0, r: 0, b: 0, t: 50 },
    },
    config: {
      displayModeBar: true,
      displaylogo: false,
    },
  },
}

/**
 * Multi-dimensional scatter plot with dynamic marker configurations and advanced styling.
 * Demonstrates complex data visualization with varied marker sizes, colors, and symbols.
 */
export const MultiDimensionalScatterPlot: Story = {
  args: {
    data: [
      {
        x: Array.from({ length: 100 }, () => Math.random() * 100),
        y: Array.from({ length: 100 }, () => Math.random() * 100),
        mode: 'markers',
        marker: {
          size: Array.from({ length: 100 }, () => Math.random() * 50 + 10),
          color: Array.from({ length: 100 }, () => Math.random() * 360),
          colorscale: 'Rainbow',
          opacity: 0.8,
          line: {
            color: 'white',
            width: 2,
          },
          symbol: Array.from(
            { length: 100 },
            (_, i) =>
              [
                'circle',
                'square',
                'diamond',
                'cross',
                'x',
                'triangle-up',
                'triangle-down',
                'pentagon',
                'hexagon',
                'star',
              ][i % 10] || 'circle'
          ),
        },
        type: 'scatter',
        name: 'Primary Dataset',
        hovertemplate:
          '<b>Data Point %{pointNumber}</b><br>' +
          'X-Coordinate: %{x:.2f}<br>' +
          'Y-Coordinate: %{y:.2f}<br>' +
          'Size: %{marker.size:.1f}<br>' +
          'Color Value: %{marker.color:.1f}<br>' +
          '<extra></extra>',
      },
      {
        x: Array.from({ length: 50 }, () => Math.random() * 100),
        y: Array.from({ length: 50 }, () => Math.random() * 100),
        mode: 'markers',
        marker: {
          size: Array.from({ length: 50 }, () => Math.random() * 30 + 5),
          color: Array.from({ length: 50 }, () => Math.random() * 360),
          colorscale: 'Viridis',
          opacity: 0.6,
          line: {
            color: '#FF00FF',
            width: 3,
          },
        },
        type: 'scatter',
        name: 'Secondary Dataset',
      },
    ],
    layout: {
      title: {
        text: 'Multi-Dimensional Data Visualization',
        font: { size: 28, color: '#FF4500', family: 'Impact' },
      },
      xaxis: {
        title: { text: 'X-Axis Values' },
        range: [0, 100],
        gridcolor: '#444',
        zerolinecolor: '#FF00FF',
      },
      yaxis: {
        title: { text: 'Y-Axis Values' },
        range: [0, 100],
        gridcolor: '#444',
        zerolinecolor: '#00FFFF',
      },
      plot_bgcolor: '#0a0a0a',
      paper_bgcolor: '#1a1a2e',
      font: { color: '#ffffff' },
      height: 650,
      hovermode: 'closest',
      annotations: [
        {
          x: 50,
          y: 95,
          text: 'Data Distribution Analysis',
          showarrow: false,
          font: { size: 16, color: '#FFD700' },
        },
      ],
    },
  },
}

/**
 * Advanced heatmap visualization with custom color scaling and mathematical data patterns.
 * Demonstrates complex grid-based data representation with professional styling.
 */
export const AdvancedHeatmapVisualization: Story = {
  args: {
    data: [
      {
        z: Array.from({ length: 30 }, (_, i) =>
          Array.from({ length: 30 }, (_, j) => {
            const centerX = 15,
              centerY = 15
            const distance = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2)
            return (
              Math.sin(distance / 3) * Math.cos(i / 5) * Math.sin(j / 5) * 100 +
              Math.random() * 20 -
              10
            )
          })
        ),
        type: 'heatmap',
        colorscale: [
          [0, '#000000'], // Black
          [0.1, '#001100'], // Dark Green
          [0.2, '#003300'], // Darker Green
          [0.3, '#00FF00'], // Bright Green
          [0.4, '#00FFFF'], // Cyan
          [0.5, '#0080FF'], // Blue
          [0.6, '#8000FF'], // Purple
          [0.7, '#FF00FF'], // Magenta
          [0.8, '#FF0080'], // Hot Pink
          [0.9, '#FF4000'], // Red Orange
          [1, '#FFFFFF'], // White
        ],
        showscale: true,
        hoverongaps: false,
        hovertemplate:
          '<b>Grid Node</b><br>' +
          'Grid X: %{x}<br>' +
          'Grid Y: %{y}<br>' +
          'Value: %{z:.1f}<br>' +
          '<extra></extra>',
      },
    ],
    layout: {
      title: {
        text: 'Advanced Heatmap Data Analysis',
        font: { size: 26, color: '#00FF00', family: 'Courier New' },
      },
      xaxis: {
        title: { text: 'Grid X-Axis' },
        tickfont: { color: '#00FFFF' },
        titlefont: { color: '#00FFFF' },
      } as Record<string, unknown>,
      yaxis: {
        title: { text: 'Grid Y-Axis' },
        tickfont: { color: '#FF00FF' },
        titlefont: { color: '#FF00FF' },
      } as Record<string, unknown>,
      plot_bgcolor: '#000000',
      paper_bgcolor: '#0a0a0a',
      font: { color: '#00FF00' },
      height: 600,
      annotations: [
        {
          x: 15,
          y: 32,
          text: 'Data Pattern Analysis',
          showarrow: false,
          font: { size: 14, color: '#FFFF00' },
        },
      ],
    },
  },
}

/**
 * Advanced waterfall chart demonstrating cumulative data flow analysis.
 * Features custom styling for positive, negative, and total values with connector lines.
 */
export const AdvancedWaterfallChart: Story = {
  args: {
    data: [
      {
        x: [
          'Initial Energy',
          'Solar Boost',
          'Wind Surge',
          'Hydro Flow',
          'Nuclear Power',
          'Final Total',
        ],
        y: [100, 45, -20, 30, -15, 140],
        type: 'waterfall',
        name: 'Energy Flow',
        connector: {
          line: {
            color: '#00FFFF',
            width: 4,
            dash: 'dot',
          },
        },
        increasing: {
          marker: {
            color: '#00FF00',
            line: { color: '#FFFFFF', width: 2 },
          },
        },
        decreasing: {
          marker: {
            color: '#FF0040',
            line: { color: '#FFFFFF', width: 2 },
          },
        },
        totals: {
          marker: {
            color: '#FFD700',
            line: { color: '#FFFFFF', width: 3 },
          },
        },
        hovertemplate:
          '<b>%{x}</b><br>' +
          'Value: %{y}<br>' +
          'Running Total: %{cumulativevalue}<br>' +
          '<extra></extra>',
      } as Record<string, unknown>,
    ],
    layout: {
      title: {
        text: 'Advanced Energy Flow Analysis',
        font: { size: 24, color: '#00FFFF', family: 'Arial Black' },
      },
      xaxis: {
        title: { text: 'Energy Transformation Stages' },
        tickangle: -45,
        tickfont: { color: '#FFFFFF', size: 12 },
      },
      yaxis: {
        title: { text: 'Energy Units (MW)' },
        tickfont: { color: '#FFFFFF' },
      },
      plot_bgcolor: '#001122',
      paper_bgcolor: '#002244',
      font: { color: '#FFFFFF' },
      height: 550,
      showlegend: false,
      annotations: [
        {
          x: 2,
          y: 120,
          text: 'Cumulative Energy Flow Analysis',
          showarrow: true,
          arrowcolor: '#FFD700',
          font: { size: 14, color: '#FFD700' },
        },
      ],
    },
  },
}

/**
 * Comprehensive multi-subplot dashboard demonstrating various chart types in a single visualization.
 * Features scatter plots, polar charts, 3D visualizations, and funnel charts with coordinated layouts.
 */
export const ComprehensiveDashboard: Story = {
  args: {
    data: [
      // Subplot 1: Animated Scatter
      {
        x: Array.from({ length: 20 }, () => Math.random() * 10),
        y: Array.from({ length: 20 }, () => Math.random() * 10),
        mode: 'markers',
        marker: {
          size: Array.from({ length: 20 }, () => Math.random() * 20 + 5),
          color: Array.from({ length: 20 }, () => Math.random() * 360),
          colorscale: 'Rainbow',
          opacity: 0.8,
        },
        type: 'scatter',
        name: 'Scatter Data',
        xaxis: 'x',
        yaxis: 'y',
      },
      // Subplot 2: Polar Chart
      {
        r: [1, 5, 2, 2, 3, 4, 5, 6, 7, 8, 9],
        theta: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
        type: 'scatterpolar',
        mode: 'lines+markers',
        marker: { color: '#FF00FF', size: 8 },
        line: { color: '#00FFFF', width: 3 },
        name: 'Polar Data',
        subplot: 'polar',
      } as Record<string, unknown>,
      // Subplot 3: 3D Scatter
      {
        x: Array.from({ length: 30 }, () => Math.random() * 10),
        y: Array.from({ length: 30 }, () => Math.random() * 10),
        z: Array.from({ length: 30 }, () => Math.random() * 10),
        mode: 'markers',
        marker: {
          size: 5,
          color: Array.from({ length: 30 }, () => Math.random() * 360),
          colorscale: 'Viridis',
          opacity: 0.8,
        },
        type: 'scatter3d',
        name: '3D Data Points',
        scene: 'scene',
      } as Record<string, unknown>,
      // Subplot 4: Funnel
      {
        y: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
        x: [100, 80, 60, 40, 20],
        type: 'funnel',
        marker: {
          color: ['#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#0080FF'],
        },
        name: 'Funnel Analysis',
        xaxis: 'x2',
        yaxis: 'y2',
      },
    ],
    layout: {
      title: {
        text: 'Comprehensive Multi-Chart Dashboard',
        font: { size: 28, color: '#FF4500', family: 'Impact' },
      },
      // Main scatter plot
      xaxis: {
        domain: [0, 0.48],
        anchor: 'y',
        title: { text: 'Dimension X' },
      },
      yaxis: {
        domain: [0.52, 1],
        anchor: 'x',
        title: { text: 'Dimension Y' },
      },
      // Funnel chart
      xaxis2: {
        domain: [0.52, 1],
        anchor: 'y2',
        title: { text: 'Power Level' },
      },
      yaxis2: {
        domain: [0.52, 1],
        anchor: 'x2',
        title: { text: 'Energy Types' },
      },
      // Polar subplot
      polar: {
        domain: { x: [0, 0.48], y: [0, 0.48] },
        bgcolor: '#001122',
        radialaxis: { color: '#00FFFF' },
        angularaxis: { color: '#FF00FF' },
      },
      // 3D scene
      scene: {
        domain: { x: [0.52, 1], y: [0, 0.48] },
        xaxis: { title: { text: '3D X' }, backgroundcolor: '#000011' },
        yaxis: { title: { text: '3D Y' }, backgroundcolor: '#000011' },
        zaxis: { title: { text: '3D Z' }, backgroundcolor: '#000011' },
        bgcolor: '#000022',
      },
      plot_bgcolor: '#0a0a0a',
      paper_bgcolor: '#1a1a2e',
      font: { color: '#ffffff' },
      height: 800,
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(0,0,0,0.5)',
        bordercolor: '#FFFFFF',
        borderwidth: 1,
      },
    },
  },
}

/**
 * Advanced multi-series time series visualization with complex mathematical functions and custom styling.
 * Features multiple data streams with varied line styles, markers, and fill effects for comprehensive analysis.
 */
export const AdvancedTimeSeriesAnalysis: Story = {
  args: {
    data: [
      {
        x: Array.from({ length: 100 }, (_, i) => i),
        y: Array.from(
          { length: 100 },
          (_, i) => Math.sin(i * 0.1) * 50 + Math.cos(i * 0.05) * 30 + Math.random() * 20
        ),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Primary Series',
        line: {
          color: '#00FFFF',
          width: 4,
          shape: 'spline',
          smoothing: 1.3,
        },
        marker: {
          size: 8,
          color: '#00FFFF',
          symbol: 'circle',
          line: { color: '#FFFFFF', width: 2 },
        },
        fill: 'tonexty',
        fillcolor: 'rgba(0, 255, 255, 0.1)',
      },
      {
        x: Array.from({ length: 100 }, (_, i) => i),
        y: Array.from(
          { length: 100 },
          (_, i) => Math.cos(i * 0.08) * 40 + Math.sin(i * 0.12) * 25 + Math.random() * 15
        ),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Secondary Series',
        line: {
          color: '#FFFF00',
          width: 3,
          dash: 'dashdot',
        },
        marker: {
          size: 6,
          color: '#FFFF00',
          symbol: 'star',
          line: { color: '#FF0000', width: 1 },
        },
      },
      {
        x: Array.from({ length: 100 }, (_, i) => i),
        y: Array.from(
          { length: 100 },
          (_, i) => Math.sin(i * 0.15) * 35 + Math.cos(i * 0.07) * 20 + Math.random() * 10
        ),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Tertiary Series',
        line: {
          color: '#FF00FF',
          width: 5,
          shape: 'spline',
        },
        marker: {
          size: 10,
          color: Array.from({ length: 100 }, (_, i) => i * 3.6),
          colorscale: 'Hot',
          symbol: 'diamond',
          line: { color: '#FFFFFF', width: 1 },
        },
      },
    ],
    layout: {
      title: {
        text: 'Advanced Multi-Series Time Series Analysis',
        font: { size: 30, color: '#FF4500', family: 'Impact' },
      },
      xaxis: {
        title: { text: 'Time Period' },
        gridcolor: '#333333',
        zerolinecolor: '#666666',
        tickfont: { color: '#FFFFFF' },
      },
      yaxis: {
        title: { text: 'Data Values' },
        gridcolor: '#333333',
        zerolinecolor: '#666666',
        tickfont: { color: '#FFFFFF' },
      },
      plot_bgcolor: '#000000',
      paper_bgcolor: '#0a0a0a',
      font: { color: '#FFFFFF' },
      height: 600,
      hovermode: 'x unified',
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(0,0,0,0.8)',
        bordercolor: '#FFFFFF',
        borderwidth: 2,
        font: { color: '#FFFFFF' },
      },
      annotations: [
        {
          x: 50,
          y: 80,
          text: 'Data Peak Analysis Point',
          showarrow: true,
          arrowcolor: '#FFD700',
          arrowwidth: 3,
          font: { size: 16, color: '#FFD700' },
          bgcolor: 'rgba(0,0,0,0.8)',
          bordercolor: '#FFD700',
          borderwidth: 2,
        },
        {
          x: 25,
          y: -60,
          text: 'Statistical Correlation Zone',
          showarrow: false,
          font: { size: 14, color: '#00FFFF' },
        },
      ],
      shapes: [
        {
          type: 'circle',
          xref: 'x',
          yref: 'y',
          x0: 45,
          y0: 75,
          x1: 55,
          y1: 85,
          line: { color: '#FFD700', width: 3 },
          fillcolor: 'rgba(255, 215, 0, 0.1)',
        },
      ],
    },
    config: {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'ultimate_wild_chart',
        height: 800,
        width: 1200,
        scale: 2,
      },
    },
  },
}
