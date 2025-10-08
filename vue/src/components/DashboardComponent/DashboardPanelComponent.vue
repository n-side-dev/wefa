<template>
  <div
    class="relative wefa-dashboard-panel"
    :class="{
      'hug-content': hugContent,
      'has-max-width': !!maxWidth,
      'has-max-height': !!maxHeight,
      'wefa-expanded': canExpand && expanded,
      'wefa-panel-still-visible-when-other-expands': stayVisibleWhenOtherExpand,
    }"
    :style="{
      '--weight': weight,
      '--maxWidth': maxWidth,
      '--maxHeight': maxHeight,
    }"
  >
    <Button
      v-if="canExpand"
      icon="pi pi-expand"
      variant="text"
      aria-label="Save"
      :pt="{
        root: 'z-1000 !absolute !right-1 !top-1 !p-1 !bg-transparent !border-none !text-gray-900/30',
      }"
      @click="toggleExpanded"
    />
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

import { type Ref, ref } from 'vue'

export interface DashboardPanelComponentProps {
  weight?: number
  hugContent?: boolean
  maxWidth?: string // e.g '200px', '50%', '5rem'
  maxHeight?: string // e.g '200px', '50%', '5rem'
  canExpand?: boolean
  startExpanded?: boolean
  stayVisibleWhenOtherExpand?: boolean
}

const {
  weight = 1,
  hugContent = false,
  maxWidth = '',
  maxHeight = '',
  canExpand = false,
  startExpanded = false,
  stayVisibleWhenOtherExpand = false,
} = defineProps<DashboardPanelComponentProps>()

const expanded: Ref<boolean> = ref(startExpanded)
/**
 *
 */
function toggleExpanded() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.wefa-dashboard-panel {
  transition: inherit;

  margin: 0;
  flex-basis: 0;
  flex-grow: var(--weight);
  overflow: auto;
}
.wefa-dashboard-panel.hug-content {
  flex-basis: content;
  flex-grow: 0;
}
.wefa-dashboard-panel.has-max-width {
  max-width: var(--maxWidth);
}
.wefa-dashboard-panel.has-max-height {
  max-height: var(--maxHeight);
}

.wefa-dashboard.wefa-boxed-panels {
  .wefa-dashboard-panel {
    background: white;
    border-radius: 0.5rem;
    margin: 0;
    padding: 1rem;
  }
}

.wefa-dashboard-panel.wefa-expanded {
  max-width: unset;
  max-height: unset;

  /** Revert hug */
  flex-basis: unset;
  flex-grow: var(--weight);
}

.wefa-dashboard:has(.wefa-dashboard-panel.wefa-expanded) {
  .wefa-dashboard-panel:not(.wefa-expanded).wefa-dashboard-panel:not(
      .wefa-panel-still-visible-when-other-expands
    ) {
    display: none;
    /** Trying to animate instead */

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
