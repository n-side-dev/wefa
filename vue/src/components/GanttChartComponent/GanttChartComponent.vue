<template>
  <div class="w-full h-full p-2">
    <div ref="ganntChart" class="w-full h-full bg-white">
      <div class="overflow-x-auto">
        <div class="min-w-max">
          <!-- Weeks header -->
          <div class="flex">
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
          <div class="flex">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef, onMounted, useTemplateRef } from 'vue'
import { DateTime } from 'luxon'

const DAY_CELL_WIDTH_PX = 40 // match Tailwind w-10 (2.5rem) at base 16px

const ganntChart = useTemplateRef('ganntChart')

onMounted(() => {
  console.log(`Logging dimensions of the ganntChart: ${ganntChart?.value?.clientWidth} x ${ganntChart?.value?.offsetHeight}`)
})

const dateRange: ComputedRef<Date[]> = computed(() => {
  const dates = []
  const currentDate = new Date(2025, 0, 2)
  const endDate = new Date(2025, 11, 31)

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
</script>
