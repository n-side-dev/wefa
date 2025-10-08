<template>
  <Card>
    <template #title> Placeholder for the Login page </template>
    <template #content>
      <p class="m-0">TODO SOFA-292 implement</p>
      <pre class="border border-red-500">{{ props }}</pre>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'

export interface LoginViewProps {
  gdpr?: boolean
}

const props = defineProps<LoginViewProps>()
</script>
