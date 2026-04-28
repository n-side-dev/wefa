<template>
  <Dialog
    v-model:visible="cookiesStore.toggleDialog"
    modal
    :header="t('cookies.title')"
    :closable="false"
    :close-on-escape="false"
    class="wefa-cookies-dialog mx-3 w-full max-w-[44rem]"
    :pt="{
      mask: { class: 'backdrop-blur-sm' },
    }"
  >
    <p
      class="mb-5 text-[0.95rem] leading-relaxed text-(--p-surface-600) dark:text-[rgba(229,236,245,0.78)]"
    >
      {{ t('cookies.dialog_message') }}
    </p>

    <div
      class="overflow-hidden rounded-[1.25rem] border border-(--p-border-soft) bg-(--p-surface-0) dark:border-[rgba(255,255,255,0.07)] dark:bg-[rgba(13,21,37,0.6)]"
    >
      <DataTable :value="tableData" data-key="id" :pt="{ table: { class: '!m-0' } }">
        <Column field="name" :header="t('cookies.column_name')" />
        <Column field="description" :header="t('cookies.column_description')" />
        <Column field="type" :header="t('cookies.column_type')" />
        <Column field="consent" :header="t('cookies.column_consent')">
          <template #body="{ data }">
            <ToggleSwitch
              :model-value="data.consent"
              :disabled="data.isEssential"
              @update:model-value="(value) => onConsentChange(data, value)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-end gap-2 pt-2 sm:flex-nowrap">
        <Button
          :label="t('cookies.reject_all')"
          severity="secondary"
          outlined
          class="order-1 h-11 flex-1 rounded-full !border-(--p-border-color) px-5 !text-(--p-surface-700) hover:!bg-(--p-surface-100) hover:!border-(--p-surface-400) dark:!border-[rgba(229,236,245,0.28)] dark:!text-[rgba(233,239,255,0.92)] dark:hover:!bg-[rgba(255,255,255,0.06)] dark:hover:!border-[rgba(229,236,245,0.45)] sm:flex-none"
          @click="cookiesStore.rejectAllCookies"
        />
        <Button
          :label="t('cookies.save_preferences')"
          severity="secondary"
          text
          class="order-2 h-11 flex-1 rounded-full px-4 !text-(--p-surface-700) hover:!bg-(--p-surface-100) dark:!text-[rgba(233,239,255,0.92)] dark:hover:!bg-[rgba(255,255,255,0.06)] sm:flex-none"
          @click="savePreferences"
        />
        <Button
          :label="t('cookies.accept_all')"
          class="wefa-cookies-accept order-3 h-11 flex-1 rounded-full border-0 px-6 !bg-[linear-gradient(180deg,#2b3f73_0%,#233969_100%)] !text-white shadow-[0_14px_30px_-22px_rgba(22,41,80,0.42)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-22px_rgba(22,41,80,0.48)] dark:!bg-[linear-gradient(90deg,#17b6c8_0%,#74bf18_100%)] dark:!text-[#12213b] dark:shadow-[0_12px_26px_-22px_rgba(23,182,200,0.34)] sm:flex-none"
          @click="cookiesStore.acceptAllCookies"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import { useCookiesStore } from '../index'
import { useI18nLib } from '@/locales'

const cookiesStore = useCookiesStore()
const { t } = useI18nLib()

// Local state for consent preferences (prevents immediate saving)
const localConsents = ref<Record<string, boolean>>({})

// Initialize local consents from store
const initializeLocalConsents = () => {
  const consents: Record<string, boolean> = {}
  cookiesStore.cookies.forEach((cookie) => {
    consents[cookie.configuration.key] = cookie.consent
  })
  localConsents.value = consents
}

// Initialize on component mount
initializeLocalConsents()

// Transform cookies data for the table using local consent state
const tableData = computed(() => {
  return cookiesStore.cookies.map((cookie) => ({
    id: cookie.configuration.key,
    name: cookie.configuration.name,
    description: cookie.configuration.description,
    type: cookie.configuration.type,
    consent: localConsents.value[cookie.configuration.key] ?? cookie.consent,
    isEssential: cookie.configuration.type === 'Essential',
  }))
})

// Handle consent changes (only update local state, not store)
const onConsentChange = (data: Record<string, unknown>, newValue: boolean) => {
  // Prevent modification for Essential cookies
  if (data.isEssential) {
    return
  }

  // Update only local consent state
  localConsents.value[data.id as string] = newValue
}

// Save preferences to store and localStorage
const savePreferences = () => {
  // Update store with local consent values
  cookiesStore.cookies.forEach((cookie) => {
    const localConsent = localConsents.value[cookie.configuration.key]
    if (localConsent !== undefined) {
      cookie.consent = localConsent
    }
  })

  // Use store method to save preferences
  cookiesStore.saveCookiePreferences()
}
</script>

<style scoped>
:deep(.wefa-cookies-accept .p-button-icon),
:deep(.wefa-cookies-accept .p-button-label) {
  color: inherit;
}
</style>
