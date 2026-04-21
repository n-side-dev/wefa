<template>
  <section
    class="relative isolate flex h-svh w-full max-lg:flex-col lg:bg-zinc-100"
    :data-router-view-depth="routerViewDepth"
  >
    <SideNavigationComponent
      :project-title="projectTitle"
      :project-logo="projectLogo"
      :project-logo-alt="projectLogoAlt"
    />
    <main class="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-64 min-h-0">
      <MobileNavigationComponent
        :project-title="projectTitle"
        :project-logo="projectLogo"
        :project-logo-alt="projectLogoAlt"
      />
      <section
        class="grow min-h-0 p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 flex flex-col"
      >
        <AutoroutedBreadcrumb :home-route="breadcrumbHomeRouteComputed" />
        <div class="flex-1 overflow-hidden">
          <router-view />
        </div>
      </section>
    </main>

    <!-- PrimeVue Dynamic Components Receptors -->
    <Toast ref="toast" />
    <ConfirmDialog />
  </section>
</template>

<script setup lang="ts">
import SideNavigationComponent from '@/containers/LayoutContainer/SideNavigationComponent/SideNavigationComponent.vue'
import { AutoroutedBreadcrumb } from '@/components/AutoroutedBreadcrumb'
import MobileNavigationComponent from '@/containers/LayoutContainer/MobileNavigationComponent/MobileNavigationComponent.vue'
import { setupDepthTracker } from '../helpers'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { computed, type ComputedRef } from 'vue'

export interface LayoutContainerProps {
  projectTitle: string
  projectLogo?: string
  projectLogoAlt?: string
  breadcrumbHomeRoute?: string
  breadcrumbShowHome?: boolean
}

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
const routerViewDepth = setupDepthTracker()

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
  breadcrumbHomeRoute = "/home",
  breadcrumbShowHome = true
} = defineProps<LayoutContainerProps>()

const breadcrumbHomeRouteComputed: ComputedRef<string|undefined> = computed(() => {
  return breadcrumbShowHome ? breadcrumbHomeRoute : undefined
})

</script>
