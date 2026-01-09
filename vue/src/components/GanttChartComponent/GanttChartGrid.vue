<template>
  <div class="rounded-2xl border border-surface-200 bg-surface-0 shadow-sm">
    <div class="flex flex-col w-full justify-start p-0" :style="cardStyle">
      <div class="flex w-full">
        <div class="flex shrink-0" :style="{ width: `${leftHeaderWidthPx}px` }">
          <slot name="header-left" />
        </div>
        <div ref="headerScroller" class="flex-1 overflow-x-hidden overflow-y-hidden">
          <div class="min-w-fit">
            <slot name="header-right" />
          </div>
        </div>
      </div>
      <div
        v-bind="containerProps"
        class="flex w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        :style="{ height: `${bodyHeightPx}px` }"
      >
        <div id="fb" class="flex w-full shrink-0" v-bind="wrapperProps">
          <div class="flex flex-col shrink-0" :style="{ width: `${leftHeaderWidthPx}px` }">
            <slot name="body-left" />
          </div>
          <div
            ref="bodyScroller"
            class="flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            @scroll="syncScroll"
          >
            <div class="min-w-fit relative">
              <slot name="overlay" />
              <slot name="body-right" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface GanttChartGridProps {
  cardStyle: Record<string, string>
  bodyHeightPx: number
  containerProps: Record<string, unknown>
  wrapperProps: Record<string, unknown>
  leftHeaderWidthPx: number
}

defineProps<GanttChartGridProps>()

const headerScroller = ref<HTMLElement | null>(null)
const bodyScroller = ref<HTMLElement | null>(null)

const syncScroll = () => {
  if (!headerScroller.value || !bodyScroller.value) {
    return
  }

  headerScroller.value.scrollLeft = bodyScroller.value.scrollLeft
}
</script>
