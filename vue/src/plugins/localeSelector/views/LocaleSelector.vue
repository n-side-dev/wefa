<template>
  <Select
    :model-value="store.locale"
    :options="options"
    option-label="label"
    option-value="value"
    :aria-label="t('locale_selector.label')"
    :pt="{ root: { class: 'wefa-locale-selector' } }"
    @update:model-value="handleChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import { useI18nLib } from '@/locales'
import { useLocaleStore } from '../index'

const store = useLocaleStore()
const { t } = useI18nLib()

const options = computed(() =>
  store.availableLocales.map((code) => ({
    value: code,
    label: displayName(code),
  }))
)

/**
 * Resolve a human-friendly label for a locale code using the browser's
 * `Intl.DisplayNames`, then capitalize the first letter. Some locales (e.g.
 * French) return lowercase names from `DisplayNames` — this is a display-only
 * adjustment, not a change to the underlying translation data. Falls back to
 * the raw code when the platform does not support the API.
 * @param code BCP-47 style locale code.
 * @returns Localized, capitalized display name, or the raw code.
 */
function displayName(code: string): string {
  try {
    const names = new Intl.DisplayNames([store.locale], { type: 'language' })
    const name = names.of(code) ?? code
    if (!name) return code
    return name.charAt(0).toLocaleUpperCase(store.locale) + name.slice(1)
  } catch {
    return code
  }
}

/**
 * Handle a change from the Select — forward to the store's setLocale action.
 * @param value The selected locale code.
 */
async function handleChange(value: string) {
  await store.setLocale(value)
}
</script>
