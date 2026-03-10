<template>
  <PageComponent title="Demo Content" subtitle="This is the subtitle" :show-breadcrumb="true">
    <div
      class="size-100 bg-surface-50 border border-surface-950 rounded flex items-center justify-center"
    >
      <span
        >This is demo content <br />
        to fill your screens</span
      >
    </div>
  </PageComponent>
</template>

<script setup lang="ts">
import { PageComponent } from '@/components/PageComponent'
</script>
