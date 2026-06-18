<template>
  <div ref="gantt-container" class="w-full h-full">
    <div
      v-if="hasActivityPopover && isActivityPopoverVisible && activityPopoverState"
      ref="activity-popover-panel"
      class="fixed z-[70] rounded border border-surface-200 bg-surface-0 p-2 text-surface-700 shadow-md"
      :style="activityPopoverStyle"
      role="tooltip"
      @mouseenter="keepActivityPopoverOpen"
      @mouseleave="leaveActivityPopover"
    >
      <slot
        name="activity-popover"
        :activity="activityPopoverState.activity"
        :row-data="activityPopoverState.rowData"
        :hover-context="activityPopoverState.context"
        :interaction="activityPopoverState"
      />
    </div>
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
          <GanttChartHeaderGrid
            :date-range="dateRange"
            :view-mode="viewMode"
            :hovered-column-index="highlightHoveredColumn ? hoveredColumnIndex : undefined"
            :hover-highlight-class="hoverHighlightClass"
            :selected-column-index="
              highlightSelectedInteraction
                ? effectiveSelectedInteraction?.context.columnIndex
                : undefined
            "
            :selected-highlight-class="selectedHighlightClass"
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
        <template v-for="(item, idx) in list" :key="item.data.id ?? idx">
          <slot
            name="row-label"
            :row-data="item.data"
            :row-index="item.index"
            :row-height-px="rowHeights[item.index]"
            :left-header-width-px="leftHeaderWidthPx"
            :highlighted="highlightHoveredRow && rowKey(item.data, item.index) === hoveredRowKey"
            :hover-highlight-class="hoverHighlightClass"
            :selected="
              highlightSelectedInteraction &&
              rowKey(item.data, item.index) === effectiveSelectedInteraction?.rowKey
            "
            :selected-highlight-class="selectedHighlightClass"
          >
            <GanttChartRowLabel
              :row-label="item.data.header ?? item.data.label"
              :row-height-px="rowHeights[item.index]"
              :left-header-width-px="leftHeaderWidthPx"
              :highlighted="highlightHoveredRow && rowKey(item.data, item.index) === hoveredRowKey"
              :hover-highlight-class="hoverHighlightClass"
              :selected="
                highlightSelectedInteraction &&
                rowKey(item.data, item.index) === effectiveSelectedInteraction?.rowKey
              "
              :selected-highlight-class="selectedHighlightClass"
            />
          </slot>
        </template>
      </template>
      <template #body-right>
        <GanttChartRowGrid
          v-for="(item, idx) in list"
          :key="item.data.id ?? `grid-${idx}`"
          :date-range="dateRange"
          :activities="item.data.activities"
          :row-data="item.data"
          :row-index="item.index"
          :row-height-px="rowHeights[item.index]"
          :view-mode="viewMode"
          :show-weekend-shading="showWeekendShading"
          :stack-mini-activities="stackMiniActivities"
          :activity-tooltip="activityTooltip"
          :activity-hover="handleActivityHover"
          :use-activity-tooltip="!hasActivityPopover"
          :highlighted-cell-column-index="
            highlightHoveredRow &&
            highlightHoveredColumn &&
            rowKey(item.data, item.index) === hoveredRowKey
              ? hoveredColumnIndex
              : undefined
          "
          :hover-highlight-class="hoverHighlightClass"
          :selected-cell-column-index="
            highlightSelectedInteraction &&
            rowKey(item.data, item.index) === effectiveSelectedInteraction?.rowKey
              ? effectiveSelectedInteraction?.context.columnIndex
              : undefined
          "
          :selected-highlight-class="selectedHighlightClass"
          @activity-click="handleActivityClick"
        />
      </template>
    </GanttChartGrid>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, useTemplateRef } from 'vue'
import { useResizeObserver, useVirtualList } from '@vueuse/core'

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
  GanttChartActivityInteractionContext,
  GanttChartActivityInteractionPayload,
  GanttChartActivityData,
  GanttChartLinkData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

const container = useTemplateRef('gantt-container')
const header = useTemplateRef('gantt-header')
const activityPopoverPanel = useTemplateRef('activity-popover-panel')
const { bodyHeightPx, cardStyle } = useGanttSizing(container, header)
const slots = useSlots()

