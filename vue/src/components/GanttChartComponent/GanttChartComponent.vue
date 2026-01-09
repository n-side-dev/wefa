<template>
  <div ref="gantt-container" class="w-full h-full p-2 bg-surface-50">
    <GanttChartGrid
      :card-style="cardStyle"
      :body-height-px="bodyHeightPx"
      :container-props="containerProps"
      :wrapper-props="wrapperProps"
      :left-header-width-px="props.leftHeaderWidthPx"
    >
      <template #header-left>
        <div class="w-full">
          <GanttChartHeader
            :date-range="props.dateRange"
            :view-mode="viewMode"
            :header-label="props.headerLabel"
            :left-header-width-px="props.leftHeaderWidthPx"
            :show-grid="false"
          />
        </div>
      </template>
      <template #header-right>
        <div ref="gantt-header" class="w-full">
          <GanttChartHeader
            :date-range="props.dateRange"
            :view-mode="viewMode"
            :header-label="props.headerLabel"
            :left-header-width-px="props.leftHeaderWidthPx"
            :show-left-header="false"
          />
        </div>
      </template>
      <template #overlay>
        <GanttChartLinksOverlay
          :link-layers="linkLayers"
          :grid-width-px="gridWidthPx"
          :virtual-height-px="virtualHeightPx"
          :left-header-width-px="0"
        />
      </template>
      <template #body-left>
        <GanttChartRowsList
          :list="list"
          :row-heights="rowHeights"
          :date-range="props.dateRange"
          :view-mode="viewMode"
          :show-weekend-shading="props.showWeekendShading"
          :stack-mini-activities="props.stackMiniActivities"
          :activity-tooltip="props.activityTooltip"
          :left-header-width-px="props.leftHeaderWidthPx"
          mode="labels"
        />
      </template>
      <template #body-right>
        <GanttChartRowsList
          :list="list"
          :row-heights="rowHeights"
          :date-range="props.dateRange"
          :view-mode="viewMode"
          :show-weekend-shading="props.showWeekendShading"
          :stack-mini-activities="props.stackMiniActivities"
          :activity-tooltip="props.activityTooltip"
          :left-header-width-px="props.leftHeaderWidthPx"
          mode="grid"
          @activity-click="handleActivityClick"
        />
      </template>
    </GanttChartGrid>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useVirtualList } from '@vueuse/core'

import GanttChartGrid from '@/components/GanttChartComponent/GanttChartGrid.vue'
import GanttChartHeader from '@/components/GanttChartComponent/GanttChartHeader.vue'
import GanttChartLinksOverlay from '@/components/GanttChartComponent/GanttChartLinksOverlay.vue'
import GanttChartRowsList from '@/components/GanttChartComponent/GanttChartRowsList.vue'
import { useGanttSizing } from '@/components/GanttChartComponent/composables/useGanttSizing'
import { useGanttLinks } from '@/components/GanttChartComponent/composables/useGanttLinks'
import {
  BASE_ROW_HEIGHT_PX,
  DAY_CELL_WIDTH_PX,
  WEEK_CELL_WIDTH_PX,
  getRowHeight,
  getWeekColumns,
} from '@/components/GanttChartComponent/ganttChartLayout'
import type {
  GanttChartActivityData,
  GanttChartLinkData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

const container = useTemplateRef('gantt-container')
const header = useTemplateRef('gantt-header')
const { bodyHeightPx, cardStyle } = useGanttSizing(container, header)

type ActivityRow = GanttChartRowData
type ActivityTooltip = (activity: GanttChartActivityData, rowData?: ActivityRow) => string
type ActivityClickHandler = (activity: GanttChartActivityData, rowData?: ActivityRow) => void

interface GanttChartComponentProps {
  dateRange?: Date[]
  rows?: ActivityRow[]
  links?: GanttChartLinkData[]
  headerLabel?: string
  viewMode?: 'day' | 'week'
  showWeekendShading?: boolean
  stackMiniActivities?: boolean
  activityTooltip?: ActivityTooltip
  activityClick?: ActivityClickHandler
  leftHeaderWidthPx?: number
}

const props = withDefaults(defineProps<GanttChartComponentProps>(), {
  dateRange: () => [],
  rows: () => [],
  links: () => [],
  headerLabel: 'gantt_chart.header',
  viewMode: 'day',
  showWeekendShading: true,
  stackMiniActivities: true,
  activityTooltip: undefined,
  activityClick: undefined,
  leftHeaderWidthPx: 320,
})

const emit = defineEmits<{
  (event: 'activityClick', activity: ActivityRow['activities'][number], rowData: ActivityRow): void
}>()

const handleActivityClick = (
  activity: ActivityRow['activities'][number],
  rowData?: ActivityRow
) => {
  if (!rowData) {
    return
  }

  props.activityClick?.(activity, rowData)
  emit('activityClick', activity, rowData)
}

const viewMode = computed(() => props.viewMode ?? 'day')
const isWeekView = computed(() => viewMode.value === 'week')
const columnWidthPx = computed(() => (isWeekView.value ? WEEK_CELL_WIDTH_PX : DAY_CELL_WIDTH_PX))
const weekColumns = computed(() => {
  if (props.dateRange.length === 0) {
    return []
  }

  return getWeekColumns(props.dateRange[0]!, props.dateRange[props.dateRange.length - 1]!)
})
const rowHeights = computed(() =>
  props.rows.map((row) => getRowHeight(row.activities, props.stackMiniActivities, viewMode.value))
)
// Accumulate row offsets so links can be drawn in a single SVG overlay.
const rowOffsets = computed(() => {
  const offsets: number[] = []
  let current: number = 0

  props.rows.forEach((row, index) => {
    offsets[index] = current
    current += rowHeights.value[index] ?? BASE_ROW_HEIGHT_PX
  })

  return offsets
})
const totalHeightPx = computed(() => {
  const lastIndex = props.rows.length - 1
  if (lastIndex < 0) {
    return 0
  }

  const lastOffset = rowOffsets.value[lastIndex] ?? 0
  const lastHeight = rowHeights.value[lastIndex] ?? 0
  return lastOffset + lastHeight
})
const gridWidthPx = computed(() => {
  const count = isWeekView.value ? weekColumns.value.length : props.dateRange.length
  return count * columnWidthPx.value
})
const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => props.rows),
  {
    itemHeight: (index) => rowHeights.value.at(index) ?? BASE_ROW_HEIGHT_PX,
  }
)

const { virtualOffsetPx, linkLayers } = useGanttLinks({
  list,
  rowHeights,
  rowOffsets,
  dateRange: computed(() => props.dateRange),
  viewMode,
  columnWidthPx,
  weekColumns,
  links: computed(() => props.links),
  stackMiniActivities: computed(() => props.stackMiniActivities),
})

const virtualHeightPx = computed(() => Math.max(0, totalHeightPx.value - virtualOffsetPx.value))
</script>
