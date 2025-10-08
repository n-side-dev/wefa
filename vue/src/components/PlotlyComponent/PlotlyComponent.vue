<template>
  <section class="plotly-component">
    <div :id="plotlyId" class="plotly-container"></div>
  </section>
</template>

<script setup lang="ts">
/**
 * @description A Vue component that wraps Plotly.js to create interactive charts and graphs.
 * The component provides a reactive interface to Plotly.js with sensible defaults and automatic
 * updates when props change. It supports all Plotly.js chart types and configurations.
 */
import Plotly, { type Data, type Layout, type Config } from 'plotly.js-dist-min'
import { onMounted, getCurrentInstance, onUpdated, computed, type ComputedRef } from 'vue'

/**
 * Props for the PlotlyComponent
 */
export interface PlotlyComponentProps {
  /** Array of data objects that define the traces to be plotted */
  data: Data[]
  /** Layout configuration object that defines the plot's appearance and behavior */
  layout?: Partial<Layout>
  /** Configuration object that defines plot interaction and display options */
  config?: Partial<Config>
}

const props = defineProps<PlotlyComponentProps>()

/**
 * Get unique identifier from Vue instance for the Plotly container
 * Plotly needs a unique DOM element ID to target for rendering
 */
const instance = getCurrentInstance()
const plotlyId = `plotly-${instance?.uid}`

const baseLayout: Partial<Layout> = {
  height: 400,
}

const baseConfig: Partial<Config> = {
  responsive: true,
}

/**
 * Computed property that merges user-provided layout with base layout
 * User props will override base layout properties
 */
const mergedLayout: ComputedRef<Partial<Layout>> = computed(() => {
  return {
    ...baseLayout,
    ...props.layout,
  }
})

/**
 * Computed property that merges user-provided config with base config
 * User props will override base config properties
 */
const mergedConfig: ComputedRef<Partial<Config>> = computed(() => {
  return {
    ...baseConfig,
    ...props.config,
  }
})

/**
 * Creates the initial Plotly plot when the component is mounted
 */
onMounted(() => {
  Plotly.newPlot(plotlyId, props.data, mergedLayout.value, mergedConfig.value)
})

/**
 * Updates the Plotly plot when component props change
 * Uses Plotly.react for efficient updates
 */
onUpdated(() => {
  Plotly.react(plotlyId, props.data, mergedLayout.value, mergedConfig.value)
})
</script>

<style scoped>
.plotly-container {
  /* Plotly has troubles to size the container of the plot,
  so we explicitly link the height from the layout */
  height: v-bind('mergedLayout.height');
}
</style>
