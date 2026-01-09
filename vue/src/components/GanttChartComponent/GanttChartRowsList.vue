<template>
  <GanttChartRow
    v-for="(item, idx) in props.list"
    :key="item.data.id ?? idx"
    :date-range="props.dateRange"
    :activities="item.data.activities"
    :row-data="item.data"
    :row-label="item.data.header ?? item.data.label"
    :row-height-px="props.rowHeights[item.index]"
    :view-mode="props.viewMode"
    :show-weekend-shading="props.showWeekendShading"
    :stack-mini-activities="props.stackMiniActivities"
    :activity-tooltip="props.activityTooltip"
    :left-header-width-px="props.leftHeaderWidthPx"
    :show-row-label="props.mode === 'labels'"
    :show-grid="props.mode === 'grid'"
    @activity-click="handleActivityClick"
  />
</template>

<script setup lang="ts">
import GanttChartRow from '@/components/GanttChartComponent/GanttChartRow.vue'
import type {
  GanttChartActivityData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'
import type { GanttChartViewMode } from '@/components/GanttChartComponent/ganttChartLayout'

type ActivityTooltip = (activity: GanttChartActivityData, rowData?: GanttChartRowData) => string
type ActivityClickHandler = (activity: GanttChartActivityData, rowData?: GanttChartRowData) => void

export interface GanttChartRowsListProps {
  list: Array<{ data: GanttChartRowData; index: number }>
  rowHeights: number[]
  dateRange: Date[]
  viewMode: GanttChartViewMode
  showWeekendShading: boolean
  stackMiniActivities: boolean
  activityTooltip?: ActivityTooltip
  leftHeaderWidthPx: number
  mode: 'labels' | 'grid'
}

const props = defineProps<GanttChartRowsListProps>()

const emit = defineEmits<{
  (event: 'activityClick', activity: GanttChartActivityData, rowData?: GanttChartRowData): void
}>()

const handleActivityClick: ActivityClickHandler = (activity, rowData) => {
  emit('activityClick', activity, rowData)
}
</script>