type ActivityRow = GanttChartRowData
type ActivityTooltip = (
  activity: GanttChartActivityData,
  rowData?: ActivityRow,
  hoverContext?: GanttChartActivityInteractionContext
) => string
type ActivityClickHandler = (activity: GanttChartActivityData, rowData?: ActivityRow) => void
type ActivityHoverHandler = (
  activity: GanttChartActivityData,
  rowData?: ActivityRow,
  hoverContext?: GanttChartActivityInteractionContext,
  payload?: GanttChartActivityInteractionPayload
) => void
type ActivitySelectHandler = (payload: GanttChartActivityInteractionPayload | null) => void

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
  activityHover?: ActivityHoverHandler
  activitySelect?: ActivitySelectHandler
  selectedInteraction?: GanttChartActivityInteractionPayload | null
  activityPopoverShowDelayMs?: number
  activityPopoverHideDelayMs?: number
  highlightHoveredRow?: boolean
  highlightHoveredColumn?: boolean
  hoverHighlightClass?: string
  highlightSelectedInteraction?: boolean
  selectedHighlightClass?: string
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
  activityHover = undefined,
  activitySelect = undefined,
  selectedInteraction = undefined,
  activityPopoverShowDelayMs = 200,
  activityPopoverHideDelayMs = 500,
  highlightHoveredRow = true,
  highlightHoveredColumn = true,
  hoverHighlightClass = 'bg-primary-700/10',
  highlightSelectedInteraction = true,
  selectedHighlightClass = 'bg-primary-100/80',
  leftHeaderWidthPx = 320,
} = defineProps<GanttChartComponentProps>()

const emit = defineEmits<{
  (event: 'activityClick', activity: ActivityRow['activities'][number], rowData: ActivityRow): void
  (event: 'activitySelect', payload: GanttChartActivityInteractionPayload | null): void
  (event: 'update:selectedInteraction', payload: GanttChartActivityInteractionPayload | null): void
}>()

const hasActivityPopover = computed(() => Boolean(slots['activity-popover']))
const activityPopoverState = ref<GanttChartActivityInteractionPayload>()
const internalSelectedInteraction = ref<GanttChartActivityInteractionPayload | null>(null)
const isActivityPopoverVisible = ref(false)
const activityPopoverSize = ref({ width: 0, height: 0 })
const activityPopoverBounds = ref({ left: 0, top: 0, right: 0, bottom: 0 })
const isActivityPopoverHovered = ref(false)
const activityPopoverShowTimeout = ref<ReturnType<typeof setTimeout>>()
const activityPopoverClearTimeout = ref<ReturnType<typeof setTimeout>>()
const hoveredRowKey = ref<string | number>()
const hoveredColumnIndex = ref<number>()
const effectiveSelectedInteraction = computed(() =>
  selectedInteraction === undefined ? internalSelectedInteraction.value : selectedInteraction
)

