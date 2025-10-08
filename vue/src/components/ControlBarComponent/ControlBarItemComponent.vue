<template>
  <div class="flex flex-col px-0.5 py-1 box-border">
    <span class="font-medium">{{ title }}</span>
    <Divider :pt="dividerPassThrough" />
    <div class="flex-grow flex items-center">
      <div class="w-full">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Divider from 'primevue/divider'
export interface ControlBarItemComponentProps {
  title: string
}

const dividerPassThrough = {
  root: '!my-2 !w-[calc(100%+0.5rem)]',
}
const { title } = defineProps<ControlBarItemComponentProps>()
</script>
