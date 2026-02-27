<template>
  <Breadcrumb :home="home" :model="items">
    <template #item="{ item, props }">
      <router-link v-slot="{ href, navigate }" :to="item.route" custom>
        <a
          :href="href"
          v-bind="props.action"
          role="link"
          class="flex flex-row gap-1"
          @click="navigate"
        >
          <span v-if="item.icon" :class="[item.icon, 'text-color']" />
          <span v-if="item.label">{{ $t(item.label as string) }}</span>
        </a>
      </router-link>
    </template>
  </Breadcrumb>
</template>

<script setup lang="ts">
/**
 * @description A breadcrumb navigation component that automatically generates breadcrumb items based on the current route.
 * It uses vue-router's matched routes to create a hierarchical navigation path.
 * Optionally, a home route can be specified to add a home icon at the beginning of the breadcrumb.
 */
import Breadcrumb from 'primevue/breadcrumb'
import { RouterLink } from 'vue-router'
import { type RouteLocationMatched, type RouteLocationRaw, useRoute } from 'vue-router'
import { computed, type ComputedRef } from 'vue'
import type { MenuItem } from 'primevue/menuitem'

/**
 * Represents an item in the breadcrumb navigation
 */
type AutoroutedBreadcrumbItem = {
  /** The display text for the breadcrumb item */
  label: string
  /** Optional icon class to display with the breadcrumb item */
  icon?: string
  /** Optional route object for navigation */
  route?: RouteLocationRaw
}

/**
 * Props for the AutoroutedBreadcrumb component
 */
export interface AutoroutedBreadcrumbProps {
  /** Optional route path for the home icon. If provided, a home icon will be added at the beginning of the breadcrumb. */
  homeRoute?: string
}

const { homeRoute = null } = defineProps<AutoroutedBreadcrumbProps>()

const currentRoute = useRoute()

/**
 * Computed property that returns the matched routes from the current route
 */
const matchedRoutes: ComputedRef<RouteLocationMatched[]> = computed(() => {
  return currentRoute.matched
})

/**
 * Computed property that transforms the matched routes into breadcrumb items
 */
const items: ComputedRef<AutoroutedBreadcrumbItem[]> = computed(() => {
  // matchedRoutes are already ordered from parent to child
  return matchedRoutes.value.map((route) => {
    const meta = route.meta || {}

    // Filter out id and paramId from params
    const filteredParams = { ...currentRoute.params }
    delete filteredParams.id
    delete filteredParams.itemId

    // Create route object
    const routeObj: RouteLocationRaw = {
      name: route.name,
      query: currentRoute.query,
      hash: currentRoute.hash,
    }

    // Only include params if path is not root
    if (route.path !== '/') {
      routeObj.params = filteredParams
    }

    // Instead of using route.path, use the current route's resolved path
    // This preserves the parameters in the path
    return {
      label: (meta.title as string) || route.name?.toString() || '',
      icon: meta.icon as string | undefined,
      route: routeObj,
    }
  })
})

/**
 * Computed property that returns the home menu item if a home route is provided
 * and the current route is not the home route
 */
const home: ComputedRef<MenuItem | undefined> = computed(() => {
  // Don't show home breadcrumb if we're already on the home route
  if (homeRoute && currentRoute.path !== homeRoute) {
    // Create route object
    // When using path-based navigation, we can't use params directly
    // Instead, we'll use query parameters for any additional data
    const routeObj: RouteLocationRaw = {
      path: homeRoute,
      query: {
        ...currentRoute.query,
        // If we need to preserve params, we can add them to query
        // This is a workaround since params can't be used with path
      },
      hash: currentRoute.hash,
    }

    return {
      icon: 'pi pi-home',
      route: routeObj,
    }
  }

  return undefined
})
</script>
