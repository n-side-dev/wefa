<!--
  ConfiguredControlBarComponent - A dynamic control bar that renders components based on configuration

  This component creates a flexible control bar where each item is configured through a configuration array.
  Each item can display different components (Badge, ProgressBar, Message, Rating, etc.) with custom props.

  @example
  ```vue
  <ConfiguredControlBarComponent
    v-model="{ score: 85, status: 'active', count: 5 }"
    :config="[
      { title: 'Score', component: 'ProgressBar', data: 'score' },
      { title: 'Status', component: 'Badge', data: 'status', props: { severity: 'success' } },
      { title: 'Count', component: 'Badge', data: 'count' }
    ]"
  />
  ```
-->
<template>
  <ControlBarComponent>
    <ControlBarItemComponent v-for="(item, index) in config" :key="index" :title="item.title">
      <component
        :is="resolve(item.component)"
        :model-value="model[item.data]"
        :value="model[item.data]"
        :label="model[item.data]"
        v-bind="item.props"
      />
    </ControlBarItemComponent>
  </ControlBarComponent>
</template>

<script lang="ts" setup>
import { useComponentResolver } from '@/composables/useComponentResolver.ts'
import ControlBarComponent from '@/components/ControlBarComponent/ControlBarComponent.vue'
import ControlBarItemComponent from '@/components/ControlBarComponent/ControlBarItemComponent.vue'

const { resolve } = useComponentResolver()

const model = defineModel<Record<string, unknown>>({ default: () => ({}) })

/**
 * Configuration for a single control bar item
 */
export interface ControlBarItemConfiguration {
  /** The title displayed above the component */
  title: string
  /** The name of the component to render (must be registered in componentRegistry) */
  component: string
  /** The key in the data object to use as the component's value/label */
  data: string
  /** Additional props to pass to the component */
  props?: Record<string, unknown>
}

/**
 * Props for the ConfiguredControlBarComponent
 */
export interface ConfiguredControlBarComponentProps {
  /** Array of configurations for each control bar item */
  config: ControlBarItemConfiguration[]
}

const { config } = defineProps<ConfiguredControlBarComponentProps>()
</script>
