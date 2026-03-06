<template>
  <div class="fixed inset-y-0 left-0 w-64 max-lg:hidden">
    <nav class="flex h-full min-h-0 flex-col">
      <TopComponent
        :project-title="projectTitle"
        :project-logo="projectLogo"
        :project-logo-alt="projectLogoAlt"
      />
      <MainComponent />
    </nav>
  </div>
</template>

<script setup lang="ts">
import TopComponent from '@/containers/LayoutContainer/SideNavigationComponent/TopComponent/TopComponent.vue'
import MainComponent from '@/containers/LayoutContainer/SideNavigationComponent/MainComponent/MainComponent.vue'

export interface SideNavigationComponentProps {
  projectTitle: string
  projectLogo?: string
  projectLogoAlt?: string
}

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
} = defineProps<SideNavigationComponentProps>()
</script>
