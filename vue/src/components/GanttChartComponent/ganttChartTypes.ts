import type { WeekColumn } from '@/components/GanttChartComponent/ganttChartLayout'

export type GanttChartActivityData = {
  id?: string | number
  label?: string
  startDate: Date
  endDate: Date
  visualType?: 'background' | 'stripe' | 'bar' | 'mini'
  color?: string
  colorClass?: string
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
  type?: 'finish-start' | 'start-start'
  color?: string
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
