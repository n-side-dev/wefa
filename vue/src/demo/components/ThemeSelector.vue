<template>
  <SelectButton
    :model-value="darkModeStore.mode"
    :options="options"
    option-label="label"
    option-value="value"
    :allow-empty="false"
    :aria-label="t('demo.theme.label')"
    size="small"
    @update:model-value="apply"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SelectButton from 'primevue/selectbutton'
import { useDarkModeStore } from '@/stores'
import { useI18nLib } from '@/locales'

const darkModeStore = useDarkModeStore()
const { t } = useI18nLib()

type Mode = 'system' | 'light' | 'dark'

const options = computed<{ value: Mode; label: string }[]>(() => [
  { value: 'system', label: t('demo.theme.system') },
  { value: 'light', label: t('demo.theme.light') },
  { value: 'dark', label: t('demo.theme.dark') },
])

/**
 * Apply the chosen theme mode via the dark-mode store.
 * @param mode Selected mode value from the SelectButton.
 */
function apply(mode: Mode) {
  if (mode === 'light') darkModeStore.setLightMode()
  else if (mode === 'dark') darkModeStore.setDarkMode()
  else darkModeStore.setSystemMode()
}
</script>
