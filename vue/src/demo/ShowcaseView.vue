<template>
  <div
    class="m-4 p-4 h-[calc(100%-var(--spacing)*8)] w-[calc(100%-var(--spacing)*8)] rounded shadow bg-(--p-content-background) flex-col"
  >
    <!-- Write your custom content below -->

    <div class="flex flex-col gap-1">
      <span>Welcome to the local showcase.</span>

      <span>You can modify the content of this page in </span>

      <span class="font-mono bg-primary-100 text-center">vue/src/demo/ShowcaseView.vue</span>

      <span>Feel free to try out WeFa components,</span>

      <span>PrimeVue components,</span>

      <span>Tailwind classes,</span>

      <span>and other stores, helpers, utils, ...</span>

      <span>Like this :</span>

      <Divider></Divider>

      <Button label="This is a PrimeVue button"></Button>
    </div>

    <!-- Write your custom content above -->
  </div>
</template>

<script setup lang="ts">
// Import components here
import Divider from 'primevue/divider'
import Button from 'primevue/button'

// Write your TypeScript here
</script>
