<template>
  <PageComponent title="Logout">
    <div class="flex flex-col gap-4">
      <p v-if="!isBff" class="text-sm text-surface-600">
        This view supports BFF authentication only. Provide a custom logout view for other modes.
      </p>
      <template v-else>
        <p class="text-sm text-surface-700">
          {{ resolvedAutoLogout ? 'Signing you out...' : 'Confirm logout.' }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            label="Sign out"
            severity="secondary"
            :loading="isLoading"
            :disabled="resolvedAutoLogout"
            @click="performLogout"
          />
          <span v-if="isLoading" class="text-xs text-surface-500">Ending session...</span>
        </div>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      </template>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import PageComponent from '@/components/PageComponent/PageComponent.vue'
import { useBackendStore } from '@/stores'

export interface LogoutViewProps {
  autoLogout?: boolean
}

const { autoLogout = undefined } = defineProps<LogoutViewProps>()

const backendStore = useBackendStore()
const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')

const isBff = computed(() => backendStore.authenticationType === 'BFF')
const resolvedAutoLogout = computed(() => {
  return autoLogout ?? backendStore.bffOptions?.flow?.logoutRedirect ?? true
})
const logoutRedirectUrl = computed(() => {
  return backendStore.bffOptions?.flow?.logoutRedirectUrl ?? '/auth/login'
})

function redirectToTarget(target: string) {
  if (target.startsWith('http://') || target.startsWith('https://')) {
    window.location.assign(target)
    return
  }
  router.push(target).catch(() => {})
}

async function performLogout() {
  if (!isBff.value || isLoading.value) return
  errorMessage.value = ''
  isLoading.value = true
  try {
    await backendStore.logout()
    if (backendStore.bffOptions?.flow?.logoutRedirect ?? true) {
      redirectToTarget(logoutRedirectUrl.value)
    }
  } catch (error) {
    errorMessage.value = (error as Error).message ?? 'Logout failed.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (isBff.value && resolvedAutoLogout.value) {
    await performLogout()
  }
})
</script>
