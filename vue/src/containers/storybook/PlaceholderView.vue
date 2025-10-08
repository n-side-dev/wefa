<template>
  <PageComponent :title="route.meta.title as string" :show-breadcrumb="true">
    <div
      class="size-full bg-linear-to-b from-surface-100 to-surface-0 rounded flex items-center justify-center"
    >
      <span> This is a placeholder view</span>
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

import { PageComponent } from '@/components/PageComponent'
const route = useRoute()
</script>
