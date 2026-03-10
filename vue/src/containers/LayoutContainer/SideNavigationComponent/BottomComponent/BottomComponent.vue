<template>
  <div class="flex flex-col border-t p-4 border-zinc-950/5">
    <UserMenuTriggerComponent username="John Doe" email="jdo@example.com" mode="detailed" />
  </div>
</template>

<script setup lang="ts">
import UserMenuTriggerComponent from '@/containers/LayoutContainer/UserMenuTriggerComponent/UserMenuTriggerComponent.vue'
</script>
