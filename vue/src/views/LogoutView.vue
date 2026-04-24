<template>
  <section class="flex min-h-svh items-center justify-center p-4 text-(--p-text-color)">
    <div class="flex items-center gap-3">
      <i class="pi pi-spin pi-spinner text-2xl" aria-hidden="true" />
      <span>{{ t('logout.signing_out') }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import type { BackendStore } from '@/stores'
import { useI18nLib } from '@/locales'

export interface LogoutViewProps {
  /** Backend store instance used to sign the user out. */
  backendStore: BackendStore
  /**
   * Where to send the user after logout completes. Defaults to the library's
   * named login route (`authLogin` — see `libRouteRecords.login.name`).
   */
  redirectTo?: RouteLocationRaw
}

const { backendStore, redirectTo = { name: 'authLogin' } } = defineProps<LogoutViewProps>()

const { t } = useI18nLib()
const router = useRouter()

onMounted(async () => {
  backendStore.logout()
  await router.push(redirectTo)
})
</script>
