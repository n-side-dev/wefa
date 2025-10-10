import { type Ref } from 'vue'
import type { AxiosError } from 'axios'
import { type UseQueryReturnType, type UseMutationReturnType } from '@tanstack/vue-query'

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
 * Partial props for the NetworkButton component
 */
export interface BaseApiButtonProps {
  /** Whether the button can be clicked again after an error occurs */
  relaunchableOnError?: boolean
  /** Whether the button can be clicked again after a successful response */
  relaunchableOnSuccess?: boolean
  /** The API interface object that manages the network request state */
  /** Configuration for the default/initial button state */
  defaultButton?: SingleNetworkButtonProps
  /** Configuration for the success button state */
  successButton?: SingleNetworkButtonProps
  /** Configuration for the error button state */
  errorButton?: SingleNetworkButtonProps
  /** Configuration for the loading button state */
  loadingButton?: SingleNetworkButtonProps
}

export interface ApiQueryButtonProps extends BaseApiButtonProps {
  query: UseQueryReturnType<unknown, AxiosError>
}

export interface ApiMutationButtonProps extends BaseApiButtonProps {
  mutation: UseMutationReturnType<unknown, AxiosError, unknown, unknown>
  mutationBody: Ref<unknown | undefined>
}
