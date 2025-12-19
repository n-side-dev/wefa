<template>
  <div class="flex flex-row w-full group" :style="{ height: `${ROW_HEIGHT_PX}px` }">
    <div
      class="left-0 p-0 w-80 flex shrink-0 sticky z-5 justify-center items-center box-border border border-gray-300 bg-white group-hover:bg-blue-50"
    >
      Header
    </div>
    <div
      class="box-border border border-gray-300 bg-white group-hover:bg-blue-50"
      :style="gridStyle"
    >
      Content
    </div>
  </div>
</template>

<script setup lang="ts">
export interface GanttChartRowProps {
  dateRange: Date[]
}

const { dateRange } = defineProps<GanttChartRowProps>()

import { computed } from 'vue'
import { DateTime } from 'luxon'

const ROW_HEIGHT_PX = 30
const DAY_CELL_WIDTH_PX = 40 // match Tailwind w-10 (2.5rem) at base 16px
const WEEK_DAYS = 7

const lineWidth = computed(() => {
  return `${dateRange.length * DAY_CELL_WIDTH_PX}px`
})

const weekPattern = computed(() => {
  const base = dateRange[0] ? DateTime.fromJSDate(dateRange[0]).startOf('week') : DateTime.now().startOf('week')
  const stops = Array.from({ length: WEEK_DAYS }, (_, index) => {
    const day = base.plus({ days: index })
    const color = day.isWeekend ? 'rgb(243 244 246)' : 'transparent'
    const start = index * DAY_CELL_WIDTH_PX
    const end = (index + 1) * DAY_CELL_WIDTH_PX
    return `${color} ${start}px ${end}px`
  })

  return `linear-gradient(90deg, ${stops.join(', ')})`
})

const gridStyle = computed(() => {
  const firstDate = dateRange[0]
  const weekStart = firstDate ? DateTime.fromJSDate(firstDate).startOf('week') : DateTime.now().startOf('week')
  const offsetDays = firstDate ? Math.floor(DateTime.fromJSDate(firstDate).diff(weekStart, 'days').days) : 0
  const offsetPx = offsetDays * DAY_CELL_WIDTH_PX
  const gridLines = `repeating-linear-gradient(90deg, transparent 0, transparent ${
    DAY_CELL_WIDTH_PX - 1
  }px, rgb(229 231 235) ${DAY_CELL_WIDTH_PX - 1}px, rgb(229 231 235) ${DAY_CELL_WIDTH_PX}px)`

  return {
    width: lineWidth.value,
    backgroundImage: `${gridLines}, ${weekPattern.value}`,
    backgroundSize: `${DAY_CELL_WIDTH_PX}px 100%, ${DAY_CELL_WIDTH_PX * WEEK_DAYS}px 100%`,
    backgroundPosition: `0 0, -${offsetPx}px 0`,
    backgroundRepeat: 'repeat-x, repeat-x',
  }
})
</script>
