import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import ControlBarComponent from './ControlBarComponent.vue'
import ControlBarItemComponent from './ControlBarItemComponent.vue'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

const meta: Meta<typeof ControlBarComponent> = {
  title: 'Components/ControlBarComponent/ControlBarComponent',
  component: ControlBarComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The ControlBarComponent is a flexible layout container that provides a horizontal flexbox layout for control bar items.
It serves as the foundation for building control bars and dashboards with consistent spacing and responsive behavior.

## Features
- Flexbox layout with consistent spacing
- Responsive design with automatic wrapping
- Stretch alignment for consistent height
- Zero configuration required
- Slot-based content acceptance
        `,
      },
    },
  },
  argTypes: {
    // No props for this component - it's a pure layout component
  },
}

export default meta
type Story = StoryObj<typeof ControlBarComponent>

export const WithControlBarItems: Story = {
  name: 'With ControlBarItemComponent',
  render: () => ({
    components: { ControlBarComponent, ControlBarItemComponent, Badge, ProgressBar, Message },
    template: `
      <ControlBarComponent>
        <ControlBarItemComponent title="CPU Usage">
          <ProgressBar :value="75" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Memory">
          <Badge value="8GB" severity="info" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Status">
          <Message severity="success">Online</Message>
        </ControlBarItemComponent>
      </ControlBarComponent>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('CPU Usage')).toBeInTheDocument()
    await expect(canvas.getByText('Memory')).toBeInTheDocument()
    await expect(canvas.getByText('Status')).toBeInTheDocument()
    await expect(canvas.getByText('8GB')).toBeInTheDocument()
    await expect(canvas.getByText('Online')).toBeInTheDocument()
  },
}

export const ResponsiveWrapping: Story = {
  render: () => ({
    components: { ControlBarComponent, ControlBarItemComponent, Badge },
    setup() {
      const items = [
        { id: 1, title: 'Active Users', value: '1,234' },
        { id: 2, title: 'Page Views', value: '45,678' },
        { id: 3, title: 'Conversions', value: '892' },
        { id: 4, title: 'Revenue', value: '$12,345' },
        { id: 5, title: 'Bounce Rate', value: '23%' },
        { id: 6, title: 'Session Duration', value: '4:32' },
      ]
      return { items }
    },
    template: `
      <ControlBarComponent>
        <ControlBarItemComponent
          v-for="item in items"
          :key="item.id"
          :title="item.title"
        >
          <Badge :value="item.value" severity="success" />
        </ControlBarItemComponent>
      </ControlBarComponent>
    `,
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Active Users')).toBeInTheDocument()
    await expect(canvas.getByText('1,234')).toBeInTheDocument()
    await expect(canvas.getByText('Revenue')).toBeInTheDocument()
    await expect(canvas.getByText('$12,345')).toBeInTheDocument()
  },
}

export const DashboardMetrics: Story = {
  name: 'Dashboard Example',
  render: () => ({
    components: { ControlBarComponent, ControlBarItemComponent, Badge, ProgressBar, Message },
    template: `
      <ControlBarComponent>
        <ControlBarItemComponent title="Active Users">
          <Badge value="1,234" severity="success" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="CPU Usage">
          <ProgressBar :value="65" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Memory">
          <ProgressBar :value="78" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Status">
          <Message severity="success">All systems operational</Message>
        </ControlBarItemComponent>
      </ControlBarComponent>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Active Users')).toBeInTheDocument()
    await expect(canvas.getByText('1,234')).toBeInTheDocument()
    await expect(canvas.getByText('CPU Usage')).toBeInTheDocument()
    await expect(canvas.getByText('Memory')).toBeInTheDocument()
    await expect(canvas.getByText('All systems operational')).toBeInTheDocument()
  },
}

export const WithDifferentSizes: Story = {
  name: 'Different Item Sizes',
  render: () => ({
    components: { ControlBarComponent, ControlBarItemComponent, Badge, ProgressBar },
    template: `
      <ControlBarComponent>
        <ControlBarItemComponent title="Small">
          <Badge value="5" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Medium Progress">
          <ProgressBar :value="45" />
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Large Content">
          <div class="p-4 bg-blue-50 rounded">
            <div class="font-bold">Complex Item</div>
            <div class="text-sm text-gray-600">With multiple lines</div>
            <div class="text-xs text-gray-500">And additional details</div>
          </div>
        </ControlBarItemComponent>
        <ControlBarItemComponent title="Another Small">
          <Badge value="99+" severity="danger" />
        </ControlBarItemComponent>
      </ControlBarComponent>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Small')).toBeInTheDocument()
    await expect(canvas.getByText('Medium Progress')).toBeInTheDocument()
    await expect(canvas.getByText('Large Content')).toBeInTheDocument()
    await expect(canvas.getByText('Complex Item')).toBeInTheDocument()
    await expect(canvas.getByText('99+')).toBeInTheDocument()
  },
}
