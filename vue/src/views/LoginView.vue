<template>
  <PageComponent title="Login">
    <div class="flex flex-col gap-4">
      <p v-if="!isBff" class="text-sm text-surface-600">
        This view supports BFF authentication only. Provide a custom login view for other modes.
      </p>
      <template v-else>
        <p class="text-sm text-surface-700">
          {{ resolvedAutoRedirect ? 'Redirecting to the login provider...' : 'Continue to login.' }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            label="Continue to login"
            :loading="isLoading"
            :disabled="resolvedAutoRedirect"
            @click="performLogin"
          />
          <span v-if="isLoading" class="text-xs text-surface-500">Starting login flow...</span>
        </div>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      </template>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import PageComponent from '@/components/PageComponent/PageComponent.vue'
import { useBackendStore } from '@/stores'

export interface LoginViewProps {
  gdpr?: boolean
  autoRedirect?: boolean
}

const { autoRedirect = undefined } = defineProps<LoginViewProps>()

const backendStore = useBackendStore()
const isLoading = ref(false)
const errorMessage = ref('')

const isBff = computed(() => backendStore.authenticationType === 'BFF')
const resolvedAutoRedirect = computed(() => {
  return autoRedirect ?? backendStore.bffOptions?.flow?.loginRedirect ?? true
})

async function performLogin() {
  if (!isBff.value || isLoading.value) return
  errorMessage.value = ''
  isLoading.value = true
  try {
    await backendStore.login()
  } catch (error) {
    errorMessage.value = (error as Error).message ?? 'Login failed.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (isBff.value && resolvedAutoRedirect.value) {
    await performLogin()
  }
})
</script>
