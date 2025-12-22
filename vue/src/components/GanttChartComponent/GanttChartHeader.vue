<template>
  <div class="flex flex-row sticky top-0 z-40 bg-surface-0/95 backdrop-blur-sm">
    <!-- Header Placeholder -->
    <div
      class="left-0 w-80 flex shrink-0 sticky z-50 justify-center items-center box-border border-r border-b border-surface-200 bg-surface-50 text-surface-900 font-semibold"
    >
      {{ t(headerLabel) }}
    </div>
    <!-- Headers -->
    <div class="flex flex-col">
      <!-- Months header -->
      <div class="flex flex-row w-full">
        <template v-if="isWeekView">
          <div
            class="relative h-10"
            :style="{ width: `${weekColumns.length * WEEK_CELL_WIDTH_PX}px` }"
          >
            <div
              v-for="month in monthSpans"
              :key="`${month.year}-${month.month}`"
              class="absolute box-border border-b border-r border-surface-200 bg-surface-50 text-surface-900 text-xs font-semibold uppercase tracking-wide h-10 flex items-center justify-center text-center leading-tight px-2 break-words"
              :style="monthSpanStyle(month)"
              :title="month.label"
              :aria-label="`Month ${month.label}`"
            >
              {{ month.label }}
            </div>
          </div>
        </template>
        <template v-else>
          <div
            v-for="month in months"
            :key="`${month.year}-${month.month}`"
            class="flex-none box-border border-b border-r border-surface-200 bg-surface-50 text-surface-900 text-xs font-semibold uppercase tracking-wide h-10 flex items-center justify-center text-center leading-tight px-2 break-words"
            :style="{ width: `${month.days.length * DAY_CELL_WIDTH_PX}px` }"
            :title="`${month.label} (${month.days.length} days)`"
            :aria-label="`Month ${month.label}`"
          >
            {{ month.label }}
          </div>
        </template>
      </div>
      <!-- Weeks header -->
      <div class="flex flex-row w-full">
        <template v-if="isWeekView">
          <div
            v-for="week in weekColumns"
            :key="`${week.weekYear}-W${week.weekNumber}-${week.start.toISOString()}`"
            class="flex-none box-border border-b border-r border-surface-200 bg-surface-0 text-surface-600 text-[11px] font-semibold h-9 flex items-center justify-center text-center leading-tight px-1"
            :style="{ width: `${columnWidthPx}px` }"
            :title="`${t('Week')} ${week.weekNumber}`"
            :aria-label="`${t('Week')} ${week.weekNumber}`"
          >
            {{ t('Week') }} {{ week.weekNumber }}
          </div>
        </template>
        <template v-else>
          <div
            v-for="week in weeks"
            :key="`${week.weekYear}-W${week.weekNumber}`"
            class="flex-none box-border border-b border-r border-surface-200 bg-surface-0 text-surface-600 text-[11px] font-semibold h-9 flex items-center justify-center text-center leading-tight px-1"
            :style="{ width: `${week.days.length * DAY_CELL_WIDTH_PX}px` }"
            :title="`${t('Week')} ${week.weekNumber} (${week.days.length} days)`"
            :aria-label="`${t('Week')} ${week.weekNumber}`"
          >
            {{ t('Week') }} {{ week.weekNumber }}
          </div>
        </template>
      </div>
      <!-- Days row -->
      <div v-if="!isWeekView" class="flex flex-row w-full">
        <div
          v-for="date in dateRange"
          :key="date.toISOString()"
          class="flex-none box-border border-b border-r border-surface-200 bg-surface-0 text-center py-2 text-xs text-surface-700 select-none"
          :style="{ width: `${DAY_CELL_WIDTH_PX}px` }"
          :title="date.toDateString()"
        >
          {{ date.getDate() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { useI18nLib } from '@/locales'
import {
  DAY_CELL_WIDTH_PX,
  WEEK_CELL_WIDTH_PX,
  getMonthSpansForWeeks,
  getWeekColumns,
  type GanttChartViewMode,
  type MonthSpan,
} from '@/components/GanttChartComponent/ganttChartLayout'

export interface GanttChartRowProps {
  dateRange: Date[]
  viewMode?: GanttChartViewMode
  headerLabel?: string
}

const { dateRange, viewMode = 'day', headerLabel = 'Header' } = defineProps<GanttChartRowProps>()
const { t } = useI18nLib()

const isWeekView = computed(() => viewMode === 'week')
const columnWidthPx = computed(() => (isWeekView.value ? WEEK_CELL_WIDTH_PX : DAY_CELL_WIDTH_PX))
const weekColumns = computed(() => {
  if (dateRange.length === 0) {
    return []
  }

  return getWeekColumns(dateRange[0]!, dateRange[dateRange.length - 1]!)
})

const monthSpans = computed(() =>
  isWeekView.value ? getMonthSpansForWeeks(weekColumns.value) : []
)

const weeks = computed(() => {
  type WeekGroup = { weekYear: number; weekNumber: number; days: Date[] }
  const groups: WeekGroup[] = []

  dateRange.forEach((date) => {
    const luxonDate = DateTime.fromJSDate(date)
    const keyYear = luxonDate.weekYear
    const keyNumber = luxonDate.weekNumber
    const existing = groups.find((w) => w.weekYear === keyYear && w.weekNumber === keyNumber)

    if (existing) {
      existing.days.push(date)
    } else {
      groups.push({
        weekYear: keyYear,
        weekNumber: keyNumber,
        days: [date],
      })
    }
  })

  return groups
})

const months = computed(() => {
  type MonthGroup = { month: number; year: number; label: string; days: Date[] }
  const groups: MonthGroup[] = []

  dateRange.forEach((date) => {
    const luxonDate = DateTime.fromJSDate(date)
    const keyYear = luxonDate.year
    const keyMonth = luxonDate.month
    const existing = groups.find((m) => m.year === keyYear && m.month === keyMonth)

    if (existing) {
      existing.days.push(date)
    } else {
      groups.push({
        month: keyMonth,
        year: keyYear,
        label: luxonDate.toFormat('MMM yyyy'),
        days: [date],
      })
    }
  })

  return groups
})

const monthSpanStyle = (month: MonthSpan) => ({
  left: `${month.startIndex * WEEK_CELL_WIDTH_PX}px`,
  width: `${(month.endIndex - month.startIndex + 1) * WEEK_CELL_WIDTH_PX}px`,
})
</script>
