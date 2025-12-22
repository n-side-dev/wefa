<template>
  <div class="flex flex-row w-full group relative z-0" :style="{ height: `${rowHeightPx}px` }">
    <div
      class="left-0 p-0 w-80 flex shrink-0 sticky z-20 justify-center items-center box-border border-b border-r border-surface-200 bg-surface-0 text-surface-900 font-medium group-hover:bg-surface-50"
    >
      {{ props.rowLabel ?? 'Row' }}
    </div>
    <div
      class="box-border border-b border-surface-200 bg-surface-0 group-hover:bg-surface-50 relative overflow-hidden z-0"
      :style="gridStyle"
    >
      <template
        v-for="(activity, index) in stripeActivities"
        :key="activity.id ?? `${activity.startDate.toISOString()}-${index}`"
      >
        <slot
          name="activity"
          :activity="activity"
          :style="stripeStyle(activity)"
          :visual-type="'stripe'"
        >
          <div
            v-tooltip="tooltipForActivity(activity)"
            class="absolute z-0 cursor-pointer"
            :style="stripeStyle(activity)"
            @click="emit('activityClick', activity, props.rowData)"
          />
        </slot>
      </template>
      <template v-for="(activity, index) in barActivities" :key="activity.id ?? `bar-${index}`">
        <slot name="activity" :activity="activity" :style="barStyle(activity)" :visual-type="'bar'">
          <div
            v-tooltip="tooltipForActivity(activity)"
            class="absolute z-10 rounded-lg overflow-hidden cursor-pointer"
            :class="activity.colorClass ?? props.activityColorClass"
            :style="barStyle(activity)"
            @click="emit('activityClick', activity, props.rowData)"
          >
            <span class="px-2 text-xs font-medium text-white truncate whitespace-nowrap">{{
              activity.label
            }}</span>
          </div>
        </slot>
      </template>
      <template
        v-for="(item, index) in miniLayout.lanes"
        :key="item.activity.id ?? `mini-${index}`"
      >
        <slot
          name="activity"
          :activity="item.activity"
          :style="miniStyle(item)"
          :visual-type="'mini'"
        >
          <div
            v-tooltip="tooltipForActivity(item.activity)"
            class="absolute z-20 rounded-md overflow-hidden cursor-pointer"
            :class="item.activity.colorClass ?? props.activityColorClass"
            :style="miniStyle(item)"
            @click="emit('activityClick', item.activity, props.rowData)"
          />
        </slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import Tooltip from 'primevue/tooltip'
