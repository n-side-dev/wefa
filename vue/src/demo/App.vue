<template>
  <template v-if="isAuthenticated">
    <LayoutContainer project-title="WeFa">
      <template #navigation-bottom>
        <NavigationBottom />
      </template>
    </LayoutContainer>
  </template>
  <template v-else>
    <router-view />
    <Toast />
  </template>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import Toast from 'primevue/toast'
import LayoutContainer from '@/containers/LayoutContainer/LayoutContainer.vue'
import { backendStore } from '@/demo/backendStore'
import NavigationBottom from '@/demo/components/NavigationBottom.vue'

// Pinia auto-unwraps refs on the store, so `backendStore.authenticated` is a
// plain boolean. `unref()` keeps this safe against future type refactors.
const isAuthenticated = computed(() => Boolean(unref(backendStore.authenticated)))
</script>
