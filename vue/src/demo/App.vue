<template>
  <template v-if="!isAuthenticated || isFullscreenRoute">
    <router-view />
    <Toast />
    <ConfirmDialog />
  </template>
  <template v-else>
    <LayoutContainer project-title="WeFa">
      <template #navigation-bottom>
        <NavigationBottom />
      </template>
    </LayoutContainer>
  </template>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import LayoutContainer from '@/containers/LayoutContainer/LayoutContainer.vue'
import { backendStore } from '@/demo/backendStore'
import NavigationBottom from '@/demo/components/NavigationBottom.vue'

const route = useRoute()

// Pinia auto-unwraps refs on the store, so `backendStore.authenticated` is a
// plain boolean. `unref()` keeps this safe against future type refactors.
const isAuthenticated = computed(() => Boolean(unref(backendStore.authenticated)))
const isFullscreenRoute = computed(() => Boolean(route.meta.wefa?.fullscreen))
</script>
