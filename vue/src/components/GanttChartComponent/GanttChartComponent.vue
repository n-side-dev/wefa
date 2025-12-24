<template>
  <div ref="gantt-container" class="w-full h-full p-2 bg-surface-50">
    <div class="rounded-2xl overflow-hidden border border-surface-200 bg-surface-0 shadow-sm">
      <div class="flex flex-col w-full overflow-hidden justify-start p-0" :style="cardStyle">
        <div class="w-full overflow-x-auto overflow-y-hidden">
          <div class="min-w-fit w-full">
            <div ref="gantt-header" class="w-full">
              <GanttChartHeader
                :date-range="props.dateRange"
                :view-mode="props.viewMode"
                :header-label="props.headerLabel"
              />
            </div>
            <div
              v-bind="containerProps"
              class="w-full overflow-y-auto overflow-x-visible"
              :style="{ height: `${bodyHeightPx}px` }"
            >
              <div id="fb" class="min-w-fit w-full shrink-0" v-bind="wrapperProps">
                <div class="relative z-10">
                  <svg
                    class="absolute inset-y-0 pointer-events-none z-10"
                    :style="{ left: `${leftHeaderWidthPx}px` }"
                    :width="gridWidthPx"
                    :height="virtualHeightPx"
                    :viewBox="`0 0 ${gridWidthPx} ${virtualHeightPx}`"
                  >
                    <defs>
                      <clipPath id="gantt-link-clip">
                        <rect x="0" y="0" :width="gridWidthPx" :height="virtualHeightPx" />
                      </clipPath>
                      <marker
                        v-for="link in linkLayers.base"
                        :id="`gantt-link-arrow-${link.id}`"
                        :key="`marker-${link.id}`"
                        markerWidth="6"
                        markerHeight="6"
                        refX="6"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path
                          d="M 0 0 L 6 3 L 0 6 z"
                          :fill="link.color"
                          :stroke="link.color"
                        />
                      </marker>
                    </defs>
                    <g clip-path="url(#gantt-link-clip)">
                      <path
                        v-for="link in linkLayers.base"
                        :key="link.id"
                        :data-link-id="link.id"
                        :d="link.path"
                        :stroke="link.color"
                        stroke-width="2.5"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :marker-end="`url(#gantt-link-arrow-${link.id})`"
                      />
                    </g>
                  </svg>
                  <svg
                    class="absolute inset-y-0 pointer-events-none"
                    :style="{ left: `${leftHeaderWidthPx}px`, zIndex: 25 }"
                    :width="gridWidthPx"
                    :height="virtualHeightPx"
                    :viewBox="`0 0 ${gridWidthPx} ${virtualHeightPx}`"
                  >
                    <defs>
                      <clipPath id="gantt-link-clip-mini">
                        <rect x="0" y="0" :width="gridWidthPx" :height="virtualHeightPx" />
                      </clipPath>
                      <marker
                        v-for="link in linkLayers.mini"
                        :id="`gantt-link-arrow-mini-${link.id}`"
                        :key="`marker-mini-${link.id}`"
                        markerWidth="6"
                        markerHeight="6"
                        refX="6"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path
                          d="M 0 0 L 6 3 L 0 6 z"
                          :fill="link.color"
                          :stroke="link.color"
                        />
                      </marker>
                    </defs>
                    <g clip-path="url(#gantt-link-clip-mini)">
                      <path
                        v-for="link in linkLayers.mini"
                        :key="`mini-${link.id}`"
                        :data-link-id="link.id"
                        :d="link.path"
                        :stroke="link.color"
                        stroke-width="2.5"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :marker-end="`url(#gantt-link-arrow-mini-${link.id})`"
                      />
                    </g>
                  </svg>
                  <div class="relative">
                    <GanttChartRow
                      v-for="(item, idx) in list"
                      :key="item.data.id ?? idx"
                      :date-range="props.dateRange"
                      :activities="item.data.activities"
                      :row-data="item.data"
                      :row-label="item.data.header ?? item.data.label"
                      :row-height-px="rowHeights[item.index]"
                      :view-mode="props.viewMode"
                      :show-weekend-shading="props.showWeekendShading"
                      :stack-mini-activities="props.stackMiniActivities"
                      :activity-tooltip="props.activityTooltip"
                      @activity-click="handleActivityClick"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useVirtualList, useResizeObserver } from '@vueuse/core'

