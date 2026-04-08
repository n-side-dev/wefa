<template>
  <PageComponent
    title="demo.catalog_page_title"
    subtitle="demo.catalog_page_subtitle"
    :show-breadcrumb="true"
  >
    <div class="flex flex-col gap-6">
      <div
        class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm"
        data-test="catalog-highlight-panel"
      >
        <p class="text-sm font-semibold text-zinc-900">
          {{ t('demo.catalog_highlight_title') }}
        </p>
        <p class="mt-2 text-sm text-zinc-600">
          {{
            highlightName
              ? t('demo.catalog_highlight_value', { name: highlightName })
              : t('demo.catalog_highlight_empty')
          }}
        </p>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <article
          v-for="product in products"
          :key="product.name"
          class="flex h-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-zinc-950">{{ product.name }}</h2>
              <p class="text-sm text-zinc-500">{{ product.category }}</p>
            </div>
            <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {{ product.stock }}
            </span>
          </div>

          <p class="grow text-sm text-zinc-600">{{ product.description }}</p>

          <div class="flex items-center justify-between gap-4">
            <span class="text-base font-semibold text-zinc-950">{{ product.price }}</span>
            <RouterLink
              :to="{ name: 'cart', query: { product: product.name, quantity: '1' } }"
              class="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              {{ t('demo.catalog_add_to_cart') }}
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { PageComponent } from '@/components/PageComponent'
import { useDemoCatalog } from '@/demo/catalog'
import { useI18nLib } from '@/locales'

const route = useRoute()
const { t } = useI18nLib()
const { products } = useDemoCatalog()

const highlightName = computed(() => {
  const rawValue = route.query.highlight
  return typeof rawValue === 'string' ? rawValue : ''
})
</script>
