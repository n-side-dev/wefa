<template>
  <div
    class="flex size-full flex-col gap-4 rounded-xl border border-(--p-border-color) bg-(--p-surface-elevated) p-6 text-(--p-text-color)"
  >
    <div>
      <h2 class="text-2xl font-semibold">{{ t('demo.demo_content.title') }}</h2>
      <p class="text-sm text-(--p-text-muted-color)">{{ t('demo.demo_content.subtitle') }}</p>
    </div>

    <div
      class="flex size-100 items-center justify-center rounded border border-(--p-border-color) bg-(--p-surface-100) text-(--p-text-color)"
    >
      <span class="text-center">
        {{ t('demo.demo_content.body_line1') }}<br />
        {{ t('demo.demo_content.body_line2') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()
</script>
