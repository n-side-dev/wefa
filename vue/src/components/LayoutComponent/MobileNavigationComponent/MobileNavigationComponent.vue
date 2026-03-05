<template>
  <div class="border-b border-zinc-950/5 bg-white px-4 py-3 lg:hidden">
    <div class="flex items-center justify-between gap-2">
      <Button
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
    :header="projectTitle"
    position="left"
    :dismissable="true"
    :block-scroll="true"
    class="w-72 max-w-[85vw]"
  >
    <nav class="flex h-full min-h-0 flex-col">
      <TopComponent :project-title="projectTitle" />
      <MainComponent @navigation-item-click="closeDrawer" />
    </nav>
  </Drawer>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import { ref } from 'vue'
import MainComponent from '@/components/LayoutComponent/SideNavigationComponent/MainComponent/MainComponent.vue'
import TopComponent from '@/components/LayoutComponent/SideNavigationComponent/TopComponent/TopComponent.vue'
import { useI18nLib } from '@/locales'

export interface MobileNavigationComponentProps {
  projectTitle: string
}

const { projectTitle } = defineProps<MobileNavigationComponentProps>()
const { t } = useI18nLib()
const isDrawerVisible = ref(false)

/**
 * Closes the mobile navigation drawer.
 */
function closeDrawer() {
  isDrawerVisible.value = false
}
</script>
