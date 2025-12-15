<template>
  <div class="flex flex-row sticky top-0 z-11">
    <!-- Header Placeholder -->
    <div
      class="left-0 w-80 flex shrink-0 sticky z-5 justify-center items-center box-border border border-gray-300 bg-gray-100"
    >
      Header
    </div>
    <!-- Headers -->
    <div class="flex flex-col">
      <!-- Months header -->
      <div class="flex flex-row w-full">
        <div
          v-for="month in months"
          :key="`${month.year}-${month.month}`"
          class="flex-none box-border border border-gray-300 bg-gray-100 text-gray-800 text-xs font-semibold text-center py-1"
          :style="{ width: `${month.days.length * DAY_CELL_WIDTH_PX}px` }"
          :title="`${month.label} (${month.days.length} days)`"
          :aria-label="`Month ${month.label}`"
        >
          {{ month.label }}
        </div>
      </div>
      <!-- Weeks header -->
      <div class="flex flex-row w-full">
        <div
          v-for="week in weeks"
          :key="`${week.weekYear}-W${week.weekNumber}`"
          class="flex-none box-border border border-gray-300 bg-gray-50 text-gray-700 text-xs font-medium text-center py-1"
          :style="{ width: `${week.days.length * DAY_CELL_WIDTH_PX}px` }"
          :title="`Week ${week.weekNumber} (${week.days.length} days)`"
          :aria-label="`Week ${week.weekNumber}`"
        >
          Week {{ week.weekNumber }}
        </div>
      </div>
      <!-- Days row -->
      <div class="flex flex-row w-full">
        <div
          v-for="date in dateRange"
          :key="date.toISOString()"
          class="flex-none box-border border border-gray-200 text-center py-2 text-xs select-none"
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
import { computed, type ComputedRef } from 'vue'
import { DateTime } from 'luxon'

const DAY_CELL_WIDTH_PX = 40 // match Tailwind w-10 (2.5rem) at base 16px

const dateRange: ComputedRef<Date[]> = computed(() => {
  const dates = []
  const currentDate = new Date(2026, 0, 1)
  const endDate = new Date(2026, 11, 31)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
})

const weeks = computed(() => {
  type WeekGroup = { weekYear: number; weekNumber: number; days: Date[] }
  const groups: WeekGroup[] = []

  dateRange.value.forEach((date) => {
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

  dateRange.value.forEach((date) => {
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
        label: luxonDate.toFormat('MMM yy'),
        days: [date],
      })
    }
  })

  return groups
})
</script>
