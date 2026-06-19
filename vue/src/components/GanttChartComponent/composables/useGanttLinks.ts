import { computed, type Ref } from 'vue'
import {
  BAR_VERTICAL_PADDING_PX,
  BASE_ROW_HEIGHT_PX,
  MINI_GAP_PX,
  MINI_HEIGHT_PX,
  computeMiniLanes,
  getActivitySpanPx,
  getBarSpacingOffsets,
  type WeekColumn,
} from '@/components/GanttChartComponent/ganttChartLayout'
import type {
  GanttChartActivityData,
  GanttChartLinkData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

type GanttListItem = { data: GanttChartRowData; index: number }
type GanttLinkEndpoint = 'start' | 'end'
type GanttPoint = { x: number; y: number }
type GanttActivityPosition = {
  startX: number
  endX: number
  y: number
  visualType: GanttChartActivityData['visualType']
}
type GanttLinkRouteParams = {
  from: GanttActivityPosition
  to: GanttActivityPosition
  fromEndpoint: GanttLinkEndpoint
  toEndpoint: GanttLinkEndpoint
  fromX: number
  toX: number
  fromOffsetX: number
  toOffsetX: number
  maneuveringOffsetY: number
}

export interface GanttLinkLayer {
  id: string | number
  markerId: string
  fromId: string | number
  toId: string | number
  path: string
  color: string
  layer: 'base' | 'mini'
}

const sourceEndpoint = (linkType: GanttChartLinkData['type']): GanttLinkEndpoint =>
  linkType?.startsWith('start-') ? 'start' : 'end'

const targetEndpoint = (linkType: GanttChartLinkData['type']): GanttLinkEndpoint =>
  linkType?.endsWith('-end') ? 'end' : 'start'

const sourceEndpointX = (
  endpoint: GanttLinkEndpoint,
  position: { startX: number; endX: number }
) => (endpoint === 'start' ? position.startX : position.endX)

const targetEndpointX = (
  endpoint: GanttLinkEndpoint,
  position: { startX: number; endX: number }
) => (endpoint === 'end' ? position.endX : position.startX)

const addStartStartRoutePoints = (points: GanttPoint[], params: GanttLinkRouteParams) => {
  if (params.toX > params.fromX) {
    points.push({ x: params.fromOffsetX, y: params.to.y })
  }
  if (params.toX < params.fromX) {
    points.push({ x: params.toOffsetX, y: params.from.y })
  }
}

const addEndEndRoutePoints = (points: GanttPoint[], params: GanttLinkRouteParams) => {
  if (params.toX > params.fromX) {
    points.push({ x: params.toOffsetX, y: params.from.y })
  }
  if (params.toX < params.fromX) {
    points.push({ x: params.fromOffsetX, y: params.to.y })
  }
}

const addForwardEndStartRoutePoints = (points: GanttPoint[], params: GanttLinkRouteParams) => {
  if (params.fromOffsetX < params.toOffsetX) {
    points.push({ x: params.fromOffsetX, y: params.to.y })
  }
}

const addCrossingRoutePoints = (points: GanttPoint[], params: GanttLinkRouteParams) => {
  const verticalDirection = Math.sign(params.to.y - params.from.y)
  if (verticalDirection === 0) {
    return
  }

  points.push(
    {
      x: params.fromOffsetX,
      y: params.from.y + params.maneuveringOffsetY * verticalDirection,
    },
    {
      x: params.fromOffsetX,
      y: params.to.y - params.maneuveringOffsetY * verticalDirection,
    },
    {
      x: params.toOffsetX,
      y: params.to.y - params.maneuveringOffsetY * verticalDirection,
    }
  )
}

const addEndStartRoutePoints = (points: GanttPoint[], params: GanttLinkRouteParams) => {
  addForwardEndStartRoutePoints(points, params)
  if (params.fromOffsetX >= params.toOffsetX) {
    addCrossingRoutePoints(points, params)
  }
}

const addStartEndRoutePoints = (points: GanttPoint[], params: GanttLinkRouteParams) => {
  if (params.fromOffsetX > params.toOffsetX) {
    points.push({ x: params.toOffsetX, y: params.from.y })
    return
  }

  addCrossingRoutePoints(points, params)
}

const routeLinkPoints = (params: GanttLinkRouteParams) => {
  const points: GanttPoint[] = [
    { x: params.fromX, y: params.from.y },
    { x: params.fromOffsetX, y: params.from.y },
  ]
  const linkTypeKey = `${params.fromEndpoint}-${params.toEndpoint}` as
    | 'start-start'
    | 'end-end'
    | 'start-end'
    | 'end-start'

  switch (linkTypeKey) {
    case 'start-start':
      addStartStartRoutePoints(points, params)
      break
    case 'end-end':
      addEndEndRoutePoints(points, params)
      break
    case 'end-start':
      addEndStartRoutePoints(points, params)
      break
    case 'start-end':
      addStartEndRoutePoints(points, params)
      break
  }

  points.push({ x: params.toOffsetX, y: params.to.y }, { x: params.toX, y: params.to.y })

  return points
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
    const positions = new Map<string | number, GanttActivityPosition>()

    for (const item of list.value) {
      const rowIndex = item.index
      const row = item.data
      const rowHeight = rowHeights.value[rowIndex] ?? BASE_ROW_HEIGHT_PX
      const rowTop = (rowOffsets.value[rowIndex] ?? 0) - virtualOffsetPx.value
      const miniLayout = computeMiniLanes(row.activities, stackMiniActivities.value, viewMode.value)
      const barSpacingTopPx = getBarSpacingOffsets(row.activities).topPx
      const resolvedBarHeightPx = Math.max(
        0,
        rowHeight - BAR_VERTICAL_PADDING_PX * 2 - barSpacingTopPx
      )

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
        } else if (activity.visualType !== 'background' && activity.visualType !== 'stripe') {
          y =
            rowTop +
            BAR_VERTICAL_PADDING_PX +
            (activity.barOffsetTopPx ?? 0) +
            resolvedBarHeightPx / 2
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

    links.value.forEach((link, index) => {
      const from = visibleActivityPositions.value.get(link.fromId)
      const to = visibleActivityPositions.value.get(link.toId)
      if (!from || !to) {
        return
      }

      // From and to connection points
      const fromEndpoint = sourceEndpoint(link.type) // 'start' or 'end'
      const toEndpoint = targetEndpoint(link.type) // 'start' or 'end'
      const fromX = sourceEndpointX(fromEndpoint, from)
      const toX = targetEndpointX(toEndpoint, to)

      // Connection points offsets,
      const maneuveringOffsetX = columnWidthPx.value / 2 //px
      const maneuveringOffsetY = Math.min(MINI_HEIGHT_PX, Math.abs(from.y - to.y) / 2)
      const fromOffsetDirection = fromEndpoint === 'start' ? -1 : 1
      const fromOffsetX = fromX + maneuveringOffsetX * fromOffsetDirection
      const toOffsetDirection = toEndpoint === 'start' ? -1 : 1
      const toOffsetX = toX + maneuveringOffsetX * toOffsetDirection

      const points = routeLinkPoints({
        from,
        to,
        fromEndpoint,
        toEndpoint,
        fromX,
        toX,
        fromOffsetX,
        toOffsetX,
        maneuveringOffsetY,
      })

      const path = roundedPath(points, 4)
      const isMiniLink = from.visualType === 'mini' || to.visualType === 'mini'

      paths.push({
        id: link.id ?? `${link.fromId}-${link.toId}`,
        markerId: `gantt-link-arrow-${isMiniLink ? 'mini' : 'base'}-${index}`,
        fromId: link.fromId,
        toId: link.toId,
        path,
        color: link.color ?? 'black',
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
