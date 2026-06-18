<template>
  <button
    class="flex flex-col items-center justify-center gap-1 overflow-hidden rounded border border-surface-300 bg-primary-50 p-2 text-center text-[10px] font-semibold text-primary-700 transition-[width,height]"
    :style="{ width: `${sizePx}px`, height: `${sizePx}px` }"
    type="button"
    @click="toggleSize"
  >
    <span>{{ sizePx }}px</span>
    <span class="max-w-full truncate"
      >row={{ props.rowData?.header ?? props.rowData?.label ?? 'unknown' }}</span
    >
    <span class="max-w-full truncate"
      >activity={{ props.activity.label ?? props.activity.id ?? 'unknown' }}</span
    >
    <span>column={{ props.hoverContext.columnIndex }}</span>
    <span class="max-w-full truncate">{{ hoverLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  GanttChartActivityInteractionContext,
  GanttChartActivityData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

const props = withDefaults(
  defineProps<{
    activity: GanttChartActivityData
    rowData?: GanttChartRowData
    hoverContext: GanttChartActivityInteractionContext
  }>(),
  {
    rowData: undefined,
  }
)

const MIN_SIZE_PX = 100
const MAX_SIZE_PX = 400

const sizePx = ref(MIN_SIZE_PX)

const hoverLabel = computed(() => {
  if (props.hoverContext.date) {
    return props.hoverContext.date.toLocaleDateString()
  }

  return props.hoverContext.week
    ? `Week ${props.hoverContext.week.weekNumber}`
    : `Column ${props.hoverContext.columnIndex + 1}`
})

const toggleSize = () => {
  sizePx.value = sizePx.value === MIN_SIZE_PX ? MAX_SIZE_PX : MIN_SIZE_PX
}
</script>
