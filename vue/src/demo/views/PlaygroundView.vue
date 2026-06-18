<template>
  <div class="flex size-full flex-col gap-3">
    <div
      class="shrink-0 rounded border border-surface-200 bg-surface-0 p-3 text-sm text-surface-700"
    >
      {{ hoverDebug }}
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
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()

const startDate = new Date(2026, 0, 1)
const endDate = new Date(2026, 1, 28)

const rows = computed<GanttChartRowData[]>(() =>
  Array.from({ length: 30 }, (_, index) => {
    const startDay = (index * 3) % 28
    const baseDate = new Date(2026, 0, 1 + startDay)
    const baseActivities: GanttChartActivityData[] = [
      {
        id: `planned-${index}`,
        label: t('demo.playground.planned'),
        startDate: new Date(baseDate),
        endDate: new Date(2026, 0, 6 + startDay),
        visualType: 'stripe',
        color: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: `optimized-${index}`,
        label: t('demo.playground.optimized'),
        startDate: new Date(2026, 0, 3 + startDay),
        endDate: new Date(2026, 0, 9 + startDay),
        visualType: 'bar',
        colorClass: 'bg-emerald-400/80',
      },
      {
        id: `desired-${index}`,
        label: t('demo.playground.desired'),
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
              label: t('demo.playground.alt'),
              startDate: new Date(2026, 0, 7 + startDay),
              endDate: new Date(2026, 0, 10 + startDay),
              visualType: 'mini',
              colorClass: 'bg-amber-500/80',
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

const links = computed(() => {
  const linkPairs = []
  for (let index = 0; index < rows.value.length - 1; index += 4) {
    const from = rows.value[index]?.activities.find((activity) => activity.visualType === 'bar')
    const to = rows.value[index + 1]?.activities.find((activity) => activity.visualType === 'bar')
    if (from?.id && to?.id) {
      linkPairs.push({ fromId: from.id, toId: to.id })
    }
  }
  return linkPairs
})

const hoverDebug = ref('Hover an activity to inspect its column context.')

const hoverLabel = (hoverContext?: GanttChartActivityInteractionContext) => {
  if (!hoverContext) {
    return 'no hover context'
  }

  if (hoverContext.date) {
    return hoverContext.date.toLocaleDateString()
  }

  return hoverContext.week
    ? `Week ${hoverContext.week.weekNumber}`
    : `Column ${hoverContext.columnIndex + 1}`
}

const activityHover = (
  activity: GanttChartActivityData,
  rowData?: GanttChartRowData,
  hoverContext?: GanttChartActivityInteractionContext
) => {
  if (!hoverContext) {
    hoverDebug.value = 'Hover an activity to inspect its column context.'
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
