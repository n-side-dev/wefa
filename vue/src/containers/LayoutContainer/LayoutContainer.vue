<template>
  <section
    class="relative isolate min-h-svh w-full lg:flex lg:gap-4 lg:p-4"
    :data-router-view-depth="routerViewDepth"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute top-0 left-[-4rem] h-[22rem] w-[22rem] rounded-full bg-[var(--brand-orb-teal)] opacity-55 blur-[80px]"
      />
      <div
        class="absolute top-48 right-[-8rem] h-[20rem] w-[20rem] rounded-full bg-[var(--brand-orb-magenta)] opacity-55 blur-[80px]"
      />
      <div
        class="absolute bottom-8 left-[30%] h-[16rem] w-[16rem] rounded-full bg-[var(--brand-orb-gold)] opacity-55 blur-[80px]"
      />
    </div>
    <SideNavigationComponent
      :project-title="projectTitle"
      :project-logo="projectLogo"
      :project-logo-alt="projectLogoAlt"
    >
      <template v-if="hasNavigationBottomSlot" #bottom>
        <slot name="navigation-bottom" />
      </template>
    </SideNavigationComponent>
    <main class="relative z-[1] min-w-0 flex-1 px-3 pb-3 pt-0 lg:px-0 lg:py-0">
      <MobileNavigationComponent
        :project-title="projectTitle"
        :project-logo="projectLogo"
        :project-logo-alt="projectLogoAlt"
      >
        <template v-if="hasNavigationBottomSlot" #bottom>
          <slot name="navigation-bottom" />
        </template>
      </MobileNavigationComponent>
      <section
        class="min-h-[calc(100svh-0.75rem)] rounded-[var(--brand-radius-lg)] border border-[var(--brand-border-contrast)] bg-[linear-gradient(180deg,var(--brand-surface-glass),var(--brand-surface-glass-strong)),var(--brand-surface)] p-[var(--brand-spacing-page)] shadow-[var(--brand-shadow-lg)] backdrop-blur-[14px] lg:min-h-[calc(100svh-2rem)]"
      >
        <AutoroutedBreadcrumb v-if="showBreadcrumb" home-route="/home" />
        <router-view />
      </section>
    </main>

    <!-- PrimeVue Dynamic Components Receptors -->
    <Toast ref="toast" />
    <ConfirmDialog />
  </section>
</template>

<script setup lang="ts">
import { computed, type Slots, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import SideNavigationComponent from '@/containers/LayoutContainer/SideNavigationComponent/SideNavigationComponent.vue'
import { AutoroutedBreadcrumb } from '@/components/AutoroutedBreadcrumb'
import MobileNavigationComponent from '@/containers/LayoutContainer/MobileNavigationComponent/MobileNavigationComponent.vue'
import { setupDepthTracker } from '../helpers'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

export interface LayoutContainerProps {
  projectTitle: string
  projectLogo?: string
  projectLogoAlt?: string
}

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
const routerViewDepth = setupDepthTracker()
const route = useRoute()
const slots: Slots = useSlots()

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
} = defineProps<LayoutContainerProps>()

const hasNavigationBottomSlot = computed<boolean>(() => {
  return slots['navigation-bottom'] !== undefined
})

const showBreadcrumb = computed(() => {
  const matchedRouteWithBreadcrumbPreference = [...route.matched]
    .reverse()
    .find((matchedRoute) => matchedRoute.meta.wefa?.showBreadcrumb !== undefined)

  return matchedRouteWithBreadcrumbPreference?.meta.wefa?.showBreadcrumb ?? true
})
</script>
