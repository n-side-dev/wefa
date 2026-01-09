import { DateTime } from 'luxon'

export type GanttChartActivityType = 'stripe' | 'bar' | 'mini'
export type GanttChartViewMode = 'day' | 'week'

export type GanttChartActivityLike = {
  startDate: Date
  endDate: Date
  visualType?: GanttChartActivityType
}

export type MiniLaneItem<T extends GanttChartActivityLike> = {
  activity: T
  laneIndex: number
}

export type WeekColumn = {
  start: Date
  end: Date
  weekYear: number
  weekNumber: number
}

export type MonthSpan = {
  year: number
  month: number
  label: string
  startIndex: number
  endIndex: number
}

// Pixel width for a single day column in day view.
export const DAY_CELL_WIDTH_PX = 40
// Pixel width for a single week column in week view.
export const WEEK_CELL_WIDTH_PX = 40
// Default row height before mini stacking expands it.
export const BASE_ROW_HEIGHT_PX = 30
// Vertical padding to keep bar activities off row edges.
export const BAR_VERTICAL_PADDING_PX = 4
// Height of mini activities (stacked lanes).
export const MINI_HEIGHT_PX = 12
// Gap between stacked mini activity lanes.
export const MINI_GAP_PX = 2
// Stripe thickness for the diagonal pattern.
export const STRIPE_SIZE_PX = 8

// Computes mini activity lane assignments (height index) and total lane count.
// If stacking is disabled, all mini activities are assigned to lane 0.
// Uses a greedy algorithm to minimize lane count while avoiding overlaps if stacking is enabled.
export const computeMiniLanes = <T extends GanttChartActivityLike>(
  activities: T[],
  stackMiniActivities: boolean,
  viewMode: GanttChartViewMode = 'day'
): { lanes: MiniLaneItem<T>[]; laneCount: number } => {
  const minis = activities.filter((activity) => (activity.visualType ?? 'bar') === 'mini')

  if (minis.length === 0) {
    return { lanes: [], laneCount: 1 }
  }

  if (!stackMiniActivities) {
    return { lanes: minis.map((activity) => ({ activity, laneIndex: 0 })), laneCount: 1 }
  }

  const normalizeStart = (activity: T) =>
    DateTime.fromJSDate(activity.startDate)
      .startOf(viewMode === 'week' ? 'week' : 'day')
      .toMillis()
  const normalizeEnd = (activity: T) =>
    DateTime.fromJSDate(activity.endDate)
      .startOf(viewMode === 'week' ? 'week' : 'day')
      .toMillis()

  const sorted = [...minis].sort((a, b) => normalizeStart(a) - normalizeStart(b))
  const laneEnds: number[] = []
  const lanes: MiniLaneItem<T>[] = []

  // Greedy lane assignment keeps mini bars vertically compact while avoiding overlaps.
  sorted.forEach((activity) => {
    const startMs = normalizeStart(activity)
    const endMs = normalizeEnd(activity)
    let laneIndex = laneEnds.findIndex((laneEnd) => startMs > laneEnd)

    if (laneIndex === -1) {
      laneIndex = laneEnds.length
      laneEnds.push(endMs)
    } else {
      laneEnds.splice(laneIndex, 1, endMs)
    }

    lanes.push({ activity, laneIndex })
  })

  return { lanes, laneCount: laneEnds.length }
}

// Computes the required row height based on mini activity max stacking.
export const getRowHeight = <T extends GanttChartActivityLike>(
  activities: T[],
  stackMiniActivities: boolean,
  viewMode: GanttChartViewMode = 'day'
) => {
  const { laneCount } = computeMiniLanes(activities, stackMiniActivities, viewMode)
  const extraHeight = Math.max(0, laneCount - 1) * (MINI_HEIGHT_PX + MINI_GAP_PX)
  return BASE_ROW_HEIGHT_PX + extraHeight
}

