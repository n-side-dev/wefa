<template>
  <div
    class="wefa-dashboard"
    :class="{
      horizontal: orientation === 'horizontal',
      vertical: orientation === 'vertical',
      'wefa-boxed-panels': boxedPanels,
    }"
  >
    <!-- Receiving a list of groups or panels -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'

// Orientation : vertical or horizontal
// Boxed panels
// Fit parent or free space
// Weight on sections

export interface DashboardComponentProps {
  orientation?: 'horizontal' | 'vertical'
  boxedPanels?: boolean
}

const { orientation = 'horizontal', boxedPanels = true } = defineProps<DashboardComponentProps>()

const defaultChildrenOrientation = computed(() => {
  return orientation === 'horizontal' ? 'vertical' : 'horizontal'
})
provide('wefa-orientation', defaultChildrenOrientation)
</script>

<style scoped>
.wefa-dashboard {
  transition: all 0.5s allow-discrete; /** allow-discrete applies the display none at the end of the transition, for expand feature */

  display: flex;
  gap: 0.5rem;

  height: 100%;
  width: 100%;

  zoom: 1;

  overflow-x: visible;
}

.wefa-dashboard.horizontal {
  flex-direction: row;
}

.wefa-dashboard.vertical {
  flex-direction: column;
}
</style>
