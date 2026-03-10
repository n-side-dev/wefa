<template>
  <div class="flex flex-col items-center justify-center gap-4 bg-white rounded-3xl p-8 shadow-xl">
    <h1>Hi ! You've reached the demo view of N-SIDE WeFa</h1>

    <Divider></Divider>

    <span>
      If you're looking for the Storybook documentation, you need to run<span
        class="font-mono bg-primary-100 px-2"
        >npm run storybook</span
      >
      instead
    </span>

    <Divider></Divider>

    <RouterLink :to="{ name: 'showcase' }">
      <Button label="Access the local Showcase"></Button>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import Divider from 'primevue/divider'
import Button from 'primevue/button'
</script>
