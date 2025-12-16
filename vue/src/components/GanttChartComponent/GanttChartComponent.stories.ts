import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'

import GanttChartComponent from './GanttChartComponent.vue'

const meta: Meta<typeof GanttChartComponent> = {
  title: 'Components/GanttChart',
  component: GanttChartComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The GanttChartComponent renders a yearly calendar grid with month, week, and day headers.
Rows are virtualized so large datasets remain scrollable without performance issues.

The story wraps the component in a fixed-height container to demonstrate scrolling in both axes.
        `,
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof GanttChartComponent>

export const Default: Story = {
  render: () => ({
    components: { GanttChartComponent },
    template: `
      <div class="bg-slate-50 p-4" style="height: 700px;">
        <GanttChartComponent />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const headers = canvas.getAllByText('Header')
    await expect(headers.length).toBeGreaterThan(0)
  },
}
