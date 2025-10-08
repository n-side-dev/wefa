<template>
  <Card
    class="size-full"
    :pt="{
      body: 'size-full',
      content: 'size-full overflow-auto',
    }"
  >
    <template v-if="props.title || props.showBreadcrumb" #title>
      <AutoroutedBreadcrumb v-if="props.showBreadcrumb" class="p-0! pb-2! text-sm" />
      <span v-if="props.title">{{ t(props.title) }}</span>
    </template>
    <template v-if="props.subtitle" #subtitle>
      <span v-if="props.subtitle">{{ t(props.subtitle) }}</span>
    </template>
    <template #content>
      <slot></slot>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import AutoroutedBreadcrumb from '@/components/AutoroutedBreadcrumb/AutoroutedBreadcrumb.vue'
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()

export interface PageComponentProps {
  title?: string
  subtitle?: string
  showBreadcrumb?: boolean
}

const props = defineProps<PageComponentProps>()
</script>
