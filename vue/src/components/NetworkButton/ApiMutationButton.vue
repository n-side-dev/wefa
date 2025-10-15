<template>
  <Button
    :label="t(currentButtonConfig.text as string)"
    :icon="currentButtonConfig.icon"
    :severity="currentButtonConfig.severity"
    :loading="isLoading"
    :disabled="currentButtonConfig.disabled"
    :class="[currentButtonConfig.class, 'network-button']"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
/**
 * @description A network-aware button component that displays different states based on API call status.
 * Built on PrimeVue Button component with automatic state management for loading, success, error, and default states.
 * Supports relaunchable functionality for both success and error states.
 */
import Button from 'primevue/button'
import { computed } from 'vue'
import { useI18nLib } from '@/locales'
import { type ApiMutationButtonProps } from './types'

const {
  mutation,
  mutationBody,
  relaunchableOnError = false,
  relaunchableOnSuccess = false,
  defaultButton = {
    text: 'network_button.submit',
  },
  successButton = {
    text: 'network_button.success',
    icon: 'pi pi-check',
  },
  errorButton = {
    text: 'network_button.error',
    icon: 'pi pi-exclamation-triangle',
  },
  loadingButton = {
    text: 'network_button.loading',
  },
} = defineProps<ApiMutationButtonProps>()

const { t } = useI18nLib()

/**
 * Computed property that safely accesses the loading state
 */
const isLoading = computed(() => {
  return mutation?.isPending?.value ?? false
})

/**
 * Computed property that determines the current button configuration based on API state
 */
const currentButtonConfig = computed(() => {
  // Safely access reactive values with defensive checks
  const hasResult = mutation?.data?.value !== undefined && mutation?.data?.value !== null
  const hasError = mutation?.error?.value !== undefined && mutation?.error?.value !== null

  // Loading state - highest priority
  if (isLoading.value) {
    return {
      text: loadingButton.text ?? 'network_button.loading',
      icon: loadingButton.icon,
      severity: 'info' as const,
      disabled: true,
      class: loadingButton.class,
    }
  }

  // Success state - when we have a result and not loading
  if (hasResult && !isLoading.value) {
    return {
      text: successButton.text ?? 'network_button.success',
      icon: successButton.icon,
      severity: 'success' as const,
      disabled: !relaunchableOnSuccess,
      class: successButton.class,
    }
  }

  // Error state - when we have an error and not loading
  if (hasError && !isLoading.value) {
    return {
      text: relaunchableOnError
        ? 'network_button.retry'
        : (errorButton.text ?? 'network_button.error'),
      icon: errorButton.icon,
      severity: 'danger' as const,
      disabled: !relaunchableOnError,
      class: errorButton.class,
    }
  }

  // Default state - initial state or when no result/error
  return {
    text: defaultButton.text ?? 'network_button.submit',
    icon: defaultButton.icon,
    severity: 'primary' as const,
    disabled: false,
    class: defaultButton.class,
  }
})

/**
 * Handles button click events based on current state
 */
const handleClick = () => {
  // Only trigger action if button is not disabled
  if (!currentButtonConfig.value.disabled) {
    mutation.mutate(mutationBody.value)
  }
}
</script>
