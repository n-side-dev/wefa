<template>
  <LayoutContainer project-title="WeFa" :command-palette="{ assistant: demoAssistantConfig }" />
</template>

<script setup lang="ts">
import LayoutContainer from '@/containers/LayoutContainer/LayoutContainer.vue'
import { demoAssistantConfig } from './assistant'
</script>
