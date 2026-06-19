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
          :highlighted-link-marker-ids="effectiveHighlightedLinkMarkerIds"
          :link-class="linkClass"
          :link-highlight-class="linkHighlightClass"
          :grid-width-px="gridWidthPx"
          :virtual-height-px="virtualHeightPx"
          :left-header-width-px="0"
          @link-pointer-enter="handleLinkPointerEnter"
          @link-pointer-leave="handleLinkPointerLeave"
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
          :highlighted-activity-ids="effectiveHighlightedActivityIds"
          :activity-highlight-class="activityHighlightClass"
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
import {
  useGanttLinks,
  type GanttLinkLayer,
} from '@/components/GanttChartComponent/composables/useGanttLinks'
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
  /** First visible date in the Gantt grid. */
  startDate?: Date
  /** Last visible date in the Gantt grid. */
  endDate?: Date
  /** Row data rendered by the Gantt body. */
  rows?: ActivityRow[]
  /** Activity dependency links rendered as SVG paths over the grid. */
  links?: GanttChartLinkData[]
  /** Translation key or label rendered in the top-left header cell. */
  headerLabel?: string
  /** Calendar granularity used for columns and activity spans. */
  viewMode?: 'day' | 'week'
  /** Enables weekend background shading in day view. */
  showWeekendShading?: boolean
  /** Stacks overlapping mini activities into separate vertical lanes. */
  stackMiniActivities?: boolean
  /** Returns PrimeVue tooltip text for an activity when no popover slot is used. */
  activityTooltip?: ActivityTooltip
  /** Called when an activity is clicked, before selection toggling is applied. */
  activityClick?: ActivityClickHandler
  /** Called on direct activity hover with activity, row, cell context, and payload. */
  activityHover?: ActivityHoverHandler
  /** Called when activity selection changes; receives null when selection is cleared. */
  activitySelect?: ActivitySelectHandler
  /** Controlled selected activity/cell interaction. Use v-model:selected-interaction. */
  selectedInteraction?: GanttChartActivityInteractionPayload | null
  /** Delay before showing the custom activity popover after direct activity hover. */
  activityPopoverShowDelayMs?: number
  /** Delay before hiding the custom activity popover after activity/popover leave. */
  activityPopoverHideDelayMs?: number
  /** Highlights the row header for the directly hovered activity row. */
  highlightHoveredRow?: boolean
  /** Highlights the column header and cell for the directly hovered activity cell. */
  highlightHoveredColumn?: boolean
  /** Class applied to hovered row/column/cell background highlights. */
  hoverHighlightClass?: string
  /** Activity ids to highlight programmatically without selecting or opening popovers. */
  highlightedActivityIds?: Array<string | number>
  /** Link ids to highlight programmatically without selecting or opening popovers. */
  highlightedLinkIds?: Array<string | number>
  /** Class applied to highlighted activities from hover, selection, link hover, or props. */
  activityHighlightClass?: string
  /** Class applied to links in their normal, non-highlighted state. */
  linkClass?: string
  /** Class applied to highlighted links from hover, selection, or props. */
  linkHighlightClass?: string
  /** Highlights the selected row header, column header, and cell background. */
  highlightSelectedInteraction?: boolean
  /** Class applied to selected row/column/cell background highlights. */
  selectedHighlightClass?: string
  /** Width of the sticky row-label column in pixels. */
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
  highlightedActivityIds = [],
  highlightedLinkIds = [],
  activityHighlightClass = 'ring-2 ring-primary-500/70 brightness-110',
  linkClass = 'opacity-70 transition-opacity',
  linkHighlightClass = 'opacity-100 [stroke-width:4]',
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
const hoveredActivityId = ref<string | number>()
const hoveredLink = ref<GanttLinkLayer>()
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
    hoveredActivityId.value = payload?.activityKey
  } else {
    hoveredRowKey.value = undefined
    hoveredColumnIndex.value = undefined
    hoveredActivityId.value = undefined
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
  const nextSelection = isSameActivityInteraction(effectiveSelectedInteraction.value, payload)
    ? null
    : payload

  if (selectedInteraction === undefined) {
    internalSelectedInteraction.value = nextSelection
  }

  activitySelect?.(nextSelection)
  emit('activitySelect', nextSelection)
  emit('update:selectedInteraction', nextSelection)
}

const isSameActivityInteraction = (
  current: GanttChartActivityInteractionPayload | null | undefined,
  next: GanttChartActivityInteractionPayload
) => {
  if (!current) {
    return false
  }

  const currentDateMs = current.context.date?.getTime()
  const nextDateMs = next.context.date?.getTime()

  return (
    current.activityKey === next.activityKey &&
    current.rowKey === next.rowKey &&
    current.context.columnIndex === next.context.columnIndex &&
    current.context.viewMode === next.context.viewMode &&
    currentDateMs === nextDateMs &&
    current.context.week?.weekYear === next.context.week?.weekYear &&
    current.context.week?.weekNumber === next.context.week?.weekNumber
  )
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

const allLinkLayers = computed(() => [...linkLayers.value.base, ...linkLayers.value.mini])
const linkMatchesActivity = (link: GanttLinkLayer, activityId: string | number) =>
  link.fromId === activityId || link.toId === activityId
const selectedActivityId = computed(() => effectiveSelectedInteraction.value?.activityKey)

const effectiveHighlightedActivityIds = computed(() => {
  const ids = new Set<string | number>(highlightedActivityIds)

  if (hoveredActivityId.value !== undefined) {
    ids.add(hoveredActivityId.value)
  }
  if (selectedActivityId.value !== undefined) {
    ids.add(selectedActivityId.value)
  }

  const link = hoveredLink.value
  if (link) {
    ids.add(link.fromId)
    ids.add(link.toId)
  }

  return [...ids]
})

const effectiveHighlightedLinkMarkerIds = computed(() => {
  const markerIds = new Set<string>()
  const externalHighlightedIds = new Set<string | number>(highlightedLinkIds)
  const activityId = hoveredActivityId.value
  const selectedId = selectedActivityId.value
  const hoveredLinkMarkerId = hoveredLink.value?.markerId

  allLinkLayers.value.forEach((link) => {
    if (externalHighlightedIds.has(link.id)) {
      markerIds.add(link.markerId)
    }
    if (activityId !== undefined && linkMatchesActivity(link, activityId)) {
      markerIds.add(link.markerId)
    }
    if (selectedId !== undefined && linkMatchesActivity(link, selectedId)) {
      markerIds.add(link.markerId)
    }
    if (hoveredLinkMarkerId === link.markerId) {
      markerIds.add(link.markerId)
    }
  })

  return [...markerIds]
})

const handleLinkPointerEnter = (link: GanttLinkLayer) => {
  hoveredLink.value = link
}

const handleLinkPointerLeave = (link: GanttLinkLayer) => {
  if (hoveredLink.value?.markerId === link.markerId) {
    hoveredLink.value = undefined
  }
}

const virtualHeightPx = computed(() => Math.max(0, totalHeightPx.value - virtualOffsetPx.value))
</script>
