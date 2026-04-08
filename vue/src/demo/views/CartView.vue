<template>
  <PageComponent
    title="demo.cart_page_title"
    subtitle="demo.cart_page_subtitle"
    :show-breadcrumb="true"
  >
    <div class="space-y-6">
      <div
        class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        data-test="cart-focus-banner"
      >
        {{
          focusName
            ? t('demo.cart_focus_banner', { name: focusName, quantity: focusQuantity })
            : t('demo.cart_focus_empty')
        }}
      </div>

      <div class="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-zinc-200 text-sm">
          <thead class="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th class="px-5 py-3 font-medium">{{ t('demo.cart_table_product') }}</th>
              <th class="px-5 py-3 font-medium">{{ t('demo.cart_table_quantity') }}</th>
              <th class="px-5 py-3 font-medium">{{ t('demo.cart_table_price') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-for="item in cartItems" :key="item.name">
              <td class="px-5 py-4 font-medium text-zinc-950">{{ item.name }}</td>
              <td class="px-5 py-4 text-zinc-600">{{ item.quantity }}</td>
              <td class="px-5 py-4 text-zinc-600">{{ item.linePrice }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <RouterLink
          :to="{ name: 'checkout' }"
          class="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          {{ t('demo.cart_go_to_checkout') }}
        </RouterLink>
        <RouterLink
          :to="{ name: 'catalogHome' }"
          class="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
        >
          {{ t('demo.cart_back_to_catalog') }}
        </RouterLink>
      </div>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { PageComponent } from '@/components/PageComponent'
import { useDemoCart } from '@/demo/cart'
import { useI18nLib } from '@/locales'

const route = useRoute()
const { t } = useI18nLib()
const { cartItems, upsertProduct } = useDemoCart()
let lastAppliedCartAction = ''

const focusName = computed(() => {
  const rawValue = route.query.product ?? route.query.focus
  return typeof rawValue === 'string' ? rawValue : ''
})

const focusQuantity = computed(() => {
  const rawValue = route.query.quantity
  return typeof rawValue === 'string' ? rawValue : '1'
})

watch(
  () => `${focusName.value}::${focusQuantity.value}`,
  (signature) => {
    if (!focusName.value || signature === lastAppliedCartAction) {
      return
    }

    upsertProduct(focusName.value, focusQuantity.value)
    lastAppliedCartAction = signature
  },
  { immediate: true }
)
</script>
