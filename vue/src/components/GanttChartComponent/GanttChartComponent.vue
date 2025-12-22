<template>
  <div ref="gantt-container" class="w-full h-full p-2 bg-surface-50">
    <div class="rounded-2xl overflow-hidden border border-surface-200 bg-surface-0 shadow-sm">
      <div
        v-bind="containerProps"
        class="flex flex-col w-full overflow-auto justify-start p-0 *:w-full *:min-w-fit *:shrink-0"
        :style="{ height: `${containerHeight}px` }"
      >
        <GanttChartHeader
          :date-range="props.dateRange"
          :view-mode="props.viewMode"
          :header-label="props.headerLabel"
        />
        <div id="fb" class="min-w-fit w-full shrink-0" v-bind="wrapperProps">
          <GanttChartRow
            v-for="(item, idx) in list"
            :key="item.data.id ?? idx"
            :date-range="props.dateRange"
            :activities="item.data.activities"
            :row-data="item.data"
            :row-label="item.data.header ?? item.data.label"
            :row-height-px="rowHeights[item.index]"
            :view-mode="props.viewMode"
            :show-weekend-shading="props.showWeekendShading"
            :stack-mini-activities="props.stackMiniActivities"
            :activity-tooltip="props.activityTooltip"
            @activity-click="handleActivityClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useVirtualList, useResizeObserver } from '@vueuse/core'

import GanttChartHeader from '@/components/GanttChartComponent/GanttChartHeader.vue'
import GanttChartRow from '@/components/GanttChartComponent/GanttChartRow.vue'
import { BASE_ROW_HEIGHT_PX, getRowHeight } from '@/components/GanttChartComponent/ganttChartLayout'
import type {
  GanttChartActivityData,
  GanttChartRowData,
} from '@/components/GanttChartComponent/ganttChartTypes'

const container = useTemplateRef('gantt-container')
const containerHeight = ref(0) // Starts with a computed height of 0

// Each time the window is resized, we reflect the update in the virtual renderer to adapt it
useResizeObserver(container, (entries) => {
  const entry = entries[0]
  const { height } = entry!.contentRect
  containerHeight.value = height
})

// Assign the outer container base height to the virtual renderer
onMounted(() => {
  containerHeight.value = container!.value!.offsetHeight
})

type ActivityRow = GanttChartRowData
type ActivityTooltip = (activity: GanttChartActivityData, rowData?: ActivityRow) => string
type ActivityClickHandler = (activity: GanttChartActivityData, rowData?: ActivityRow) => void

interface GanttChartComponentProps {
  dateRange?: Date[]
  rows?: ActivityRow[]
  headerLabel?: string
  viewMode?: 'day' | 'week'
  showWeekendShading?: boolean
  stackMiniActivities?: boolean
  activityTooltip?: ActivityTooltip
  activityClick?: ActivityClickHandler
}

const props = withDefaults(defineProps<GanttChartComponentProps>(), {
  dateRange: () => [],
  rows: () => [],
  headerLabel: 'Header',
  viewMode: 'day',
  showWeekendShading: true,
  stackMiniActivities: true,
  activityTooltip: undefined,
  activityClick: undefined,
})

const emit = defineEmits<{
  (event: 'activityClick', activity: ActivityRow['activities'][number], rowData: ActivityRow): void
}>()

const handleActivityClick = (
  activity: ActivityRow['activities'][number],
  rowData?: ActivityRow
) => {
  if (!rowData) {
    return
  }

  props.activityClick?.(activity, rowData)
  emit('activityClick', activity, rowData)
}

const rowHeights = computed(() =>
  props.rows.map((row) => getRowHeight(row.activities, props.stackMiniActivities))
)

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => props.rows),
  {
    itemHeight: (index) => rowHeights.value.at(index) ?? BASE_ROW_HEIGHT_PX,
  }
)
</script>
