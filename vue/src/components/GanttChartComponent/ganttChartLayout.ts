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

export const DAY_CELL_WIDTH_PX = 40
export const WEEK_CELL_WIDTH_PX = 40
export const BASE_ROW_HEIGHT_PX = 30
export const BAR_VERTICAL_PADDING_PX = 4
export const MINI_HEIGHT_PX = 12
export const MINI_GAP_PX = 2
export const STRIPE_SIZE_PX = 8

const normalizedDayMs = (date: Date) => DateTime.fromJSDate(date).startOf('day').toMillis()

const resolveType = (activity: GanttChartActivityLike) => activity.visualType ?? 'bar'

export const computeMiniLanes = <T extends GanttChartActivityLike>(
  activities: T[],
  stackMiniActivities: boolean
): { lanes: MiniLaneItem<T>[]; laneCount: number } => {
  const minis = activities.filter((activity) => resolveType(activity) === 'mini')

  if (minis.length === 0) {
    return { lanes: [], laneCount: 1 }
  }

  if (!stackMiniActivities) {
    return { lanes: minis.map((activity) => ({ activity, laneIndex: 0 })), laneCount: 1 }
  }

  const sorted = [...minis].sort(
    (a, b) => normalizedDayMs(a.startDate) - normalizedDayMs(b.startDate)
  )
  const laneEnds: number[] = []
  const lanes: MiniLaneItem<T>[] = []

  sorted.forEach((activity) => {
    const startMs = normalizedDayMs(activity.startDate)
    const endMs = normalizedDayMs(activity.endDate)
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

export const getRowHeight = <T extends GanttChartActivityLike>(
  activities: T[],
  stackMiniActivities: boolean
) => {
  const { laneCount } = computeMiniLanes(activities, stackMiniActivities)
  const extraHeight = Math.max(0, laneCount - 1) * (MINI_HEIGHT_PX + MINI_GAP_PX)
  return BASE_ROW_HEIGHT_PX + extraHeight
}

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

export const getMonthSpansForWeeks = (weeks: WeekColumn[]): MonthSpan[] => {
  if (weeks.length === 0) {
    return []
  }

  const firstWeekStart = DateTime.fromJSDate(weeks[0]!.start).startOf('month')
  const lastWeekEnd = DateTime.fromJSDate(weeks[weeks.length - 1]!.end).startOf('month')
  const spans: MonthSpan[] = []
  let cursor = firstWeekStart

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
