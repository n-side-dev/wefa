<template>
  <div class="w-full h-full p-2">
    <div
      v-bind="containerProps"
      class="flex flex-col w-full bg-white overflow-x-auto justify-start p-0 *:w-full *:min-w-fit *:shrink-0"
      :style="{ height: `900px` }"
    >
      <GanttChartHeader :date-range="dateRange" />
      <div id="fb" class="min-w-fit w-full shrink-0" v-bind="wrapperProps">
        <GanttChartRow v-for="(item, idx) in list" :key="idx" :date-range="dateRange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef, onMounted } from 'vue'
import { useVirtualList } from '@vueuse/core'

import GanttChartHeader from '@/components/GanttChartComponent/GanttChartHeader.vue'
import GanttChartRow from '@/components/GanttChartComponent/GanttChartRow.vue'

onMounted(() => {
  console.log(
    `Logging dimensions of the ganntChart: ${containerProps.ref?.value?.clientWidth} x ${containerProps.ref?.value?.offsetHeight}`
  )
})

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

const outageRequests = [1, 3, 4, 5, 5, 6, 7, 8]
const { list, containerProps, wrapperProps } = useVirtualList(outageRequests, {
  itemHeight: 30,
})
</script>
