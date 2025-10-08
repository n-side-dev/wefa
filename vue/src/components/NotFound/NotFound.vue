<template>
  <Card class="max-w-md mx-auto mt-24 shadow-lg">
    <template #title>
      <div class="flex items-center justify-center gap-2">
        <span class="text-5xl font-bold text-red-500">{{ code }}</span>
        <Divider layout="vertical" />
        <span class="text-xl font-semibold text-gray-700">{{ $t(title) }}</span>
      </div>
    </template>
    <template #content>
      <p v-if="msg !== undefined" class="text-center text-gray-600 mb-6">
        {{ $t(msg) }}
      </p>
      <slot />
      <div class="flex justify-center mt-8">
        <Button
          :label="t(buttonLabel)"
          :icon="buttonIcon"
          class="p-button-rounded p-button-secondary mr-2"
          @click="$router.push(buttonRoute || '/')"
        />
        <Button
          :label="t(goBackLabel)"
          icon="pi pi-arrow-left"
          class="p-button-rounded p-button-text"
          @click="$router.back()"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Card from 'primevue/card'
import { useI18nLib } from '@/locales'

// Props
export interface NotFoundProps {
  code?: string
  title?: string
  msg?: string
  buttonLabel?: string
  buttonIcon?: string
  buttonRoute?: string
  goBackLabel?: string
}

const {
  code = '404',
  title = 'not_found.title',
  msg = 'not_found.message',
  buttonLabel = 'not_found.go_home',
  buttonIcon = 'pi pi-home',
  buttonRoute = '/',
  goBackLabel = 'not_found.go_back',
} = defineProps<NotFoundProps>()

const { t } = useI18nLib()
</script>
