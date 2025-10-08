import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import ConfiguredControlBarComponent from './ConfiguredControlBarComponent.vue'

const meta: Meta<typeof ConfiguredControlBarComponent> = {
  title: 'Components/ControlBarComponent/ConfiguredControlBarComponent',
  component: ConfiguredControlBarComponent,
  args: {
    modelValue: {
      badgeValue: 10,
      progressValue: 75,
      messageText: 'Operation completed successfully',
      ratingValue: 4,
      statusBadge: 'Active',
      completionRate: 85,
      errorMessage: 'Warning: Check configuration',
      userRating: 3.5,
    },
    config: [
      {
        title: 'Count',
        component: 'Badge',
        data: 'badgeValue',
        props: { severity: 'success' },
      },
      {
        title: 'Progress',
        component: 'ProgressBar',
        data: 'progressValue',
      },
    ],
  },
  argTypes: {
    modelValue: {
      control: 'object',
      description: 'Data object containing values for the control bar items (v-model)',
    },
    config: {
      control: 'object',
      description: 'Array of configurations for each control bar item',
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The ConfiguredControlBarComponent creates a flexible control bar where each item is configured through a configuration array.
Each item can display different components (Badge, ProgressBar, Message, Rating, etc.) with custom props.

## Features
- Dynamic component rendering based on configuration
- Support for custom props per component
- Flexible data binding
- Responsive layout with flexbox
        `,
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof ConfiguredControlBarComponent>

export const Default: Story = {
  render: (args) => ({
    components: { ConfiguredControlBarComponent },
    setup() {
      return { args }
    },
    template: '<ConfiguredControlBarComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Count')).toBeInTheDocument()
    await expect(canvas.getByText('Progress')).toBeInTheDocument()
  },
}

export const WithBadgeComponents: Story = {
  args: {
    modelValue: {
      activeUsers: 142,
      pendingTasks: 7,
      completedItems: 23,
      errorCount: 0,
    },
    config: [
      {
        title: 'Active Users',
        component: 'Badge',
        data: 'activeUsers',
        props: { severity: 'success' },
      },
      {
        title: 'Pending Tasks',
        component: 'Badge',
        data: 'pendingTasks',
        props: { severity: 'warning' },
      },
      {
        title: 'Completed',
        component: 'Badge',
        data: 'completedItems',
        props: { severity: 'info' },
      },
      {
        title: 'Errors',
        component: 'Badge',
        data: 'errorCount',
        props: { severity: 'danger' },
      },
    ],
  },
  render: (args) => ({
    components: { ConfiguredControlBarComponent },
    setup() {
      return { args }
    },
    template: '<ConfiguredControlBarComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Active Users')).toBeInTheDocument()
    await expect(canvas.getByText('Pending Tasks')).toBeInTheDocument()
    await expect(canvas.getByText('Completed')).toBeInTheDocument()
    await expect(canvas.getByText('Errors')).toBeInTheDocument()
  },
}

export const WithProgressBars: Story = {
  args: {
    modelValue: {
      cpuUsage: 45,
      memoryUsage: 78,
      diskUsage: 23,
      networkUsage: 91,
    },
    config: [
      {
        title: 'CPU Usage',
        component: 'ProgressBar',
        data: 'cpuUsage',
      },
      {
        title: 'Memory Usage',
        component: 'ProgressBar',
        data: 'memoryUsage',
      },
      {
        title: 'Disk Usage',
        component: 'ProgressBar',
        data: 'diskUsage',
      },
      {
        title: 'Network Usage',
        component: 'ProgressBar',
        data: 'networkUsage',
      },
    ],
  },
  render: (args) => ({
    components: { ConfiguredControlBarComponent },
    setup() {
      return { args }
    },
    template: '<ConfiguredControlBarComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('CPU Usage')).toBeInTheDocument()
    await expect(canvas.getByText('Memory Usage')).toBeInTheDocument()
    await expect(canvas.getByText('Disk Usage')).toBeInTheDocument()
    await expect(canvas.getByText('Network Usage')).toBeInTheDocument()
  },
}

export const WithRatings: Story = {
  args: {
    modelValue: {
      userRating: 4,
      productRating: 3.5,
      serviceRating: 5,
      overallRating: 4.2,
    },
    config: [
      {
        title: 'User Rating',
        component: 'Rating',
        data: 'userRating',
        props: { readonly: true },
      },
      {
        title: 'Product Rating',
        component: 'Rating',
        data: 'productRating',
        props: { readonly: true },
      },
      {
        title: 'Service Rating',
        component: 'Rating',
        data: 'serviceRating',
        props: { readonly: true },
      },
      {
        title: 'Overall Rating',
        component: 'Rating',
        data: 'overallRating',
        props: { readonly: true },
      },
    ],
  },
  render: (args) => ({
    components: { ConfiguredControlBarComponent },
    setup() {
      return { args }
    },
    template: '<ConfiguredControlBarComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('User Rating')).toBeInTheDocument()
    await expect(canvas.getByText('Product Rating')).toBeInTheDocument()
    await expect(canvas.getByText('Service Rating')).toBeInTheDocument()
    await expect(canvas.getByText('Overall Rating')).toBeInTheDocument()
  },
}

export const MixedComponents: Story = {
  args: {
    modelValue: {
      activeUsers: 89,
      completionRate: 67,
      statusMessage: 'System operational',
      userSatisfaction: 4.3,
      errorCount: 2,
      loadTime: 1.2,
    },
    config: [
      {
        title: 'Active Users',
        component: 'Badge',
        data: 'activeUsers',
        props: { severity: 'success' },
      },
      {
        title: 'Completion Rate',
        component: 'ProgressBar',
        data: 'completionRate',
      },
      {
        title: 'User Satisfaction',
        component: 'Rating',
        data: 'userSatisfaction',
        props: { readonly: true },
      },
      {
        title: 'Errors',
        component: 'Badge',
        data: 'errorCount',
        props: { severity: 'danger' },
      },
    ],
  },
  render: (args) => ({
    components: { ConfiguredControlBarComponent },
    setup() {
      return { args }
    },
    template: '<ConfiguredControlBarComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Active Users')).toBeInTheDocument()
    await expect(canvas.getByText('Completion Rate')).toBeInTheDocument()
    await expect(canvas.getByText('User Satisfaction')).toBeInTheDocument()
    await expect(canvas.getByText('Errors')).toBeInTheDocument()
  },
}

export const SingleItem: Story = {
  args: {
    modelValue: {
      temperature: 23.5,
    },
    config: [
      {
        title: 'Temperature (°C)',
        component: 'Badge',
        data: 'temperature',
        props: { severity: 'info' },
      },
    ],
  },
  render: (args) => ({
    components: { ConfiguredControlBarComponent },
    setup() {
      return { args }
    },
    template: '<ConfiguredControlBarComponent v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Temperature (°C)')).toBeInTheDocument()
  },
}
