<template>
  <PageComponent
    title="demo.checkout_page_title"
    subtitle="demo.checkout_page_subtitle"
    :show-breadcrumb="true"
  >
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-zinc-950">
          {{ t('demo.checkout_summary_title') }}
        </h2>
        <ul class="mt-5 space-y-4 text-sm text-zinc-600">
          <li v-for="item in cartItems" :key="item.name" class="flex items-center justify-between">
            <span>{{
              t('demo.checkout_item_label', { name: item.name, quantity: item.quantity })
            }}</span>
            <span class="font-medium text-zinc-950">{{ item.linePrice }}</span>
          </li>
        </ul>

        <div class="mt-6 rounded-2xl bg-zinc-950 p-5 text-white">
          <p class="text-sm uppercase tracking-[0.2em] text-zinc-300">
            {{ t('demo.checkout_total_title') }}
          </p>
          <p class="mt-2 text-3xl font-semibold">{{ totalPrice }}</p>
        </div>
      </section>

      <aside class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {{ t('demo.checkout_next_steps_title') }}
        </h2>
        <ol class="mt-4 space-y-3 text-sm text-zinc-600">
          <li>1. {{ t('demo.checkout_next_step_one') }}</li>
          <li>2. {{ t('demo.checkout_next_step_two') }}</li>
          <li>3. {{ t('demo.checkout_next_step_three') }}</li>
        </ol>
      </aside>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { PageComponent } from '@/components/PageComponent'
import { useDemoCart } from '@/demo/cart'
import { useI18nLib } from '@/locales'

const { t } = useI18nLib()
const { cartItems, totalPrice } = useDemoCart()
</script>
