export type GanttChartActivityData = {
  id?: string | number
  label?: string
  startDate: Date
  endDate: Date
  visualType?: 'stripe' | 'bar' | 'mini'
  color?: string
  colorClass?: string
}

export type GanttChartRowData = {
  id?: string | number
  label?: string
  header?: string
  activities: GanttChartActivityData[]
}
