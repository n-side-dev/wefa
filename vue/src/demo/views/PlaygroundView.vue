<template>
  <div class="flex size-full flex-col gap-3">
    <div
      class="grid shrink-0 gap-2 rounded border border-surface-200 bg-surface-0 p-3 text-sm text-surface-700"
    >
      <div>{{ hoverDebug }}</div>
    </div>
    <GanttChartComponent
      class="min-h-0 flex-1"
      :start-date="startDate"
      :end-date="endDate"
      :rows="rows"
      :links="links"
      :activity-hover="activityHover"
      header-label="gantt_chart.header"
    >
      <template #activity-popover="{ activity, rowData, hoverContext }">
        <GanttHoverResizableTooltip
          :activity="activity"
          :row-data="rowData"
          :hover-context="hoverContext"
        />
      </template>
    </GanttChartComponent>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { GanttChartComponent } from '@/components/GanttChartComponent'
import GanttHoverResizableTooltip from '@/demo/components/GanttHoverResizableTooltip.vue'
import type {
  GanttChartActivityInteractionContext,
  GanttChartActivityData,
  GanttChartLinkData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()

const startDate = new Date(2026, 0, 1)
const endDate = new Date(2026, 1, 28)
const okLinkClass = '[stroke-dasharray:2,5]'
const linkCases = [
  { type: 'start-start', fromIndex: 2, toIndex: 0, color: 'green', class: okLinkClass  },
  { type: 'start-start', fromIndex: 2, toIndex: 1, color: 'green', class: okLinkClass  },
  { type: 'start-start', fromIndex: 2, toIndex: 3, color: 'green', class: okLinkClass  },
  { type: 'start-start', fromIndex: 2, toIndex: 4, color: 'green', class: okLinkClass  },
  { type: 'end-end', fromIndex: 2, toIndex: 0, color: 'red' },
  { type: 'end-end', fromIndex: 2, toIndex: 1, color: 'red' },
  { type: 'end-end', fromIndex: 2, toIndex: 3, color: 'red' },
  { type: 'end-end', fromIndex: 2, toIndex: 4, color: 'red' },
  { type: 'end-start', fromIndex: 8, toIndex: 5, color: 'green', class: okLinkClass  },
  { type: 'end-start', fromIndex: 8, toIndex: 6, color: 'green', class: okLinkClass  },
  { type: 'end-start', fromIndex: 8, toIndex: 7, color: 'green', class: okLinkClass  },
  { type: 'end-start', fromIndex: 8, toIndex: 9, color: 'green', class: okLinkClass  },
  { type: 'start-end', fromIndex: 6, toIndex: 5, color: 'red' },
  { type: 'start-end', fromIndex: 6, toIndex: 7, color: 'red' },
  { type: 'start-end', fromIndex: 6, toIndex: 8, color: 'red' },
  { type: 'start-end', fromIndex: 6, toIndex: 9, color: 'red' },
  { type: 'start-end', fromIndex: 8, toIndex: 5, color: 'blue' },
  { type: 'end-start', fromIndex: 10, toIndex: 11, color: 'green', class: okLinkClass  },
  { type: 'end-start', fromIndex: 10, toIndex: 12, color: 'green', class: okLinkClass  },
  { type: 'end-start', fromIndex: 10, toIndex: 13, color: 'red' },
  { type: 'end-start', fromIndex: 10, toIndex: 14, color: 'green', class: okLinkClass  },
  { type: 'start-end', fromIndex: 15, toIndex: 11, color: 'green', class: okLinkClass  },
  { type: 'start-end', fromIndex: 15, toIndex: 12, color: 'red' },
  { type: 'start-end', fromIndex: 15, toIndex: 13, color: 'green', class: okLinkClass  },
  { type: 'start-end', fromIndex: 15, toIndex: 14, color: 'green', class: okLinkClass  },
  { type: 'end-start', fromIndex: 11, toIndex: 14, color: 'red' },
  { type: 'start-start', fromIndex: 16, toIndex: 17, color: 'blue' },
  { type: 'end-end', fromIndex: 17, toIndex: 16, color: 'blue' },
  //{ type: 'start-start', fromIndex: 10, toIndex: 11, color: 'rgb(37 99 235)' },
  //{ type: 'start-end', fromIndex: 12, toIndex: 13, color: 'rgb(217 119 6)' },
  //{ type: 'end-start', fromIndex: 14, toIndex: 1, color: 'rgb(5 150 105)' },
  //{ type: 'end-end', fromIndex: 16, toIndex: 17, color: 'rgb(220 38 38)' },
] satisfies Array<{
  type: NonNullable<GanttChartLinkData['type']>
  fromIndex: number
  toIndex: number
  color?: string
  class?: string
}>
// Custom-placed activities to test activity links
const optimizedOnlyStartOffsets = [3, 12, 9, 6, 15, 3, 12, 9, 6, 15, 3, 9, 13, 6, 10, 16, 8, 8]

const rows = computed<GanttChartRowData[]>(() =>
  Array.from({ length: 30 }, (_, index) => {
    const startDay = optimizedOnlyStartOffsets[index] ?? (index * 3) % 28
    const baseDate = new Date(2026, 0, 1 + startDay)
    const optimizedActivity: GanttChartActivityData = {
      id: `optimized-${index}`,
      label: t('demo.playground.optimized'),
      startDate: new Date(2026, 0, 3 + startDay),
      endDate: new Date(2026, 0, 9 + startDay),
      visualType: 'bar',
      fillClass: 'bg-emerald-400/80',
      fillSegments:
        index === 0
          ? [
              {
                startDate: new Date(2026, 0, 3 + startDay),
                endDate: new Date(2026, 0, 3 + startDay),
                class: 'bg-emerald-500/90',
              },
              {
                startDate: new Date(2026, 0, 4 + startDay),
                endDate: new Date(2026, 0, 5 + startDay),
                class:
                  'bg-[repeating-linear-gradient(135deg,rgb(16_185_129)_0_6px,rgb(59_130_246)_6px_12px)]',
              },
              {
                startDate: new Date(2026, 0, 6 + startDay),
                endDate: new Date(2026, 0, 6 + startDay),
                class: 'bg-blue-500/90',
              },
            ]
          : undefined,
    }

    if (index < optimizedOnlyStartOffsets.length) {
      return {
        id: index,
        label: t('demo.playground.row_label', { n: index + 1 }),
        header: t('demo.playground.row_header', { n: index + 1 }),
        activities: [
          {
            ...optimizedActivity,
            label: t('demo.playground.activity_links_tester'),
            startDate: new Date(2026, 0, 3 + startDay),
            endDate: new Date(2026, 0, 6 + startDay),
          },
        ],
      }
    }

    const baseActivities: GanttChartActivityData[] = [
      {
        id: `planned-${index}`,
        label: t('demo.playground.planned'),
        startDate: new Date(baseDate),
        endDate: new Date(2026, 0, 6 + startDay),
        visualType: 'stripe',
        fillStyle: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
      },
      optimizedActivity,
      {
        id: `desired-${index}`,
        label: t('demo.playground.desired'),
        startDate: new Date(2026, 0, 5 + startDay),
        endDate: new Date(2026, 0, 12 + startDay),
        visualType: 'mini',
        fillClass: 'bg-amber-400/80',
      },
    ]
    const extraActivities: GanttChartActivityData[] =
      index % 3 === 0
        ? [
            {
              id: `desired-2-${index}`,
              label: t('demo.playground.alt'),
              startDate: new Date(2026, 0, 7 + startDay),
              endDate: new Date(2026, 0, 10 + startDay),
              visualType: 'mini',
              fillClass: 'bg-amber-500/80',
            },
          ]
        : []

    return {
      id: index,
      label: t('demo.playground.row_label', { n: index + 1 }),
      header: t('demo.playground.row_header', { n: index + 1 }),
      activities: [...baseActivities, ...extraActivities],
    }
  })
)

const links = computed<GanttChartLinkData[]>(() => {
  const linkPairs: GanttChartLinkData[] = []
  linkCases.forEach((linkCase) => {
    const from = rows.value[linkCase.fromIndex]?.activities.find(
      (activity) => activity.id === `optimized-${linkCase.fromIndex}`
    )
    const to = rows.value[linkCase.toIndex]?.activities.find(
      (activity) => activity.id === `optimized-${linkCase.toIndex}`
    )
    if (from?.id && to?.id) {
      linkPairs.push({
        id: linkCase.type,
        fromId: from.id,
        toId: to.id,
        type: linkCase.type,
        color: linkCase.color,
        class: linkCase.class,
      })
    }
  })
  return linkPairs
})

const hoverDebug = ref(t('demo.playground.hover_prompt'))

const hoverLabel = (hoverContext?: GanttChartActivityInteractionContext) => {
  if (!hoverContext) {
    return t('demo.playground.no_hover_context')
  }

  if (hoverContext.date) {
    return hoverContext.date.toLocaleDateString()
  }

  return hoverContext.week
    ? t('demo.playground.week', { n: hoverContext.week.weekNumber })
    : t('demo.playground.column', { n: hoverContext.columnIndex + 1 })
}

const activityHover = (
  activity: GanttChartActivityData,
  rowData?: GanttChartRowData,
  hoverContext?: GanttChartActivityInteractionContext
) => {
  if (!hoverContext) {
    hoverDebug.value = t('demo.playground.hover_prompt')
    return
  }

  hoverDebug.value = [
    `row=${rowData?.header ?? rowData?.label ?? 'unknown'}`,
    `activity=${activity.label ?? activity.id ?? 'unknown'}`,
    `column=${hoverContext.columnIndex}`,
    `value=${hoverLabel(hoverContext)}`,
  ].join(' | ')
}
</script>
