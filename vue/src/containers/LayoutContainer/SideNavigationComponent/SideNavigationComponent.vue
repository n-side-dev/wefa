<template>
  <aside class="relative z-[2] hidden px-3 pt-3 lg:block lg:w-[19rem] lg:shrink-0 lg:px-0 lg:pt-0">
    <nav
      class="flex overflow-hidden rounded-[calc(var(--brand-radius-lg)-6px)] border border-[var(--brand-border-contrast-soft)] bg-[linear-gradient(180deg,var(--brand-side-nav-top-glow),transparent_24%),linear-gradient(160deg,var(--brand-side-nav-highlight),transparent_24%),linear-gradient(180deg,var(--brand-side-nav-gradient-start)_0%,var(--brand-side-nav-gradient-end)_100%)] shadow-[0_30px_70px_-42px_rgba(8,16,38,0.7)] lg:fixed lg:top-4 lg:bottom-4 lg:w-[19rem] lg:flex-col"
    >
      <TopComponent
        :project-title="projectTitle"
        :project-logo="projectLogo"
        :project-logo-alt="projectLogoAlt"
      />
      <MainComponent />
      <div class="border-t border-[var(--brand-border-contrast-soft)] p-4 lg:p-5">
        <slot name="bottom">
          <BottomComponent />
        </slot>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import BottomComponent from '@/containers/LayoutContainer/SideNavigationComponent/BottomComponent/BottomComponent.vue'
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
