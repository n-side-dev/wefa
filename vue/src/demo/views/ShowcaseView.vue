<template>
  <section>
    <div
      class="m-4 flex h-[calc(100%-var(--spacing)*8)] w-[calc(100%-var(--spacing)*8)] flex-col rounded-xl border border-(--p-border-color) bg-(--p-surface-elevated) p-4 text-(--p-text-color) shadow"
    >
      <!-- Write your custom content below -->

      <div class="flex flex-col gap-1">
        <span>{{ t('demo.showcase.welcome') }}</span>

        <span>{{ t('demo.showcase.edit_intro') }}</span>

        <span class="rounded bg-(--p-surface-100) px-2 py-0.5 text-center font-mono"
          >vue/src/demo/ShowcaseView.vue</span
        >

        <span>{{ t('demo.showcase.try_wefa') }}</span>

        <span>{{ t('demo.showcase.try_primevue') }}</span>

        <span>{{ t('demo.showcase.try_tailwind') }}</span>

        <span>{{ t('demo.showcase.try_other') }}</span>

        <span>{{ t('demo.showcase.like_this') }}</span>

        <Divider></Divider>

        <Button :label="t('demo.showcase.primevue_button')"></Button>
      </div>

      <!-- Write your custom content above -->
    </div>
  </section>
</template>

<script setup lang="ts">
import Divider from 'primevue/divider'
import Button from 'primevue/button'
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()
</script>
