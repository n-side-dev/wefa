<template>
  <div ref="gantt-container" class="w-full h-full p-2 bg-surface-50">
    <GanttChartGrid
      :card-style="cardStyle"
      :body-height-px="bodyHeightPx"
      :container-props="containerProps"
      :wrapper-props="wrapperProps"
      :left-header-width-px="leftHeaderWidthPx"
    >
      <template #header-left>
        <div class="w-full">
          <GanttChartHeaderLabel
            :header-label="headerLabel"
            :left-header-width-px="leftHeaderWidthPx"
          />
        </div>
      </template>
      <template #header-right>
        <div ref="gantt-header" class="w-full">
          <GanttChartHeaderGrid :date-range="dateRange" :view-mode="viewMode" />
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
        <GanttChartRowLabel
          v-for="(item, idx) in list"
          :key="item.data.id ?? idx"
          :row-label="item.data.header ?? item.data.label"
          :row-height-px="rowHeights[item.index]"
          :left-header-width-px="leftHeaderWidthPx"
        />
      </template>
      <template #body-right>
        <GanttChartRowGrid
          v-for="(item, idx) in list"
          :key="item.data.id ?? `grid-${idx}`"
          :date-range="dateRange"
          :activities="item.data.activities"
          :row-data="item.data"
          :row-height-px="rowHeights[item.index]"
          :view-mode="viewMode"
          :show-weekend-shading="showWeekendShading"
          :stack-mini-activities="stackMiniActivities"
          :activity-tooltip="activityTooltip"
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
import GanttChartHeaderGrid from '@/components/GanttChartComponent/GanttChartHeaderGrid.vue'
import GanttChartHeaderLabel from '@/components/GanttChartComponent/GanttChartHeaderLabel.vue'
import GanttChartLinksOverlay from '@/components/GanttChartComponent/GanttChartLinksOverlay.vue'
import GanttChartRowGrid from '@/components/GanttChartComponent/GanttChartRowGrid.vue'
import GanttChartRowLabel from '@/components/GanttChartComponent/GanttChartRowLabel.vue'
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
  startDate?: Date
  endDate?: Date
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

const {
  startDate = undefined,
  endDate = undefined,
  rows = [],
  links = [],
  headerLabel = 'gantt_chart.header',
  viewMode: viewModeProp = 'day',
  showWeekendShading = true,
  stackMiniActivities = true,
  activityTooltip = undefined,
  activityClick = undefined,
  leftHeaderWidthPx = 320,
} = defineProps<GanttChartComponentProps>()

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

  activityClick?.(activity, rowData)
  emit('activityClick', activity, rowData)
}

const buildDateRange = (startDate?: Date, endDate?: Date) => {
  if (!startDate || !endDate) {
    return []
  }

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  if (end < start) {
    return []
  }

  const dates: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const viewMode = computed(() => viewModeProp)
const dateRange = computed(() => buildDateRange(startDate, endDate))
const isWeekView = computed(() => viewMode.value === 'week')
const columnWidthPx = computed(() => (isWeekView.value ? WEEK_CELL_WIDTH_PX : DAY_CELL_WIDTH_PX))
const weekColumns = computed(() => {
  if (dateRange.value.length === 0) {
    return []
  }

  return getWeekColumns(dateRange.value[0]!, dateRange.value[dateRange.value.length - 1]!)
})
const rowHeights = computed(() =>
  rows.map((row) => getRowHeight(row.activities, stackMiniActivities, viewMode.value))
)
// Accumulate row offsets so links can be drawn in a single SVG overlay.
const rowOffsets = computed(() => {
  const offsets: number[] = []
  let current: number = 0

  rows.forEach((row, index) => {
    offsets[index] = current
    current += rowHeights.value[index] ?? BASE_ROW_HEIGHT_PX
  })

  return offsets
})
const totalHeightPx = computed(() => {
  const lastIndex = rows.length - 1
  if (lastIndex < 0) {
    return 0
  }

  const lastOffset = rowOffsets.value[lastIndex] ?? 0
  const lastHeight = rowHeights.value[lastIndex] ?? 0
  return lastOffset + lastHeight
})
const gridWidthPx = computed(() => {
  const count = isWeekView.value ? weekColumns.value.length : dateRange.value.length
  return count * columnWidthPx.value
})
const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => rows),
  {
    itemHeight: (index) => rowHeights.value.at(index) ?? BASE_ROW_HEIGHT_PX,
  }
)

const { virtualOffsetPx, linkLayers } = useGanttLinks({
  list,
  rowHeights,
  rowOffsets,
  dateRange,
  viewMode,
  columnWidthPx,
  weekColumns,
  links: computed(() => links),
  stackMiniActivities: computed(() => stackMiniActivities),
})

const virtualHeightPx = computed(() => Math.max(0, totalHeightPx.value - virtualOffsetPx.value))
</script>
