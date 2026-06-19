import type { WeekColumn } from '@/components/GanttChartComponent/ganttChartLayout'

export type GanttChartActivityFillSegment = {
  startDate: Date
  endDate: Date
  class?: string
  style?: Record<string, string>
}

export type GanttChartActivityData = {
  id?: string | number
  label?: string
  startDate: Date
  endDate: Date
  visualType?: 'background' | 'stripe' | 'bar' | 'mini'
  class?: string
  style?: Record<string, string>
  fillClass?: string
  fillStyle?: Record<string, string>
  fillSegments?: GanttChartActivityFillSegment[]
  barOffsetTopPx?: number
}

export type GanttChartRowData = {
  id?: string | number
  label?: string
  header?: string
  activities: GanttChartActivityData[]
}

export type GanttChartLinkData = {
  id?: string | number
  fromId: string | number
  toId: string | number
  type?: 'start-start' | 'start-end' | 'end-start' | 'end-end' | 'finish-start'
  color?: string
  class?: string
}

// Shared activity interaction shape used by hover, popover, and selection APIs.
export type GanttChartActivityInteractionContext = {
  columnIndex: number
  viewMode: 'day' | 'week'
  // Day view exposes the concrete date. Week view exposes the computed week column.
  date?: Date
  week?: WeekColumn
  // Client coordinates are intended for floating UI anchoring, not data identity.
  anchorClientX?: number
  anchorClientY?: number
}

export type GanttChartActivityInteractionPayload = {
  activity: GanttChartActivityData
  rowData?: GanttChartRowData
  rowIndex?: number
  rowKey?: string | number
  activityKey?: string | number
  context: GanttChartActivityInteractionContext
}
