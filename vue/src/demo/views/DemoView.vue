<template>
  <div class="flex items-center justify-center p-4">
    <div
      class="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-3xl border border-(--p-border-color) bg-(--p-surface-elevated) p-8 text-(--p-text-color) shadow-xl"
    >
      <h1 class="text-center text-xl font-semibold">{{ t('demo.home.title') }}</h1>

      <Divider />

      <span class="text-center">
        {{ t('demo.home.storybook_intro') }}
        <code class="rounded bg-(--p-surface-100) px-2 py-0.5 font-mono text-(--p-text-color)"
          >npm run storybook</code
        >
        {{ t('demo.home.storybook_instead') }}
      </span>

      <Divider />

      <RouterLink :to="{ name: 'showcase' }">
        <Button :label="t('demo.home.access_showcase')" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import Divider from 'primevue/divider'
import Button from 'primevue/button'
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()
</script>
