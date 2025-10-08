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
import type { ApiInterface } from '@/network/apiClient'
import { computed } from 'vue'
import { useI18nLib } from '@/locales'

/**
 * Configuration for a single button state
 */
export interface SingleNetworkButtonProps {
  /** The text to display on the button */
  text?: string
  /** Additional CSS classes to apply to the button */
  class?: string
  /** PrimeIcon class name (e.g., 'pi pi-check') */
  icon?: string
}

/**
 * Props for the NetworkButton component
 */
export interface NetworkButtonProps {
  /** Whether the button can be clicked again after an error occurs */
  relaunchableOnError?: boolean
  /** Whether the button can be clicked again after a successful response */
  relaunchableOnSuccess?: boolean
  /** The API interface object that manages the network request state */
  query: ApiInterface
  /** Configuration for the default/initial button state */
  defaultButton?: SingleNetworkButtonProps
  /** Configuration for the success button state */
  successButton?: SingleNetworkButtonProps
  /** Configuration for the error button state */
  errorButton?: SingleNetworkButtonProps
  /** Configuration for the loading button state */
  loadingButton?: SingleNetworkButtonProps
}

const {
  relaunchableOnError = false,
  relaunchableOnSuccess = false,
  query,
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
} = defineProps<NetworkButtonProps>()

const { t } = useI18nLib()

/**
 * Computed property that safely accesses the loading state
 */
const isLoading = computed(() => {
  return query?.loading?.value ?? false
})

/**
 * Computed property that determines the current button configuration based on API state
 */
const currentButtonConfig = computed(() => {
  // Safely access reactive values with defensive checks
  const hasResult = query?.result?.value !== undefined && query?.result?.value !== null
  const hasError = query?.error?.value !== undefined && query?.error?.value !== null

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
    query.action()
  }
}
</script>
