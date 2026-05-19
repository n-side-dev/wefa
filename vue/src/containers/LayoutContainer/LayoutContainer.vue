<template>
  <section
    class="relative isolate h-svh w-full flex lg:gap-4 lg:p-4"
    :data-router-view-depth="routerViewDepth"
  >
    <SideNavigationComponent
      :project-title="projectTitle"
      :project-logo="projectLogo"
      :project-logo-alt="projectLogoAlt"
    >
      <template v-if="hasNavigationBottomSlot" #bottom>
        <slot name="navigation-bottom" />
      </template>
    </SideNavigationComponent>
    <main
      class="flex-1 relative z-[1] min-h-0 min-w-0 px-3 pb-3 pt-0 lg:px-0 lg:py-0 flex flex-col"
    >
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
        class="grow size-full min-h-0 rounded-(--p-radius-lg) border border-(--p-border-contrast) bg-(--p-surface-glass)/30 p-4 shadow-(--p-shadow-lg) flex flex-col"
      >
        <div class="shrink-0">
          <AutoroutedBreadcrumb v-if="showBreadcrumb" :home-route="breadcrumbHomeRouteComputed" />
        </div>

        <div class="min-h-0 grow-1 overflow-auto">
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
  breadcrumbHomeRoute?: string
  breadcrumbShowHome?: boolean
}

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
const routerViewDepth = setupDepthTracker()
const route = useRoute()
const slots: Slots = useSlots()

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
  breadcrumbHomeRoute = '/home',
  breadcrumbShowHome = true,
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

const breadcrumbHomeRouteComputed = computed<string | undefined>(() => {
  return breadcrumbShowHome ? breadcrumbHomeRoute : undefined
})
</script>
