<template>
  <div class="w-full h-full p-2">
    <div
      ref="ganntChart"
      class="flex flex-col h-96 w-full bg-white overflow-x-auto justify-start p-0 *:w-full *:min-w-fit *:shrink-0"
    >
      <GanttChartHeader />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import GanttChartHeader from '@/components/GanttChartComponent/GanttChartHeader.vue'

const ganntChart = useTemplateRef('ganntChart')

onMounted(() => {
  console.log(
    `Logging dimensions of the ganntChart: ${ganntChart?.value?.clientWidth} x ${ganntChart?.value?.offsetHeight}`
  )
})
</script>
