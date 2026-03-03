<template>
  <div class="fixed inset-y-0 left-0 w-64 max-lg:hidden">
    <nav class="flex h-full min-h-0 flex-col">
      <TopComponent :project-title="projectTitle" />
      <MainComponent />
    </nav>
  </div>
</template>

<script setup lang="ts">
import TopComponent from '@/components/LayoutComponent/SideNavigationComponent/TopComponent/TopComponent.vue'
import MainComponent from '@/components/LayoutComponent/SideNavigationComponent/MainComponent/MainComponent.vue'

export interface SideNavigationComponentProps {
  projectTitle: string
}

const { projectTitle } = defineProps<SideNavigationComponentProps>()
</script>
