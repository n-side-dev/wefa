<template>
  <UserMenuTriggerComponent
    username="John Doe"
    email="jdo@example.com"
    :mode="collapsed ? 'compact' : 'detailed'"
  />
</template>

<script setup lang="ts">
import UserMenuTriggerComponent from '@/containers/LayoutContainer/UserMenuTriggerComponent/UserMenuTriggerComponent.vue'

export interface BottomComponentProps {
  collapsed?: boolean
}

const { collapsed = false } = defineProps<BottomComponentProps>()
</script>
