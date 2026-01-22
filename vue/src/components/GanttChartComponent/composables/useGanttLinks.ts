import { computed, type Ref } from 'vue'
import {
  BAR_VERTICAL_PADDING_PX,
  BASE_ROW_HEIGHT_PX,
  MINI_GAP_PX,
  MINI_HEIGHT_PX,
  computeMiniLanes,
  getActivitySpanPx,
  type WeekColumn,
} from '@/components/GanttChartComponent/ganttChartLayout'
import type {
  GanttChartActivityData,
  GanttChartLinkData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

type GanttListItem = { data: GanttChartRowData; index: number }

export interface GanttLinkLayer {
  id: string | number
  path: string
  color: string
  layer: 'base' | 'mini'
}

// Composable for computing and managing Gantt chart links between activities.
export const useGanttLinks = ({
  list,
  rowHeights,
  rowOffsets,
  dateRange,
  viewMode,
  columnWidthPx,
  weekColumns,
  links,
  stackMiniActivities,
}: {
  list: Ref<GanttListItem[]>
  rowHeights: Ref<number[]>
  rowOffsets: Ref<number[]>
  dateRange: Ref<Date[]>
  viewMode: Ref<'day' | 'week'>
  columnWidthPx: Ref<number>
  weekColumns: Ref<WeekColumn[]>
  links: Ref<GanttChartLinkData[]>
  stackMiniActivities: Ref<boolean>
}) => {
  // Computes the vertical offset in pixels of the virtual list.
  const virtualOffsetPx = computed(() => {
    const firstVisibleIndex = list.value[0]?.index
    if (firstVisibleIndex === undefined) {
      return 0
    }

    return rowOffsets.value[firstVisibleIndex] ?? 0
  })

  // Computes the positions of visible activities in the Gantt chart.
  const visibleActivityPositions = computed(() => {
    const positions = new Map<
      string | number,
      { startX: number; endX: number; y: number; visualType: GanttChartActivityData['visualType'] }
    >()

    for (const item of list.value) {
      const rowIndex = item.index
      const row = item.data
      const rowHeight = rowHeights.value[rowIndex] ?? BASE_ROW_HEIGHT_PX
      const rowTop = (rowOffsets.value[rowIndex] ?? 0) - virtualOffsetPx.value
      const miniLayout = computeMiniLanes(row.activities, stackMiniActivities.value, viewMode.value)

      for (const activity of row.activities) {
        if (activity.id === undefined || activity.id === null) {
          continue
        }

        const span = getActivitySpanPx(
          activity,
          dateRange.value,
          viewMode.value,
          columnWidthPx.value,
          weekColumns.value
        )
        const startX = span.left
        const endX = span.left + span.width
        let y = rowTop + rowHeight / 2

        if (activity.visualType === 'mini') {
          const lane = miniLayout.lanes.find((item) => item.activity === activity)?.laneIndex ?? 0
          const laneCount = miniLayout.laneCount
          const stackHeight = laneCount * MINI_HEIGHT_PX + (laneCount - 1) * MINI_GAP_PX
          const topStart = Math.max(BAR_VERTICAL_PADDING_PX, (rowHeight - stackHeight) / 2)
          y = rowTop + topStart + lane * (MINI_HEIGHT_PX + MINI_GAP_PX) + MINI_HEIGHT_PX / 2
        }

        positions.set(activity.id, { startX, endX, y, visualType: activity.visualType })
      }
    }

    return positions
  })

  // Generates a rounded SVG path from a series of points. Used for link paths' corners.
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

  // Computes the SVG path data for each link between activities.
  const linkPaths = computed(() => {
    const paths: GanttLinkLayer[] = []

    links.value.forEach((link) => {
      const from = visibleActivityPositions.value.get(link.fromId)
      const to = visibleActivityPositions.value.get(link.toId)
      if (!from || !to) {
        return
      }

      const startX = link.type === 'start-start' ? from.startX : from.endX
      const endX = to.startX
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

      paths.push({
        id: link.id ?? `${link.fromId}-${link.toId}`,
        path,
        color: link.color ?? 'rgba(100, 116, 139, 0.8)',
        layer: isMiniLink ? 'mini' : 'base',
      })
    })

    return paths
  })

  // Separates link paths into base and mini layers for rendering order.
  const linkLayers = computed(() => ({
    base: linkPaths.value.filter((link) => link.layer === 'base'),
    mini: linkPaths.value.filter((link) => link.layer === 'mini'),
  }))

  return {
    virtualOffsetPx,
    visibleActivityPositions,
    linkLayers,
  }
}
