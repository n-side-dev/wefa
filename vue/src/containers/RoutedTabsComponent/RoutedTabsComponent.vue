<template>
  <section class="routed-tabs-component">
    <Tabs :value="activeTabIndex" @update:value="onTabChange">
      <TabList>
        <Tab v-for="(tab, index) in tabs" :key="index" :value="index">
          {{ t(tab) }}
        </Tab>
      </TabList>
      <TabPanels>
        <router-view />
      </TabPanels>
    </Tabs>
  </section>
</template>

<script setup lang="ts">
/**
 * @description A routed tabs component that creates navigation tabs using PrimeVue TabView.
 * Each tab corresponds to a route and automatically shows the active state based on the current route.
 * The component maintains routing functionality while providing a modern tabbed interface.
 */
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import { computed, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { setupDepthTracker } from '../helpers'
import { useI18nLib } from '@/locales'

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
setupDepthTracker()

const { t } = useI18nLib()

/**
 * Props for the RoutedTabsComponent
 */
export interface RoutedTabsComponentProps {
  /** Array of tab names that correspond to route names */
  tabs: string[]
}

const { tabs } = defineProps<RoutedTabsComponentProps>()

const route = useRoute()
const router = useRouter()

/**
 * Computed property that determines the active tab index based on the current route
 */
const activeTabIndex = computed(() => {
  const currentRouteName = route.name as string
  const index = tabs.findIndex((tab) => tab === currentRouteName)
  return index >= 0 ? index : 0
})

/**
 * Handles tab change events and navigates to the corresponding route
 * @param value - The new active tab index (can be string or number from PrimeVue)
 */
const onTabChange = (value: string | number) => {
  // Convert to number if it's a string
  const newIndex = typeof value === 'string' ? parseInt(value, 10) : value

  // Validate index bounds to prevent object injection
  if (newIndex < 0 || newIndex >= tabs.length || isNaN(newIndex)) {
    return
  }

  const targetTab = tabs.at(newIndex)
  if (targetTab && targetTab !== route.name) {
    // Check if the route exists in the router
    const routeExists = router.hasRoute(targetTab)

    if (!routeExists) {
      // If the route cannot be matched, redirect to 404
      router.push({ name: '404' })
      return
    }

    // Create a proper RouteLocationRaw object similar to AutoroutedBreadcrumb
    const routeObj: RouteLocationRaw = {
      name: targetTab,
      query: route.query, // Preserve current query parameters
      hash: route.hash, // Preserve current hash
    }

    // Only include params if they exist and are relevant
    if (route.params && Object.keys(route.params).length > 0) {
      routeObj.params = { ...route.params }
    }

    router.push(routeObj)
  }
}

/**
 * Watch for route changes to ensure tab synchronization
 */
watch(
  () => route.name,
  (newRouteName) => {
    // This ensures the component stays in sync if navigation happens outside of tab clicks
    const index = tabs.findIndex((tab) => tab === newRouteName)
    if (index >= 0) {
      // The activeTabIndex computed property will automatically update
      // No additional action needed here
    } else if (newRouteName !== '404') {
      // If route is not found in tabs and it's not already the 404 route, redirect to 404
      router.push({ name: '404' })
    }
  }
)

/**
 * Expose properties and methods for testing
 */
defineExpose({
  activeTabIndex,
  onTabChange,
})
</script>
