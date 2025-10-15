<template>
  <div class="h-full w-full flex flex-col items-center justify-center">
    <RouterView />
  </div>
  <Toast ref="toast" />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>
