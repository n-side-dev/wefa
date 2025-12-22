import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'

import GanttChartComponent from './GanttChartComponent.vue'
import type { GanttChartActivityData, GanttChartRowData } from './ganttChartTypes'

const buildDateRange = (start: Date, end: Date) => {
  const dates = []
  const cursor = new Date(start)

  while (cursor <= end) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const buildRows = (count: number): GanttChartRowData[] => {
  return Array.from({ length: count }, (_, index) => {
    const startDay = (index * 3) % 28
    const baseDate = new Date(2026, 0, 1 + startDay)
    const baseActivities: GanttChartActivityData[] = [
      {
        id: 'planned',
        label: 'Planned',
        startDate: new Date(baseDate),
        endDate: new Date(2026, 0, 6 + startDay),
        visualType: 'stripe',
        color: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 'optimized',
        label: 'Optimized',
        startDate: new Date(2026, 0, 3 + startDay),
        endDate: new Date(2026, 0, 9 + startDay),
        visualType: 'bar',
        colorClass: 'bg-emerald-400/80',
      },
      {
        id: 'desired',
        label: 'Desired',
        startDate: new Date(2026, 0, 5 + startDay),
        endDate: new Date(2026, 0, 12 + startDay),
        visualType: 'mini',
        colorClass: 'bg-amber-400/80',
      },
    ]
    const extraActivities: GanttChartActivityData[] =
      index % 3 === 0
        ? [
            {
              id: 'desired-2',
              label: 'Alt',
              startDate: new Date(2026, 0, 7 + startDay),
              endDate: new Date(2026, 0, 10 + startDay),
              visualType: 'mini',
              colorClass: 'bg-amber-500/80',
            },
          ]
        : []

    return {
      id: index,
      label: `Row ${index + 1}`,
      header: `Line ${index + 1}`,
      activities: [...baseActivities, ...extraActivities],
    }
  })
}

const meta: Meta<typeof GanttChartComponent> = {
  title: 'Components/GanttChart',
  component: GanttChartComponent,
  args: {
    dateRange: buildDateRange(new Date(2026, 0, 1), new Date(2026, 1, 28)),
    rows: buildRows(40),
    headerLabel: 'gantt_chart.header',
    viewMode: 'day',
    showWeekendShading: true,
    stackMiniActivities: true,
  },
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
  argTypes: {
    viewMode: {
      control: { type: 'inline-radio' },
      options: ['day', 'week'],
    },
    showWeekendShading: {
      control: { type: 'boolean' },
    },
    stackMiniActivities: {
      control: { type: 'boolean' },
    },
    dateRange: {
      control: { type: 'object' },
    },
    rows: {
      control: { type: 'object' },
    },
    headerLabel: {
      control: { type: 'text' },
    },
    activityTooltip: {
      control: false,
    },
    activityClick: {
      control: false,
    },
  },
}

export default meta

type Story = StoryObj<typeof GanttChartComponent>

export const Default: Story = {
  render: (args) => ({
    components: { GanttChartComponent },
    setup() {
      return { args }
    },
    template: `
      <div class="bg-slate-50 p-4" style="height: 700px;">
        <GanttChartComponent v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(args.headerLabel ?? 'Header')).toBeInTheDocument()
  },
}
