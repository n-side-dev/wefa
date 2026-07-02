<template>
  <div class="flex flex-row w-full group relative" :style="{ height: `${resolvedRowHeightPx}px` }">
    <div
      class="left-0 p-0 flex shrink-0 sticky z-50 justify-center items-center box-border border-b border-r border-surface-200 text-surface-900 font-medium"
      :class="rowLabelClass"
      :style="{ width: `${leftHeaderWidthPx}px` }"
    >
      {{ t(rowLabel ?? 'gantt_chart.row') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18nLib } from '@/locales'
import { BASE_ROW_HEIGHT_PX } from '@/components/GanttChartComponent/ganttChartLayout'

export interface GanttChartRowLabelProps {
  rowLabel?: string
  rowHeightPx?: number
  leftHeaderWidthPx?: number
  highlighted?: boolean
  hoverHighlightClass?: string
  selected?: boolean
  selectedHighlightClass?: string
}

const { t } = useI18nLib()

const {
  rowLabel = 'Row',
  rowHeightPx = undefined,
  leftHeaderWidthPx = 320,
  highlighted = false,
  hoverHighlightClass = 'bg-primary-50/60',
  selected = false,
  selectedHighlightClass = 'bg-primary-100/80',
} = defineProps<GanttChartRowLabelProps>()

const resolvedRowHeightPx = computed(() => rowHeightPx ?? BASE_ROW_HEIGHT_PX)
const rowLabelClass = computed(() => {
  if (highlighted) {
    return hoverHighlightClass
  }

  return selected ? selectedHighlightClass : 'bg-surface-0'
})
</script>
