<template>
  <div
    class="flex"
    :class="{
      'w-full': width === 'full',
      'h-full': height === 'full',
      'flex-col': direction === 'column',
      'flex-row': direction === 'row',
      'items-center justify-center': center,
    }"
  >
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { setupDepthTracker } from '../helpers'

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
setupDepthTracker()

export interface BareContainerProps {
  width?: 'full' | 'hug'
  height?: 'full' | 'hug'
  direction?: 'column' | 'row'
  center?: boolean
}

const {
  width = 'full',
  height = 'full',
  direction = 'column',
  center = false,
} = defineProps<BareContainerProps>()
</script>
