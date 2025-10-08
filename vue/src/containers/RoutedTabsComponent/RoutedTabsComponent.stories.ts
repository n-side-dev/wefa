import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, waitFor } from 'storybook/test'

import RoutedTabsComponent from './RoutedTabsComponent.vue'
import { useRouter } from 'vue-router'

const meta: Meta<typeof RoutedTabsComponent> = {
  title: 'Components/RoutedTabsComponent',
  component: RoutedTabsComponent,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    tabs: {
      control: 'object',
      description: 'Array of tab names that correspond to route names',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="padding: 20px; min-height: 400px;">
          <story />
        </div>
      `,
      async beforeMount() {
        // Navigate to the first tab route for consistent story display
        const router = useRouter()
        await router.push({
          name: 'Dashboard',
        })
      },
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default example with three tabs representing different sections of an application.
 */
export const Default: Story = {
  args: {
    tabs: ['Dashboard', 'Analytics', 'Settings'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    })

    // Check that all tabs are rendered
    expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    expect(canvas.getByText('Analytics')).toBeInTheDocument()
    expect(canvas.getByText('Settings')).toBeInTheDocument()
  },
}

/**
 * Example with two tabs for a simpler interface.
 */
export const TwoTabs: Story = {
  args: {
    tabs: ['Dashboard', 'Settings'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    })

    // Check that both tabs are rendered
    expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    expect(canvas.getByText('Settings')).toBeInTheDocument()

    // Analytics tab should not be present
    expect(canvas.queryByText('Analytics')).not.toBeInTheDocument()
  },
}

/**
 * Example with a single tab (edge case).
 */
export const SingleTab: Story = {
  args: {
    tabs: ['Dashboard'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    })

    // Check that only one tab is rendered
    expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    expect(canvas.queryByText('Analytics')).not.toBeInTheDocument()
    expect(canvas.queryByText('Settings')).not.toBeInTheDocument()
  },
}

/**
 * Example with a non existing tab (edge case).
 */
export const NonExistingTab: Story = {
  args: {
    tabs: ['Dashboard', 'Not Existing'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for the component to render
    await waitFor(() => {
      expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    })

    // Check that only one tab is rendered
    expect(canvas.getByText('Dashboard')).toBeInTheDocument()
    expect(canvas.getByText('Not Existing')).toBeInTheDocument()
  },
}
