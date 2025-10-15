<template>
  <Dialog
    v-model:visible="cookiesStore.toggleDialog"
    modal
    header="Cookie Preferences"
    :closable="false"
    :close-on-escape="false"
    class="m-2"
  >
    <div class="p-4">
      <DataTable :value="tableData" data-key="id">
        <Column field="name" header="Name" />
        <Column field="description" header="Description" />
        <Column field="type" header="Type" />
        <Column field="consent" header="Consent">
          <template #body="{ data }">
            <ToggleSwitch
              :model-value="data.consent"
              :disabled="data.isEssential"
              @update:model-value="(value) => onConsentChange(data, value)"
            />
          </template>
        </Column>
      </DataTable>

      <div class="mt-6 flex flex-wrap justify-center gap-4">
        <Button
          label="Accept All"
          class="p-button-success min-w-[150px]"
          @click="cookiesStore.acceptAllCookies"
        />
        <Button
          label="Reject All"
          class="p-button-secondary min-w-[150px]"
          @click="cookiesStore.rejectAllCookies"
        />
        <Button
          label="Save Preferences"
          class="p-button-primary min-w-[150px]"
          @click="savePreferences"
        />
      </div>
    </div>
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

const cookiesStore = useCookiesStore()

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
