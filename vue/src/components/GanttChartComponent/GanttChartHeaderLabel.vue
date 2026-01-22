<template>
  <div class="flex flex-row sticky top-0 z-60 bg-surface-0 h-full">
    <div
      class="left-0 flex shrink-0 sticky z-60 justify-center items-center box-border border-r border-b border-surface-200 bg-surface-50 text-surface-900 font-semibold h-full"
      :style="{ width: `${leftHeaderWidthPx}px` }"
    >
      {{ t(headerLabel) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nLib } from '@/locales'

export interface GanttChartHeaderLabelProps {
  headerLabel?: string
  leftHeaderWidthPx?: number
}

const { headerLabel = 'gantt_chart.header', leftHeaderWidthPx = 320 } =
  defineProps<GanttChartHeaderLabelProps>()
const { t } = useI18nLib()
</script>