const activityPopoverStyle = computed(() => {
  const hoverContext = activityPopoverState.value?.context
  if (!hoverContext) {
    return {}
  }

  const gutterPx = 8
  const bounds = activityPopoverBounds.value
  const fallbackRight =
    typeof document === 'undefined'
      ? Number.POSITIVE_INFINITY
      : document.documentElement.clientWidth
  const fallbackBottom =
    typeof document === 'undefined'
      ? Number.POSITIVE_INFINITY
      : document.documentElement.clientHeight
  const minLeft = bounds.right > bounds.left ? bounds.left + gutterPx : gutterPx
  const maxRight = bounds.right > bounds.left ? bounds.right - gutterPx : fallbackRight - gutterPx
  const minTop = bounds.bottom > bounds.top ? bounds.top + gutterPx : gutterPx
  const maxBottom =
    bounds.bottom > bounds.top ? bounds.bottom - gutterPx : fallbackBottom - gutterPx
  const width = activityPopoverSize.value.width
  const height = activityPopoverSize.value.height
  const anchorX = hoverContext.anchorClientX ?? 0
  const anchorY = hoverContext.anchorClientY ?? 0
  const left = Math.max(minLeft, Math.min(anchorX - width / 2, maxRight - width))
  const preferredTop = anchorY - height - gutterPx
  const fallbackTop = anchorY + gutterPx
  const top =
    preferredTop >= minTop
      ? preferredTop
      : Math.max(minTop, Math.min(fallbackTop, maxBottom - height))

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

const handleActivityClick = (
  activity: ActivityRow['activities'][number],
  rowData?: ActivityRow,
  payload?: GanttChartActivityInteractionPayload
) => {
  if (!rowData) {
    return
  }

  activityClick?.(activity, rowData)
  emit('activityClick', activity, rowData)

  if (payload) {
    selectActivityInteraction(payload)
  }
}

const handleActivityHover = (
  activity: ActivityRow['activities'][number],
  rowData?: ActivityRow,
  hoverContext?: GanttChartActivityInteractionContext,
  payload?: GanttChartActivityInteractionPayload
) => {
  activityHover?.(activity, rowData, hoverContext, payload)

  if (hoverContext) {
    hoveredRowKey.value = rowData ? rowKey(rowData) : undefined
    hoveredColumnIndex.value = hoverContext.columnIndex
  } else {
    hoveredRowKey.value = undefined
    hoveredColumnIndex.value = undefined
  }

  if (!hasActivityPopover.value) {
    return
  }

  if (!hoverContext) {
    scheduleActivityPopoverClear()
    return
  }

  if (payload) {
    scheduleActivityPopoverShow(payload)
  }
}

const rowKey = (rowData: ActivityRow, rowIndex?: number) =>
  rowData.id ?? rowIndex ?? rows.indexOf(rowData)

const showActivityPopover = (payload: GanttChartActivityInteractionPayload) => {
  cancelActivityPopoverClear()
  isActivityPopoverHovered.value = false
  activityPopoverState.value = payload
  isActivityPopoverVisible.value = true
  updateActivityPopoverBounds()
  void nextTick(updateActivityPopoverSize)
}

const scheduleActivityPopoverShow = (payload: GanttChartActivityInteractionPayload) => {
  cancelActivityPopoverShow()
  cancelActivityPopoverClear()

  if (isActivityPopoverVisible.value) {
    showActivityPopover(payload)
    return
  }

  if (activityPopoverShowDelayMs <= 0) {
    showActivityPopover(payload)
    return
  }

  activityPopoverShowTimeout.value = setTimeout(() => {
    showActivityPopover(payload)
  }, activityPopoverShowDelayMs)
}

const selectActivityInteraction = (payload: GanttChartActivityInteractionPayload) => {
  if (selectedInteraction === undefined) {
    internalSelectedInteraction.value = payload
  }

  activitySelect?.(payload)
  emit('activitySelect', payload)
  emit('update:selectedInteraction', payload)
}

const keepActivityPopoverOpen = () => {
  cancelActivityPopoverShow()
  cancelActivityPopoverClear()
  isActivityPopoverHovered.value = true
}

const leaveActivityPopover = () => {
  isActivityPopoverHovered.value = false
  scheduleActivityPopoverClear()
}

const scheduleActivityPopoverClear = () => {
  cancelActivityPopoverShow()
  cancelActivityPopoverClear()

  if (activityPopoverHideDelayMs <= 0) {
    if (!isActivityPopoverHovered.value) {
      isActivityPopoverVisible.value = false
    }
    return
  }

  activityPopoverClearTimeout.value = setTimeout(() => {
    if (!isActivityPopoverHovered.value) {
      isActivityPopoverVisible.value = false
    }
    activityPopoverClearTimeout.value = undefined
  }, activityPopoverHideDelayMs)
}

const cancelActivityPopoverShow = () => {
  if (activityPopoverShowTimeout.value) {
    clearTimeout(activityPopoverShowTimeout.value)
    activityPopoverShowTimeout.value = undefined
  }
}

const cancelActivityPopoverClear = () => {
  if (activityPopoverClearTimeout.value) {
    clearTimeout(activityPopoverClearTimeout.value)
    activityPopoverClearTimeout.value = undefined
  }
}

onBeforeUnmount(() => {
  cancelActivityPopoverShow()
  cancelActivityPopoverClear()
})

const updateActivityPopoverSize = () => {
  const panel = activityPopoverPanel.value
  if (!panel) {
    return
  }

  activityPopoverSize.value = {
    width: panel.offsetWidth,
    height: panel.offsetHeight,
  }
}

useResizeObserver(activityPopoverPanel, updateActivityPopoverSize)

const updateActivityPopoverBounds = () => {
  const rect = container.value?.getBoundingClientRect()
  if (!rect) {
    return
  }

  const headerRect = header.value?.getBoundingClientRect()

  activityPopoverBounds.value = {
    left: rect.left + leftHeaderWidthPx,
    top: headerRect?.bottom ?? rect.top,
    right: rect.right,
    bottom: rect.bottom,
  }
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
