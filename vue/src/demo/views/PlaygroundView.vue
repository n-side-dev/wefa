<template>
  <GanttChartComponent :date-range="dateRange" :rows="rows" header-label="gantt_chart.header" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GanttChartComponent } from '@/components/GanttChartComponent'
import type {
  GanttChartActivityData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

const dateRange = computed<Date[]>(() => {
  const dates = []
  const currentDate = new Date(2026, 0, 1)
  const endDate = new Date(2026, 1, 28)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
})

const rows = computed<GanttChartRowData[]>(() =>
  Array.from({ length: 30 }, (_, index) => {
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
)
</script>