import {
  BAR_VERTICAL_PADDING_PX,
  BASE_ROW_HEIGHT_PX,
  DAY_CELL_WIDTH_PX,
  MINI_GAP_PX,
  MINI_HEIGHT_PX,
  STRIPE_SIZE_PX,
  WEEK_CELL_WIDTH_PX,
  computeMiniLanes,
  getWeekColumns,
  type GanttChartActivityType,
  type GanttChartViewMode,
} from '@/components/GanttChartComponent/ganttChartLayout'
import type {
  GanttChartActivityData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

export interface GanttChartRowProps {
  dateRange: Date[]
  viewMode?: GanttChartViewMode
  rowLabel?: string
  activities?: GanttChartActivityData[]
  activityColorClass?: string
  stripeColor?: string
  showWeekendShading?: boolean
  stackMiniActivities?: boolean
  rowHeightPx?: number
  rowData?: GanttChartRowData
  activityTooltip?: (activity: GanttChartActivityData, rowData?: GanttChartRowData) => string
}

const defaultTooltip = (activity: GanttChartActivityData) => {
  const label = activity.label ?? 'Activity'
  const start = DateTime.fromJSDate(activity.startDate).toFormat('LLL d')
  const end = DateTime.fromJSDate(activity.endDate).toFormat('LLL d')
  return `${label}: ${start} – ${end}`
}

const props = withDefaults(defineProps<GanttChartRowProps>(), {
  activities: () => [],
  activityColorClass: 'bg-emerald-400/80',
  stripeColor: 'rgba(59, 130, 246, 0.2)',
  showWeekendShading: true,
  stackMiniActivities: true,
  viewMode: 'day',
  rowLabel: 'Row',
  rowHeightPx: undefined,
  rowData: undefined,
  activityTooltip: undefined,
})

const emit = defineEmits<{
  (event: 'activityClick', activity: GanttChartActivityData, rowData?: GanttChartRowData): void
}>()

const vTooltip = Tooltip

const WEEK_DAYS = 7

const isWeekView = computed(() => props.viewMode === 'week')
const miniLayout = computed(() => computeMiniLanes(props.activities, props.stackMiniActivities))
const rowHeightPx = computed(() => {
  if (props.rowHeightPx !== undefined) {
    return props.rowHeightPx
  }

  const extraHeight = Math.max(0, miniLayout.value.laneCount - 1) * (MINI_HEIGHT_PX + MINI_GAP_PX)
  return BASE_ROW_HEIGHT_PX + extraHeight
})

const columnWidthPx = computed(() => (isWeekView.value ? WEEK_CELL_WIDTH_PX : DAY_CELL_WIDTH_PX))
const weekColumns = computed(() => {
  if (props.dateRange.length === 0) {
    return []
  }

  return getWeekColumns(props.dateRange[0]!, props.dateRange[props.dateRange.length - 1]!)
})
const weekIndexByStart = computed(
  () =>
    new Map(
      weekColumns.value.map((week, index) => [DateTime.fromJSDate(week.start).toISO(), index])
    )
)
const lineWidth = computed(() => {
  const count = isWeekView.value ? weekColumns.value.length : props.dateRange.length
  return `${count * columnWidthPx.value}px`
})

const weekPattern = computed(() => {
  if (isWeekView.value || !props.showWeekendShading) {
    return ''
  }

  const base = props.dateRange[0]
    ? DateTime.fromJSDate(props.dateRange[0]).startOf('week')
    : DateTime.now().startOf('week')
  const stops = Array.from({ length: WEEK_DAYS }, (_, index) => {
    const day = base.plus({ days: index })
    const color = day.isWeekend ? 'rgb(248 250 252)' : 'transparent'
    const start = index * DAY_CELL_WIDTH_PX
    const end = (index + 1) * DAY_CELL_WIDTH_PX
    return `${color} ${start}px ${end}px`
  })

  return `linear-gradient(90deg, ${stops.join(', ')})`
})

const gridStyle = computed(() => {
  const firstDate = props.dateRange[0]
  const weekStart = firstDate
    ? DateTime.fromJSDate(firstDate).startOf('week')
    : DateTime.now().startOf('week')
  const offsetDays = firstDate
    ? Math.floor(DateTime.fromJSDate(firstDate).diff(weekStart, 'days').days)
    : 0
  const offsetPx = offsetDays * DAY_CELL_WIDTH_PX
  const columnWidth = columnWidthPx.value
  const gridLines = `repeating-linear-gradient(90deg, transparent 0, transparent ${
    columnWidth - 1
  }px, rgb(226 232 240) ${columnWidth - 1}px, rgb(226 232 240) ${columnWidth}px)`
  const baseStyle: Record<string, string> = {
    width: lineWidth.value,
    backgroundImage: gridLines,
    backgroundSize: `${columnWidth}px 100%`,
    backgroundRepeat: 'repeat-x',
  }

  if (weekPattern.value) {
    baseStyle.backgroundImage = `${gridLines}, ${weekPattern.value}`
    baseStyle.backgroundSize = `${columnWidth}px 100%, ${DAY_CELL_WIDTH_PX * WEEK_DAYS}px 100%`
    baseStyle.backgroundPosition = `0 0, -${offsetPx}px 0`
    baseStyle.backgroundRepeat = 'repeat-x, repeat-x'
  }

  return baseStyle
})

const activityPositionStyle = (activity: GanttChartActivityData) => {
  if (isWeekView.value) {
    const columns = weekColumns.value
    const maxIndex = Math.max(0, columns.length - 1)
    const startWeek = DateTime.fromJSDate(activity.startDate).startOf('week').toISO()
    const endWeek = DateTime.fromJSDate(activity.endDate).startOf('week').toISO()
    const rawStart = weekIndexByStart.value.get(startWeek) ?? 0
    const rawEnd = weekIndexByStart.value.get(endWeek) ?? maxIndex
    const startIndex = Math.min(maxIndex, Math.max(0, rawStart))
    const endIndex = Math.min(maxIndex, Math.max(startIndex, rawEnd))

    return {
      left: `${startIndex * columnWidthPx.value}px`,
      width: `${(endIndex - startIndex + 1) * columnWidthPx.value}px`,
    }
  }

  const rangeStart = props.dateRange[0]
    ? DateTime.fromJSDate(props.dateRange[0]).startOf('day')
    : DateTime.now().startOf('day')
  const activityStart = DateTime.fromJSDate(activity.startDate).startOf('day')
  const activityEnd = DateTime.fromJSDate(activity.endDate).startOf('day')
  const offsetDays = Math.max(0, Math.floor(activityStart.diff(rangeStart, 'days').days))
  const spanDays = Math.max(1, Math.floor(activityEnd.diff(activityStart, 'days').days) + 1)

  return {
    left: `${offsetDays * DAY_CELL_WIDTH_PX}px`,
    width: `${spanDays * DAY_CELL_WIDTH_PX}px`,
  }
}

const activityType = (activity: GanttChartActivityData): GanttChartActivityType =>
  activity.visualType ?? 'bar'

const stripeActivities = computed(() =>
  props.activities.filter((activity) => activityType(activity) === 'stripe')
)
const barActivities = computed(() =>
  props.activities.filter((activity) => activityType(activity) === 'bar')
)
const tooltipForActivity = (activity: GanttChartActivityData) => {
  const content = (props.activityTooltip ?? defaultTooltip)(activity, props.rowData)
  return {
    value: content,
    disabled: !content,
  }
}

const stripeStyle = (activity: GanttChartActivityData) => {
  const color = activity.color ?? props.stripeColor
  return {
    ...activityPositionStyle(activity),
    top: '0px',
    height: `${rowHeightPx.value}px`,
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 ${STRIPE_SIZE_PX}px, ${color} ${STRIPE_SIZE_PX}px ${
      STRIPE_SIZE_PX * 2
    }px)`,
  }
}

const barStyle = (activity: GanttChartActivityData) => {
  const height = Math.max(0, rowHeightPx.value - BAR_VERTICAL_PADDING_PX * 2)
  const style: Record<string, string> = {
    ...activityPositionStyle(activity),
    top: `${BAR_VERTICAL_PADDING_PX}px`,
    height: `${height}px`,
  }

  if (activity.color) {
    style.backgroundColor = activity.color
  }

  return style
}

const miniStyle = (item: { activity: GanttChartActivityData; laneIndex: number }) => {
  const laneCount = miniLayout.value.laneCount
  const stackHeight = laneCount * MINI_HEIGHT_PX + (laneCount - 1) * MINI_GAP_PX
  const topStart = Math.max(BAR_VERTICAL_PADDING_PX, (rowHeightPx.value - stackHeight) / 2)
  const style: Record<string, string> = {
    ...activityPositionStyle(item.activity),
    top: `${topStart + item.laneIndex * (MINI_HEIGHT_PX + MINI_GAP_PX)}px`,
    height: `${MINI_HEIGHT_PX}px`,
  }

  if (item.activity.color) {
    style.backgroundColor = item.activity.color
  }

  return style
}
</script>
