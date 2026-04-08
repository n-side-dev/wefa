<template>
  <PageComponent
    title="demo.product_create_page_title"
    subtitle="demo.product_create_page_subtitle"
    :show-breadcrumb="true"
  >
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-zinc-950">
              {{ t('demo.product_create_form_title') }}
            </h2>
            <p class="mt-1 text-sm text-zinc-500">
              {{ t('demo.product_create_form_hint') }}
            </p>
          </div>
          <span
            class="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
            data-test="product-create-prefill-badge"
          >
            {{ t('demo.product_create_prefill_badge') }}
          </span>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            <span>{{ t('demo.product_field_name') }}</span>
            <InputText v-model="form.name" data-test="product-create-name" />
          </label>

          <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            <span>{{ t('demo.product_field_category') }}</span>
            <InputText v-model="form.category" data-test="product-create-category" />
          </label>

          <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            <span>{{ t('demo.product_field_price') }}</span>
            <InputText v-model="form.price" data-test="product-create-price" />
          </label>

          <label class="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            <span>{{ t('demo.product_field_stock') }}</span>
            <InputText v-model="form.stock" data-test="product-create-stock" />
          </label>
        </div>

        <label class="mt-5 flex flex-col gap-2 text-sm font-medium text-zinc-700">
          <span>{{ t('demo.product_field_description') }}</span>
          <Textarea
            v-model="form.description"
            auto-resize
            rows="5"
            data-test="product-create-description"
          />
        </label>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <Button
            :label="t('demo.product_create_submit')"
            :disabled="isSaveDisabled"
            data-test="product-create-save"
            @click="saveProduct"
          />
          <RouterLink
            :to="{ name: 'catalogHome' }"
            class="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
          >
            {{ t('demo.product_create_back_to_catalog') }}
          </RouterLink>
        </div>
      </section>

      <aside class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {{ t('demo.product_create_prefill_summary_title') }}
        </h2>
        <dl class="mt-4 space-y-4 text-sm">
          <div>
            <dt class="text-zinc-500">{{ t('demo.product_field_name') }}</dt>
            <dd class="font-medium text-zinc-950">{{ form.name || '—' }}</dd>
          </div>
          <div>
            <dt class="text-zinc-500">{{ t('demo.product_field_category') }}</dt>
            <dd class="font-medium text-zinc-950">{{ form.category || '—' }}</dd>
          </div>
          <div>
            <dt class="text-zinc-500">{{ t('demo.product_field_price') }}</dt>
            <dd class="font-medium text-zinc-950">{{ form.price || '—' }}</dd>
          </div>
          <div>
            <dt class="text-zinc-500">{{ t('demo.product_field_stock') }}</dt>
            <dd class="font-medium text-zinc-950">{{ form.stock || '—' }}</dd>
          </div>
        </dl>
      </aside>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

import { PageComponent } from '@/components/PageComponent'
import { useDemoCatalog } from '@/demo/catalog'
import { useI18nLib } from '@/locales'

const route = useRoute()
const router = useRouter()
const { t } = useI18nLib()
const { addProduct } = useDemoCatalog()

interface ProductFormState {
  name: string
  category: string
  price: string
  stock: string
  description: string
}

const form = reactive<ProductFormState>({
  name: '',
  category: '',
  price: '',
  stock: '',
  description: '',
})

watch(
  () => route.query,
  (query) => {
    form.name = typeof query.name === 'string' ? query.name : ''
    form.category = typeof query.category === 'string' ? query.category : ''
    form.price = typeof query.price === 'string' ? query.price : ''
    form.stock = typeof query.stock === 'string' ? query.stock : ''
    form.description = typeof query.description === 'string' ? query.description : ''
  },
  { immediate: true, deep: true }
)

const isSaveDisabled = computed(() => {
  return form.name.trim().length === 0 || form.category.trim().length === 0
})

/**
 * Saves the product into the in-memory demo catalog and returns to the catalog view.
 */
function saveProduct() {
  if (isSaveDisabled.value) {
    return
  }

  addProduct(form)
  router
    .push({
      name: 'catalogHome',
      query: {
        highlight: form.name,
      },
    })
    .catch(() => {
      // Ignore duplicate navigation in the demo shell.
    })
}
</script>
