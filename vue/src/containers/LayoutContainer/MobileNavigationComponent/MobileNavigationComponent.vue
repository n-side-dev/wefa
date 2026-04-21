<template>
  <div class="px-1 py-3 lg:hidden">
    <div class="flex items-center justify-between gap-2">
      <Button
        data-test="open-navigation"
        type="button"
        icon="pi pi-bars"
        text
        rounded
        severity="secondary"
        :aria-label="t('navigation.open_navigation_menu')"
        @click="isDrawerVisible = true"
      />
    </div>
  </div>

  <Drawer
    v-model:visible="isDrawerVisible"
    position="left"
    :dismissable="true"
    :block-scroll="true"
    :show-close-icon="false"
    :dt="drawerTokens"
    class="w-screen max-w-full overflow-hidden rounded-none border-0 bg-transparent shadow-none sm:w-72 sm:max-w-[85vw]"
  >
    <template #container>
      <nav
        data-test="mobile-navigation-content"
        class="relative flex h-full min-h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,var(--brand-side-nav-top-glow),transparent_24%),linear-gradient(160deg,var(--brand-side-nav-highlight),transparent_24%),linear-gradient(180deg,var(--brand-side-nav-gradient-start)_0%,var(--brand-side-nav-gradient-end)_100%)]"
      >
        <div data-test="mobile-navigation-actions" class="flex justify-end px-4 pt-4">
          <Button
            data-test="close-navigation"
            type="button"
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            class="size-10 shrink-0 border border-(--brand-border-contrast-soft) bg-white/10 text-(--brand-text-on-dark) shadow-[0_12px_32px_-18px_rgba(8,16,38,0.9)] backdrop-blur-sm"
            :aria-label="t('navigation.close_navigation_menu')"
            @click="closeDrawer"
          />
        </div>
        <TopComponent
          :project-title="projectTitle"
          :project-logo="projectLogo"
          :project-logo-alt="projectLogoAlt"
        />
        <MainComponent @navigation-item-click="closeDrawer" />
        <div class="mt-auto border-t border-[var(--brand-border-contrast-soft)] px-4 py-4">
          <slot name="bottom">
            <BottomComponent />
          </slot>
        </div>
      </nav>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import { ref } from 'vue'
import BottomComponent from '@/containers/LayoutContainer/SideNavigationComponent/BottomComponent/BottomComponent.vue'
import MainComponent from '@/containers/LayoutContainer/SideNavigationComponent/MainComponent/MainComponent.vue'
import TopComponent from '@/containers/LayoutContainer/SideNavigationComponent/TopComponent/TopComponent.vue'
import { useI18nLib } from '@/locales'

export interface MobileNavigationComponentProps {
  projectTitle: string
  projectLogo?: string
  projectLogoAlt?: string
}

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
} = defineProps<MobileNavigationComponentProps>()
const { t } = useI18nLib()
const isDrawerVisible = ref(false)
const drawerTokens = {
  root: {
    background: 'transparent',
    borderColor: 'transparent',
    shadow: 'none',
  },
  header: {
    padding: '0',
  },
  content: {
    padding: '0',
  },
  footer: {
    padding: '0',
  },
} as const

/**
 * Closes the mobile navigation drawer.
 */
function closeDrawer() {
  isDrawerVisible.value = false
}
</script>