// Generates week columns covering the specified date range.
export const getWeekColumns = (startDate: Date, endDate: Date): WeekColumn[] => {
  const start = DateTime.fromJSDate(startDate).startOf('week')
  const end = DateTime.fromJSDate(endDate).startOf('week')
  const weeks: WeekColumn[] = []
  let cursor = start

  while (cursor <= end) {
    const weekStart = cursor
    const weekEnd = cursor.endOf('week')
    weeks.push({
      start: weekStart.toJSDate(),
      end: weekEnd.toJSDate(),
      weekYear: weekStart.weekYear,
      weekNumber: weekStart.weekNumber,
    })
    cursor = cursor.plus({ weeks: 1 })
  }

  return weeks
}

// Computes the pixel left offset and width for an activity in the Gantt chart.
export const getActivitySpanPx = (
  activity: GanttChartActivityLike,
  dateRange: Date[],
  viewMode: GanttChartViewMode,
  columnWidthPx: number,
  weekColumns: WeekColumn[]
) => {
  if (dateRange.length === 0) {
    return { left: 0, width: 0 }
  }

  if (viewMode === 'week') {
    const maxIndex = Math.max(0, weekColumns.length - 1)
    const startWeek = DateTime.fromJSDate(activity.startDate).startOf('week').toISO()
    const endWeek = DateTime.fromJSDate(activity.endDate).startOf('week').toISO()
    const indexByWeek = new Map(
      weekColumns.map((week, index) => [DateTime.fromJSDate(week.start).toISO(), index])
    )
    const rawStart = indexByWeek.get(startWeek) ?? 0
    const rawEnd = indexByWeek.get(endWeek) ?? maxIndex
    const startIndex = Math.min(maxIndex, Math.max(0, rawStart))
    const endIndex = Math.min(maxIndex, Math.max(startIndex, rawEnd))

    return {
      left: startIndex * columnWidthPx,
      width: (endIndex - startIndex + 1) * columnWidthPx,
    }
  }

  const rangeStart = DateTime.fromJSDate(dateRange[0]!).startOf('day')
  const activityStart = DateTime.fromJSDate(activity.startDate).startOf('day')
  const activityEnd = DateTime.fromJSDate(activity.endDate).startOf('day')
  const offsetDays = Math.max(0, Math.floor(activityStart.diff(rangeStart, 'days').days))
  const spanDays = Math.max(1, Math.floor(activityEnd.diff(activityStart, 'days').days) + 1)

  return {
    left: offsetDays * columnWidthPx,
    width: spanDays * columnWidthPx,
  }
}

// Computes month spans (start and end week indices) for the given week columns.
export const getMonthSpansForWeeks = (weeks: WeekColumn[]): MonthSpan[] => {
  if (weeks.length === 0) {
    return []
  }

  const firstWeekStart = DateTime.fromJSDate(weeks[0]!.start).startOf('month')
  const lastWeekEnd = DateTime.fromJSDate(weeks[weeks.length - 1]!.end).startOf('month')
  const spans: MonthSpan[] = []
  let cursor = firstWeekStart

  // Month headers can overlap week boundaries, so compute spans by overlap, not by week start.
  while (cursor <= lastWeekEnd) {
    const monthStart = cursor.startOf('month')
    const monthEnd = cursor.endOf('month')
    const indices = weeks
      .map((week, index) => ({
        index,
        overlaps:
          DateTime.fromJSDate(week.start) <= monthEnd &&
          DateTime.fromJSDate(week.end) >= monthStart,
      }))
      .filter((item) => item.overlaps)
      .map((item) => item.index)

    if (indices.length > 0) {
      spans.push({
        year: cursor.year,
        month: cursor.month,
        label: cursor.toFormat('MMM yyyy'),
        startIndex: indices[0]!,
        endIndex: indices[indices.length - 1]!,
      })
    }

    cursor = cursor.plus({ months: 1 })
  }

  return spans
}
