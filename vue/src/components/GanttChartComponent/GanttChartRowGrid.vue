<template>
  <div class="flex flex-row w-full group relative" :style="{ height: `${resolvedRowHeightPx}px` }">
    <div
      ref="gridElement"
      class="box-border border-b border-surface-200 relative overflow-hidden bg-surface-0"
      :style="gridStyle"
    >
      <div
        v-if="selectedCellColumnIndex !== undefined"
        class="absolute inset-y-0 z-10 pointer-events-none"
        :class="selectedHighlightClass"
        :style="selectedCellStyle"
      />
      <div
        v-if="highlightedCellColumnIndex !== undefined"
        class="absolute inset-y-0 z-[11] pointer-events-none"
        :class="hoverHighlightClass"
        :style="highlightedCellStyle"
      />
      <template
        v-for="(activity, index) in backgroundActivities"
        :key="activity.id ?? `background-${index}`"
      >
        <slot
          name="activity"
          :activity="activity"
          :style="backgroundStyle(activity)"
          :visual-type="'background'"
          :highlighted="isActivityHighlighted(activity)"
        >
          <div
            v-tooltip="tooltipForActivity(activity)"
            class="absolute z-0 cursor-pointer"
            :class="activityClass(activity, activity.colorClass)"
            :style="backgroundStyle(activity)"
            @pointermove="updateActivityHover(activity, $event)"
            @mousemove="updateActivityHover(activity, $event)"
            @mouseleave="clearActivityHover(activity)"
            @click="handleActivityClick(activity, $event)"
          />
        </slot>
      </template>
      <template
        v-for="(activity, index) in stripeActivities"
        :key="activity.id ?? `${activity.startDate.toISOString()}-${index}`"
      >
        <slot
          name="activity"
          :activity="activity"
          :style="stripeStyle(activity)"
          :visual-type="'stripe'"
          :highlighted="isActivityHighlighted(activity)"
        >
          <div
            v-tooltip="tooltipForActivity(activity)"
            class="absolute z-0 cursor-pointer"
            :class="activityClass(activity)"
            :style="stripeStyle(activity)"
            @pointermove="updateActivityHover(activity, $event)"
            @mousemove="updateActivityHover(activity, $event)"
            @mouseleave="clearActivityHover(activity)"
            @click="handleActivityClick(activity, $event)"
          />
        </slot>
      </template>
      <template v-for="(activity, index) in barActivities" :key="activity.id ?? `bar-${index}`">
        <slot
          name="activity"
          :activity="activity"
          :style="barStyle(activity)"
          :visual-type="'bar'"
          :highlighted="isActivityHighlighted(activity)"
        >
          <div
            v-tooltip="tooltipForActivity(activity)"
            class="absolute z-20 rounded-lg overflow-hidden cursor-pointer"
            :class="activityClass(activity, activity.colorClass ?? activityColorClass)"
            :style="barStyle(activity)"
            @pointermove="updateActivityHover(activity, $event)"
            @mousemove="updateActivityHover(activity, $event)"
            @mouseleave="clearActivityHover(activity)"
            @click="handleActivityClick(activity, $event)"
          >
            <span class="px-2 text-xs font-medium text-white truncate whitespace-nowrap">{{
              t(activity.label ?? 'gantt_chart.activity')
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
          :highlighted="isActivityHighlighted(item.activity)"
        >
          <div
            v-tooltip="tooltipForActivity(item.activity)"
            class="absolute z-30 rounded-md overflow-hidden cursor-pointer"
            :class="activityClass(item.activity, item.activity.colorClass ?? activityColorClass)"
            :style="miniStyle(item)"
            @pointermove="updateActivityHover(item.activity, $event)"
            @mousemove="updateActivityHover(item.activity, $event)"
            @mouseleave="clearActivityHover(item.activity)"
            @click="handleActivityClick(item.activity, $event)"
          />
        </slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { DateTime } from 'luxon'
import Tooltip from 'primevue/tooltip'
import { useI18nLib } from '@/locales'
import {
  BAR_VERTICAL_PADDING_PX,
  BASE_ROW_HEIGHT_PX,
  DAY_CELL_WIDTH_PX,
  MINI_GAP_PX,
  MINI_HEIGHT_PX,
  STRIPE_SIZE_PX,
  WEEK_CELL_WIDTH_PX,
  computeMiniLanes,
  getBarSpacingOffsets,
  getActivitySpanPx,
  getWeekColumns,
  type GanttChartActivityType,
  type GanttChartViewMode,
} from '@/components/GanttChartComponent/ganttChartLayout'
import type {
  GanttChartActivityInteractionContext,
  GanttChartActivityInteractionPayload,
  GanttChartActivityData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

export interface GanttChartRowGridProps {
  dateRange: Date[]
  viewMode?: GanttChartViewMode
  activities?: GanttChartActivityData[]
  activityColorClass?: string
  stripeColor?: string
  showWeekendShading?: boolean
  stackMiniActivities?: boolean
  rowHeightPx?: number
  rowIndex?: number
  rowData?: GanttChartRowData
  activityTooltip?: (
    activity: GanttChartActivityData,
    rowData?: GanttChartRowData,
    hoverContext?: GanttChartActivityInteractionContext
  ) => string
  activityHover?: (
    activity: GanttChartActivityData,
    rowData?: GanttChartRowData,
    hoverContext?: GanttChartActivityInteractionContext,
    payload?: GanttChartActivityInteractionPayload
  ) => void
  highlightedActivityIds?: Array<string | number>
  activityHighlightClass?: string
  useActivityTooltip?: boolean
  highlightedCellColumnIndex?: number
  hoverHighlightClass?: string
  selectedCellColumnIndex?: number
  selectedHighlightClass?: string
}

const { t } = useI18nLib()

const defaultTooltip = (activity: GanttChartActivityData) => {
  const labelKey = activity.label ?? 'gantt_chart.activity'
  const start = DateTime.fromJSDate(activity.startDate).toFormat('LLL d')
  const end = DateTime.fromJSDate(activity.endDate).toFormat('LLL d')
  return `${t(labelKey)}: ${start} – ${end}`
}

const {
  dateRange,
  viewMode = 'day',
  activities = [],
  activityColorClass = 'bg-emerald-400/80',
  stripeColor = 'rgba(59, 130, 246, 0.2)',
  showWeekendShading = true,
  stackMiniActivities = true,
  rowHeightPx = undefined,
  rowIndex = undefined,
  rowData = undefined,
  activityTooltip = undefined,
  activityHover = undefined,
  highlightedActivityIds = [],
  activityHighlightClass = 'ring-2 ring-primary-500/70 brightness-110',
  useActivityTooltip = true,
  highlightedCellColumnIndex = undefined,
  hoverHighlightClass = 'bg-primary-50/60',
  selectedCellColumnIndex = undefined,
  selectedHighlightClass = 'bg-primary-100/80',
} = defineProps<GanttChartRowGridProps>()

const emit = defineEmits<{
  (
    event: 'activityClick',
    activity: GanttChartActivityData,
    rowData?: GanttChartRowData,
    payload?: GanttChartActivityInteractionPayload
  ): void
}>()

const vTooltip = Tooltip

const WEEK_DAYS = 7
const gridElement = ref<HTMLElement | null>(null)
const hoveredActivity = ref<GanttChartActivityData>()
const hoverContext = ref<GanttChartActivityInteractionContext>()

// Switches layout math for day vs week column widths.
const isWeekView = computed(() => viewMode === 'week')
// Lane assignment for stacked mini activities.
const miniLayout = computed(() => computeMiniLanes(activities, stackMiniActivities, viewMode))
const barSpacingOffsets = computed(() => getBarSpacingOffsets(activities))
// Row height grows with overlapping minis.
const resolvedRowHeightPx = computed(() => {
  if (rowHeightPx !== undefined) {
    return rowHeightPx
  }

  const extraHeight = Math.max(0, miniLayout.value.laneCount - 1) * (MINI_HEIGHT_PX + MINI_GAP_PX)
  return BASE_ROW_HEIGHT_PX + extraHeight + barSpacingOffsets.value.topPx
})
const resolvedBarHeightPx = computed(() =>
  Math.max(
    0,
    resolvedRowHeightPx.value - BAR_VERTICAL_PADDING_PX * 2 - barSpacingOffsets.value.topPx
  )
)

// Pixel width for each column (day or week).
const columnWidthPx = computed(() => (isWeekView.value ? WEEK_CELL_WIDTH_PX : DAY_CELL_WIDTH_PX))
// Week column boundaries used for weekly view layout.
const weekColumns = computed(() => {
  if (dateRange.length === 0) {
    return []
  }

  return getWeekColumns(dateRange[0]!, dateRange[dateRange.length - 1]!)
})
// Total grid width in pixels.
const lineWidth = computed(() => {
  const count = isWeekView.value ? weekColumns.value.length : dateRange.length
  return `${count * columnWidthPx.value}px`
})
const highlightedCellStyle = computed(() => ({
  left: `${(highlightedCellColumnIndex ?? 0) * columnWidthPx.value}px`,
  width: `${columnWidthPx.value}px`,
}))
const selectedCellStyle = computed(() => ({
  left: `${(selectedCellColumnIndex ?? 0) * columnWidthPx.value}px`,
  width: `${columnWidthPx.value}px`,
}))

// Weekend shading pattern (disabled in weekly view).
const weekPattern = computed(() => {
  if (isWeekView.value || !showWeekendShading) {
    return ''
  }

  const base = dateRange[0]
    ? DateTime.fromJSDate(dateRange[0]).startOf('week')
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

// Grid background style with optional weekend shading.
const gridStyle = computed(() => {
  const firstDate = dateRange[0]
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

// Computes the CSS position and size for an activity bar/stripe/mini.
const activityPositionStyle = (activity: GanttChartActivityData) => {
  // Weekly view is inclusive of partial weeks: any overlap fills the whole week column.
  const span = getActivitySpanPx(
    activity,
    dateRange,
    viewMode,
    columnWidthPx.value,
    weekColumns.value
  )

  return {
    left: `${span.left}px`,
    width: `${span.width}px`,
  }
}

const activityType = (activity: GanttChartActivityData): GanttChartActivityType =>
  activity.visualType ?? 'bar'

const backgroundActivities = computed(() =>
  activities.filter((activity) => activityType(activity) === 'background')
)
const stripeActivities = computed(() =>
  activities.filter((activity) => activityType(activity) === 'stripe')
)
const barActivities = computed(() =>
  activities.filter((activity) => activityType(activity) === 'bar')
)

const isActivityHighlighted = (activity: GanttChartActivityData) =>
  activity.id !== undefined && highlightedActivityIds.includes(activity.id)

const activityClass = (activity: GanttChartActivityData, baseClass?: string) => [
  baseClass,
  isActivityHighlighted(activity) ? activityHighlightClass : undefined,
]

const hoverContextForActivity = (activity: GanttChartActivityData) => {
  const hovered = hoveredActivity.value
  const isSameActivity =
    hovered?.id !== undefined && activity.id !== undefined
      ? hovered.id === activity.id
      : hovered === activity

  return isSameActivity ? hoverContext.value : undefined
}

const rowKey = computed(() => rowData?.id ?? rowIndex)

const interactionPayload = (
  activity: GanttChartActivityData,
  event: PointerEvent | MouseEvent
): GanttChartActivityInteractionPayload | undefined => {
  const rect = gridElement.value?.getBoundingClientRect()
  if (!rect || columnWidthPx.value <= 0) {
    return undefined
  }

  const columnCount = isWeekView.value ? weekColumns.value.length : dateRange.length
  if (columnCount === 0) {
    return undefined
  }

  const rawColumnIndex = Math.floor((event.clientX - rect.left) / columnWidthPx.value)
  const columnIndex = Math.min(Math.max(rawColumnIndex, 0), columnCount - 1)
  const activityElement =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined
  const activityRect = activityElement?.getBoundingClientRect()
  const context: GanttChartActivityInteractionContext = {
    columnIndex,
    viewMode,
    // The popover is anchored to the hovered column center and the activity vertical center.
    anchorClientX: rect.left + columnIndex * columnWidthPx.value + columnWidthPx.value / 2,
    anchorClientY: activityRect ? activityRect.top + activityRect.height / 2 : event.clientY,
  }

  if (isWeekView.value) {
    context.week = weekColumns.value[columnIndex]
  } else {
    context.date = dateRange[columnIndex]
  }

  return {
    activity,
    rowData,
    rowIndex,
    rowKey: rowKey.value,
    activityKey: activity.id,
    context,
  }
}

const updateActivityHover = (
  activity: GanttChartActivityData,
  event: PointerEvent | MouseEvent
) => {
  const payload = interactionPayload(activity, event)
  if (!payload) {
    return
  }

  const nextContext = payload.context

  const hovered = hoveredActivity.value
  const sameActivity =
    hovered?.id !== undefined && activity.id !== undefined
      ? hovered.id === activity.id
      : hovered === activity
  const currentContext = hoverContext.value
  if (
    sameActivity &&
    currentContext?.columnIndex === nextContext.columnIndex &&
    currentContext.viewMode === nextContext.viewMode
  ) {
    return
  }

  hoveredActivity.value = activity
  hoverContext.value = nextContext
  activityHover?.(activity, rowData, nextContext, payload)
}

const clearActivityHover = (activity: GanttChartActivityData) => {
  if (hoverContextForActivity(activity)) {
    hoveredActivity.value = undefined
    hoverContext.value = undefined
    activityHover?.(activity, rowData, undefined)
  }
}

const handleActivityClick = (activity: GanttChartActivityData, event: MouseEvent) => {
  emit('activityClick', activity, rowData, interactionPayload(activity, event))
}

const tooltipForActivity = (activity: GanttChartActivityData) => {
  if (!useActivityTooltip) {
    return {
      value: '',
      disabled: true,
    }
  }

  const content = (activityTooltip ?? defaultTooltip)(
    activity,
    rowData,
    hoverContextForActivity(activity)
  )
  return {
    value: content,
    disabled: !content,
  }
}

const stripeStyle = (activity: GanttChartActivityData) => {
  const color = activity.color ?? stripeColor
  return {
    ...activityPositionStyle(activity),
    top: '0px',
    height: `${resolvedRowHeightPx.value}px`,
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 ${STRIPE_SIZE_PX}px, ${color} ${STRIPE_SIZE_PX}px ${
      STRIPE_SIZE_PX * 2
    }px)`,
  }
}

const backgroundStyle = (activity: GanttChartActivityData) => {
  const style: Record<string, string> = {
    ...activityPositionStyle(activity),
    top: '0px',
    height: `${resolvedRowHeightPx.value}px`,
  }

  if (activity.color) {
    style.backgroundColor = activity.color
  }

  return style
}

const barStyle = (activity: GanttChartActivityData) => {
  const topOffsetPx = activity.barOffsetTopPx ?? 0
  const style: Record<string, string> = {
    ...activityPositionStyle(activity),
    top: `${BAR_VERTICAL_PADDING_PX + topOffsetPx}px`,
    height: `${resolvedBarHeightPx.value}px`,
  }

  if (activity.color) {
    style.backgroundColor = activity.color
  }

  return style
}

const miniStyle = (item: { activity: GanttChartActivityData; laneIndex: number }) => {
  const laneCount = miniLayout.value.laneCount
  const stackHeight = laneCount * MINI_HEIGHT_PX + (laneCount - 1) * MINI_GAP_PX
  const topStart = Math.max(BAR_VERTICAL_PADDING_PX, (resolvedRowHeightPx.value - stackHeight) / 2)
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
