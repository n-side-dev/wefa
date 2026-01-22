import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import { ref } from 'vue'
import Button from 'primevue/button'

import GanttChartComponent from './GanttChartComponent.vue'
import type { GanttChartActivityData, GanttChartRowData } from './ganttChartTypes'

const buildRows = (count: number): GanttChartRowData[] => {
  return Array.from({ length: count }, (_, index) => {
    const startDay = (index * 3) % 28
    const baseDate = new Date(2026, 0, 1 + startDay)
    const rowId = `row-${index}`
    const baseActivities: GanttChartActivityData[] = [
      {
        id: `planned-${index}`,
        label: 'Planned',
        startDate: new Date(baseDate),
        endDate: new Date(2026, 0, 6 + startDay),
        visualType: 'stripe',
        color: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: `optimized-${index}`,
        label: 'Optimized',
        startDate: new Date(2026, 0, 3 + startDay),
        endDate: new Date(2026, 0, 9 + startDay),
        visualType: 'bar',
        colorClass: 'bg-emerald-400/80',
      },
      {
        id: `desired-${index}`,
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
              id: `desired-2-${index}`,
              label: 'Alt',
              startDate: new Date(2026, 0, 7 + startDay),
              endDate: new Date(2026, 0, 10 + startDay),
              visualType: 'mini',
              colorClass: 'bg-amber-500/80',
            },
          ]
        : []
    const forwardMiniActivities: GanttChartActivityData[] =
      index % 4 === 0
        ? [
            {
              id: `desired-forward-${index}`,
              label: 'Follow-up',
              startDate: new Date(2026, 0, 14 + startDay),
              endDate: new Date(2026, 0, 16 + startDay),
              visualType: 'mini',
              colorClass: 'bg-amber-300/80',
            },
          ]
        : []

    return {
      id: rowId,
      label: `Row ${index + 1}`,
      header: `Line ${index + 1}`,
      activities: [...baseActivities, ...extraActivities, ...forwardMiniActivities],
    }
  })
}

const buildLinks = (rows: GanttChartRowData[]) => {
  const links = []
  for (let index = 0; index < rows.length - 1; index += 4) {
    const from = rows[index]?.activities.find((activity) => activity.visualType === 'bar')
    const to = rows[index + 1]?.activities.find((activity) => activity.visualType === 'bar')
    if (from?.id && to?.id) {
      links.push({ fromId: from.id, toId: to.id })
    }
  }
  for (let index = 0; index < rows.length - 2; index += 5) {
    const from = rows[index]?.activities.find((activity) => activity.visualType === 'mini')
    const to = rows[index + 2]?.activities.find((activity) => activity.visualType === 'mini')
    if (from?.id && to?.id) {
      links.push({ fromId: from.id, toId: to.id })
    }
  }
  rows.forEach((row) => {
    const miniActivities = row.activities
      .filter((activity) => activity.visualType === 'mini')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    if (miniActivities.length < 2) {
      return
    }

    const [first, second] = miniActivities
    if (first?.id && second?.id && first.endDate <= second.startDate) {
      links.push({ fromId: first.id, toId: second.id })
    }
  })
  return links
}
const meta: Meta<typeof GanttChartComponent> = {
  title: 'Components/GanttChart',
  component: GanttChartComponent,
  args: {
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 1, 28),
    rows: buildRows(40),
    links: buildLinks(buildRows(40)),
    headerLabel: 'gantt_chart.header',
    viewMode: 'day',
    showWeekendShading: true,
    stackMiniActivities: true,
    leftHeaderWidthPx: 320,
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
    startDate: {
      control: { type: 'date' },
    },
    endDate: {
      control: { type: 'date' },
    },
    rows: {
      control: { type: 'object' },
    },
    links: {
      control: { type: 'object' },
    },
    headerLabel: {
      control: { type: 'text' },
    },
    leftHeaderWidthPx: {
      control: { type: 'number' },
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
    await expect(
      canvas.getByText((text) => text === 'Header' || text === (args.headerLabel ?? 'Header'))
    ).toBeInTheDocument()
  },
}

export const CustomTooltipAndClick: Story = {
  name: 'Custom Tooltip + Click',
  render: (args) => ({
    components: { GanttChartComponent },
    setup() {
      const lastClick = ref('Click an activity')
      type Row = GanttChartRowData
      type Activity = GanttChartActivityData
      const activityTooltip = (activity: Activity, row: Row) =>
        `${row.header ?? row.label}: ${activity.label ?? 'gantt_chart.activity'}`
      const activityClick = (activity: Activity, row: Row) => {
        lastClick.value = `${row.header ?? row.label}: ${activity.label ?? 'gantt_chart.activity'}`
      }

      return { args, lastClick, activityTooltip, activityClick }
    },
    template: `
      <div class="bg-slate-50 p-4" style="height: 700px;">
        <div class="mb-3 text-sm text-surface-600">Last click: {{ lastClick }}</div>
        <GanttChartComponent
          v-bind="args"
          :activity-tooltip="activityTooltip"
          :activity-click="activityClick"
        />
      </div>
    `,
  }),
}

export const ToggleViewMode: Story = {
  render: (args) => ({
    components: { GanttChartComponent, Button },
    setup() {
      const viewMode = ref<'day' | 'week'>(args.viewMode ?? 'day')

      return { args, viewMode }
    },
    template: `
      <div class="bg-slate-50 p-4" style="height: 700px;">
        <div class="mb-3 flex items-center gap-2">
          <Button
            label="Day"
            severity="secondary"
            :outlined="viewMode !== 'day'"
            @click="viewMode = 'day'"
          />
          <Button
            label="Week"
            severity="secondary"
            :outlined="viewMode !== 'week'"
            @click="viewMode = 'week'"
          />
        </div>
        <GanttChartComponent v-bind="args" :view-mode="viewMode" />
      </div>
    `,
  }),
}
