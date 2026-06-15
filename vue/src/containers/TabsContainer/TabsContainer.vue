<template>
  <div
    :class="[
      'flex flex-col',
      {
        'size-[calc(100%-4*var(--spacing))] m-2': routerViewDepth === 0,
        'size-full': routerViewDepth !== 0,
      },
    ]"
  >
    <Tabs :value="activeTabValue" @update:value="onTabChange">
      <TabList>
        <Tab v-for="item in tabItems" :key="item.value" :value="item.value">
          <span class="inline-flex items-center gap-2">
            <span v-if="item.icon" :class="item.icon" />
            <span>{{ t(item.label) }}</span>
          </span>
        </Tab>
      </TabList>
    </Tabs>

    <div class="min-h-0 grow overflow-auto">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import type { MenuItem } from 'primevue/menuitem'

import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationMatched, type RouteLocationRaw } from 'vue-router'
import { menuItemsFromRoute, setupDepthTracker } from '../helpers'
import { useI18nLib } from '@/locales'

export interface TabsContainerProps {
  depth?: 1
}

interface TabContainerItem {
  label: string
  icon?: string
  route: RouteLocationRaw
  value: string
}

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
const routerViewDepth = setupDepthTracker()

const { depth = 1 } = defineProps<TabsContainerProps>()

const { t } = useI18nLib()
const route = useRoute()
const router = useRouter()

const levelRoute = computed<RouteLocationMatched>(() => {
  return route.matched[routerViewDepth] as RouteLocationMatched
})

const toTabItem = (menuItem: MenuItem): TabContainerItem | undefined => {
  const label = typeof menuItem.label === 'function' ? menuItem.label() : menuItem.label
  const routeLocation = menuItem.to as RouteLocationRaw | undefined
  const value = (() => {
    if (typeof routeLocation !== 'object') {
      return routeLocation
    }

    if ('name' in routeLocation && routeLocation.name) {
      return String(routeLocation.name)
    }

    if ('path' in routeLocation && routeLocation.path) {
      return routeLocation.path
    }

    return label
  })()

  if (!label || !routeLocation || !value) {
    return undefined
  }

  return {
    label,
    icon: menuItem.icon,
    route: routeLocation,
    value,
  }
}

const tabItems = computed<TabContainerItem[]>(() =>
  menuItemsFromRoute(levelRoute, depth, route).flatMap((menuItem) => {
    const tabItem = toTabItem(menuItem)

    return tabItem ? [tabItem] : []
  })
)

const activeTabValue = computed(() => {
  const activeRoute = route.matched[routerViewDepth + 1]
  const activeRouteValue = activeRoute?.name?.toString() ?? activeRoute?.path
  const matchingTabItem = tabItems.value.find((item) => item.value === activeRouteValue)

  return matchingTabItem?.value ?? tabItems.value[0]?.value
})

const onTabChange = (value: string | number) => {
  const selectedTabItem = tabItems.value.find((item) => item.value === String(value))

  if (!selectedTabItem) {
    return
  }

  return router.push(selectedTabItem.route)
}

defineExpose({
  activeTabValue,
  onTabChange,
})
</script>