import GanttChartHeader from '@/components/GanttChartComponent/GanttChartHeader.vue'
import GanttChartRow from '@/components/GanttChartComponent/GanttChartRow.vue'
import {
  BAR_VERTICAL_PADDING_PX,
  BASE_ROW_HEIGHT_PX,
  DAY_CELL_WIDTH_PX,
  MINI_GAP_PX,
  MINI_HEIGHT_PX,
  WEEK_CELL_WIDTH_PX,
  computeMiniLanes,
  getActivitySpanPx,
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
const containerHeight = ref(0) // Starts with a computed height of 0
const headerHeight = ref(0)

// Each time the window is resized, we reflect the update in the virtual renderer to adapt it
useResizeObserver(container, (entries) => {
  const entry = entries[0]
  const { height } = entry!.contentRect
  containerHeight.value = height
})
useResizeObserver(header, (entries) => {
  const entry = entries[0]
  const { height } = entry!.contentRect
  headerHeight.value = height
})

// Assign the outer container base height to the virtual renderer
onMounted(() => {
  containerHeight.value = container!.value!.offsetHeight
  headerHeight.value = header!.value!.offsetHeight
})

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

// Keep link overlay aligned with the fixed-width row headers.
const leftHeaderWidthPx = 320
const isWeekView = computed(() => props.viewMode === 'week')
const columnWidthPx = computed(() => (isWeekView.value ? WEEK_CELL_WIDTH_PX : DAY_CELL_WIDTH_PX))
const weekColumns = computed(() => {
  if (props.dateRange.length === 0) {
    return []
  }

  return getWeekColumns(props.dateRange[0]!, props.dateRange[props.dateRange.length - 1]!)
})
const rowHeights = computed(() =>
  props.rows.map((row) => getRowHeight(row.activities, props.stackMiniActivities))
)
// Accumulate row offsets so links can be drawn in a single SVG overlay.
const rowOffsets = computed(() => {
  const offsets: number[] = []
  let current = 0

  props.rows.forEach((row, index) => {
    offsets[index] = current
    current += rowHeights.value[index] ?? BASE_ROW_HEIGHT_PX
  })

  return offsets
})
const virtualOffsetPx = computed(() => {
  const firstVisibleIndex = list.value[0]?.index
  if (firstVisibleIndex === undefined) {
    return 0
  }

  return rowOffsets.value[firstVisibleIndex] ?? 0
})
const totalHeightPx = computed(() => {
  const lastIndex = props.rows.length - 1
  if (lastIndex < 0) {
    return 0
  }

  return (rowOffsets.value[lastIndex] ?? 0) + (rowHeights.value[lastIndex] ?? 0)
})
const virtualHeightPx = computed(() =>
  Math.max(0, totalHeightPx.value - virtualOffsetPx.value)
)
const cardStyle = computed(() => ({
  height: `${containerHeight.value}px`,
}))
const bodyHeightPx = computed(() => Math.max(0, containerHeight.value - headerHeight.value))
const gridWidthPx = computed(() => {
  const count = isWeekView.value ? weekColumns.value.length : props.dateRange.length
  return count * columnWidthPx.value
})
// Only map activities in the rendered virtual rows (no ghost links).
const visibleActivityPositions = computed(() => {
  const positions = new Map<
    string | number,
    { startX: number; endX: number; y: number; visualType: GanttChartActivityData['visualType'] }
  >()

  list.value.forEach((item) => {
    const rowIndex = item.index
    const row = item.data
    const rowHeight = rowHeights.value[rowIndex] ?? BASE_ROW_HEIGHT_PX
    const rowTop = (rowOffsets.value[rowIndex] ?? 0) - virtualOffsetPx.value
    const miniLayout = computeMiniLanes(row.activities, props.stackMiniActivities)

    row.activities.forEach((activity) => {
      if (activity.id === undefined || activity.id === null) {
        return
      }

      const span = getActivitySpanPx(
        activity,
        props.dateRange,
        props.viewMode ?? 'day',
        columnWidthPx.value,
        weekColumns.value
      )
      const startX = span.left
      const endX = span.left + span.width
      let y = rowTop + rowHeight / 2

      if (activity.visualType === 'mini') {
        // Align to the mini lane center so stacked minis connect cleanly.
        const lane = miniLayout.lanes.find((item) => item.activity === activity)?.laneIndex ?? 0
        const laneCount = miniLayout.laneCount
        const stackHeight = laneCount * MINI_HEIGHT_PX + (laneCount - 1) * MINI_GAP_PX
        const topStart = Math.max(BAR_VERTICAL_PADDING_PX, (rowHeight - stackHeight) / 2)
        y = rowTop + topStart + lane * (MINI_HEIGHT_PX + MINI_GAP_PX) + MINI_HEIGHT_PX / 2
      }

      positions.set(activity.id, { startX, endX, y, visualType: activity.visualType })
    })
  })

  return positions
})
const roundedPath = (points: Array<{ x: number; y: number }>, radius: number) => {
  if (points.length < 2) {
    return ''
  }

  let d = `M ${points[0]!.x} ${points[0]!.y}`

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const next = points[i + 1]
    if (!next) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const v1x = curr.x - prev.x
    const v1y = curr.y - prev.y
    const v2x = next.x - curr.x
    const v2y = next.y - curr.y
    const isCorner = (v1x !== 0 && v2y !== 0) || (v1y !== 0 && v2x !== 0)

    if (!isCorner) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const len1 = Math.abs(v1x) + Math.abs(v1y)
    const len2 = Math.abs(v2x) + Math.abs(v2y)
    const r = Math.min(radius, len1 / 2, len2 / 2)
    const p1x = curr.x - Math.sign(v1x) * r
    const p1y = curr.y - Math.sign(v1y) * r
    const p2x = curr.x + Math.sign(v2x) * r
    const p2y = curr.y + Math.sign(v2y) * r

    d += ` L ${p1x} ${p1y} Q ${curr.x} ${curr.y} ${p2x} ${p2y}`
  }

  return d
}
// Convert link definitions into SVG link paths with rightward entry/exit.
const linkPaths = computed(() =>
  props.links
    .map((link) => {
      const from = visibleActivityPositions.value.get(link.fromId)
      const to = visibleActivityPositions.value.get(link.toId)
      if (!from || !to) {
        return null
      }

      const useStart = link.type === 'start-start'
      const startX = useStart ? from.startX : from.endX
      const endX = useStart ? to.startX : to.startX
      const isBackward = endX < startX
      const gap = Math.abs(endX - startX)
      const bend = Math.min(28, Math.max(10, gap / 2))
      const startOutX = startX + bend
      const endInX = endX - bend
      const midY = from.y + (to.y - from.y) / 2
      const points: Array<{ x: number; y: number }> = []

      if (isBackward) {
        const loopX = startX + bend + 16
        points.push(
          { x: startX, y: from.y },
          { x: loopX, y: from.y },
          { x: loopX, y: midY },
          { x: endInX, y: midY },
          { x: endInX, y: to.y },
          { x: endX, y: to.y }
        )
      } else {
        points.push(
          { x: startX, y: from.y },
          { x: startOutX, y: from.y },
          { x: startOutX, y: midY },
          { x: endInX, y: midY },
          { x: endInX, y: to.y },
          { x: endX, y: to.y }
        )
      }

      const path = roundedPath(points, 6)
      const isMiniLink = from.visualType === 'mini' || to.visualType === 'mini'

      return {
        id: link.id ?? `${link.fromId}-${link.toId}`,
        path,
        color: link.color ?? 'rgba(100, 116, 139, 0.8)',
        layer: isMiniLink ? 'mini' : 'base',
      }
    })
    .filter(
      (
        link
      ): link is { id: string | number; path: string; color: string; layer: 'base' | 'mini' } =>
        Boolean(link)
    )
)
const linkLayers = computed(() => ({
  base: linkPaths.value.filter((link) => link.layer === 'base'),
  mini: linkPaths.value.filter((link) => link.layer === 'mini'),
}))

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => props.rows),
  {
    itemHeight: (index) => rowHeights.value.at(index) ?? BASE_ROW_HEIGHT_PX,
  }
)
</script>
