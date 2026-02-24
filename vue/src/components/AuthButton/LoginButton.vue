<template>
  <Button
    :label="label"
    :icon="icon"
    :severity="severity"
    :disabled="computedDisabled"
    :loading="isLoading"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed, ref, getCurrentInstance } from 'vue'
import Button from 'primevue/button'
import { useBackendStore } from '@/stores'
import { libRouteRecords } from '@/router'

export interface LoginButtonProps {
  label?: string
  icon?: string
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast'
  disabled?: boolean
  redirectTo?: string
}

const {
  label = 'Sign in',
  icon = 'pi pi-sign-in',
  severity = 'secondary',
  disabled = false,
  redirectTo = libRouteRecords.login.path,
} = defineProps<LoginButtonProps>()

const backendStore = useBackendStore()
const isLoading = ref(false)
const computedDisabled = computed(() => disabled || isLoading.value)

function resolveRedirectTarget(): string {
  return redirectTo
}

function redirectToTarget(target: string) {
  const router = getCurrentInstance()?.appContext.config.globalProperties.$router
  if (router && typeof router.push === 'function') {
    router.push(target).catch(() => {})
    return
  }
  window.location.assign(target)
}

async function handleClick() {
  if (isLoading.value) return
  isLoading.value = true
  try {
    if (backendStore.authenticationType === 'BFF') {
      await backendStore.login()
    } else {
      redirectToTarget(resolveRedirectTarget())
    }
  } finally {
    isLoading.value = false
  }
}
</script>
