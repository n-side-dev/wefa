<template>
  <div class="flex flex-row w-full" :style="{ height: `${ROW_HEIGHT_PX}px` }">
    <div
      class="left-0 p-0 w-80 flex shrink-0 sticky z-5 justify-center items-center box-border border border-gray-300 bg-gray-100"
    >
      Header
    </div>
    <div class="box-border border border-gray-300" :style="`width: ${lineWidth}`">Content</div>
  </div>
</template>

<script setup lang="ts">
export interface GanttChartRowProps {
  dateRange: Date[]
}

const { dateRange } = defineProps<GanttChartRowProps>()

import { computed } from 'vue'

const ROW_HEIGHT_PX = 30
const DAY_CELL_WIDTH_PX = 40 // match Tailwind w-10 (2.5rem) at base 16px

const lineWidth = computed(() => {
  return `${dateRange.length * DAY_CELL_WIDTH_PX}px`
})
</script>
