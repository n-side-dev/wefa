<template>
  <div
    class="wefa-dashboard-group"
    :class="{
      horizontal: effectiveOrientation === 'horizontal',
      vertical: effectiveOrientation === 'vertical',
      'hug-content': hugContent,
      'has-max-width': !!maxWidth,
      'has-max-height': !!maxHeight,
      'wefa-group-still-visible-when-other-expands': stayVisibleWhenOtherExpand,
    }"
    :style="{
      '--weight': weight,
      '--maxWidth': maxWidth,
    }"
  >
    <!-- Receiving a list of panels or groups -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide, ref } from 'vue'

export interface DashboardGroupComponentProps {
  orientation?: 'horizontal' | 'vertical'
  weight?: number
  hugContent?: boolean
  maxWidth?: string // e.g '200px', '50%', '5rem'
  maxHeight?: string // e.g '200px', '50%', '5rem'
  stayVisibleWhenOtherExpand?: boolean
}

const {
  orientation,
  weight = 1,
  hugContent = false,
  maxWidth = '',
  maxHeight = '',
  stayVisibleWhenOtherExpand = false,
} = defineProps<DashboardGroupComponentProps>()

const orientationFromParent = inject('wefa-orientation', ref('vertical'))

const effectiveOrientation = computed(() => orientation ?? orientationFromParent.value)

const defaultChildrenOrientation = computed(() => {
  return effectiveOrientation.value === 'horizontal' ? 'vertical' : 'horizontal'
})
provide('wefa-orientation', defaultChildrenOrientation)
</script>

<style scoped>
.wefa-dashboard-group {
  transition: inherit;

  gap: inherit;

  display: flex;

  height: 100%;
  width: 100%;

  flex-basis: 0;
  flex-grow: var(--weight);

  overflow: auto;
}

.wefa-dashboard-group.hug-content {
  flex-basis: content;
  flex-grow: 0;
}
.wefa-dashboard-group.has-max-width {
  max-width: var(--maxWidth);
}
.wefa-dashboard-group.has-max-height {
  max-height: var(--maxHeight);
}

.wefa-dashboard-group.vertical {
  flex-direction: column;
}
.wefa-dashboard-group.horizontal {
  flex-direction: row;
}

/** Expand group */
.wefa-dashboard:has(.wefa-dashboard-panel.wefa-expanded)
  .wefa-dashboard-group:has(.wefa-dashboard-panel.wefa-expanded) {
  /** Revert hug */
  --flex-basis: unset; /** TODO fix somehow this is causing issues with keeping expands */
  flex-grow: var(--weight); /** Needed ? */
}

/** Hide group */
.wefa-dashboard:has(.wefa-dashboard-panel.wefa-expanded) {
  .wefa-dashboard-group:not(:has(.wefa-dashboard-panel.wefa-expanded)).wefa-dashboard-group:not(
      :has(.wefa-dashboard-panel.wefa-panel-still-visible-when-other-expands)
    ) {
    display: none;

    /** Trying to animate */

    opacity: 0;
    visibility: collapse;
    width: 0;
    height: 0;
    flex-basis: 0;
    flex-grow: 0;
    padding: 0;
    margin: 0;
  }
}
</style>
