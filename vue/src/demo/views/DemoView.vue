<template>
  <div
    class="flex flex-col items-center justify-center gap-6 rounded-3xl bg-white p-8 shadow-xl"
    data-test="demo-home"
  >
    <div class="space-y-3 text-center">
      <h1 class="text-3xl font-semibold text-zinc-950">{{ t('demo.home_title') }}</h1>
      <p class="max-w-2xl text-sm text-zinc-600">
        {{ t('demo.home_subtitle') }}
      </p>
    </div>

    <Divider />

    <div class="grid gap-3 text-center text-sm text-zinc-600">
      <span>{{ t('demo.home_shortcut') }}</span>
      <span>
        {{ t('demo.home_storybook_prefix') }}
        <span class="rounded bg-primary-100 px-2 font-mono">npm run storybook</span>
        {{ t('demo.home_storybook_suffix') }}
      </span>
    </div>

    <Divider />

    <div class="flex flex-wrap items-center justify-center gap-3">
      <RouterLink :to="{ name: 'catalogHome' }">
        <Button :label="t('demo.home_open_catalog')" />
      </RouterLink>
      <RouterLink :to="{ name: 'productCreate' }">
        <Button severity="secondary" :label="t('demo.home_open_product_create')" />
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
