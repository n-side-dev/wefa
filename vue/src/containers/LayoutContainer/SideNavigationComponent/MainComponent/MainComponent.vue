<template>
  <div class="flex grow flex-col px-3 py-3 lg:px-4 lg:py-5">
    <p
      class="px-3 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--brand-text-on-dark-soft)]"
    >
      Navigate
    </p>
    <section v-if="topLevelEntries.length > 0" class="mt-3 flex flex-col gap-1.5">
      <NavigationLinkComponent
        v-for="entry in topLevelEntries"
        :key="entry.path"
        :route="entry.path"
        :icon="entry.icon"
        :label="entry.label"
        @navigation-item-click="emitNavigationItemClick"
      />
    </section>

    <section
      v-for="section in sectionEntries"
      :key="section.label"
      class="mt-5 flex flex-col gap-2 first:mt-4"
    >
      <h3
        class="px-3 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--brand-text-on-dark-soft)]"
      >
        {{ section.label }}
      </h3>
      <div class="flex flex-col gap-1.5">
        <NavigationLinkComponent
          v-for="entry in section.entries"
          :key="entry.path"
          :route="entry.path"
          :icon="entry.icon"
          :label="entry.label"
          @navigation-item-click="emitNavigationItemClick"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RouteRecordRaw, useRouter } from 'vue-router'
import type { WeFaRouteMeta } from '@/router'
import NavigationLinkComponent from '@/containers/LayoutContainer/SideNavigationComponent/MainComponent/NavigationLinkComponent.vue'

interface NavigationEntry {
  path: string
  label: string
  icon?: string
  section?: string
}

interface SectionNavigationEntries {
  label: string
  entries: NavigationEntry[]
}

const router = useRouter()
const emit = defineEmits<{
  (event: 'navigation-item-click'): void
}>()

/**
 * Normalizes route paths to avoid duplicate slashes and trailing slash noise.
 * @param path Raw route path
 * @returns Normalized absolute path
 */
function normalizePath(path: string): string {
  if (!path) {
    return '/'
  }

  const normalizedPath = path.replace(/\/{2,}/g, '/')
  if (normalizedPath === '/') {
    return normalizedPath
  }

  return normalizedPath.replace(/\/$/, '')
}

/**
 * Resolves a route path against its parent route path.
 * @param parentPath Parent route path
 * @param routePath Child route path
 * @returns Resolved absolute path
 */
function resolvePath(parentPath: string, routePath: string): string {
  if (routePath.startsWith('/')) {
    return normalizePath(routePath)
  }

  if (!routePath) {
    return normalizePath(parentPath)
  }

  if (parentPath === '/') {
    return normalizePath(`/${routePath}`)
  }

  return normalizePath(`${parentPath}/${routePath}`)
}

/**
 * Extracts navigation entries from the router tree based on showInNavigation metadata.
 * @param routes Router records to inspect
 * @param parentPath Parent path used to resolve relative child paths
 * @returns Flattened navigation entries in declaration order
 */
function routeNavigationEntries(
  routes: RouteRecordRaw[],
  parentPath: string = '/'
): NavigationEntry[] {
  const entries: NavigationEntry[] = []

  for (const route of routes) {
    const fullPath = resolvePath(parentPath, route.path)
    const routeMeta = route.meta?.wefa as WeFaRouteMeta | undefined
    const showInNavigation = routeMeta?.showInNavigation ?? false
    const section = routeMeta?.section

    if (showInNavigation === true) {
      entries.push({
        path: fullPath,
        label: routeMeta?.title ?? String(route.name ?? fullPath),
        icon: routeMeta?.icon,
        section: section?.trim() || undefined,
      })
    }

    if (route.children?.length) {
      entries.push(...routeNavigationEntries(route.children, fullPath))
    }
  }

  return entries
}

const navigationEntries = computed(() => {
  return routeNavigationEntries(router.options.routes as RouteRecordRaw[])
})

const topLevelEntries = computed(() => {
  return navigationEntries.value.filter((entry) => !entry.section)
})

const sectionEntries = computed<SectionNavigationEntries[]>(() => {
  const groupedEntries = new Map<string, NavigationEntry[]>()

  for (const entry of navigationEntries.value) {
    if (!entry.section) {
      continue
    }

    if (!groupedEntries.has(entry.section)) {
      groupedEntries.set(entry.section, [])
    }

    groupedEntries.get(entry.section)?.push(entry)
  }

  return Array.from(groupedEntries.entries()).map(([label, entries]) => ({
    label,
    entries,
  }))
})

/**
 * Forwards click events from individual navigation links.
 */
function emitNavigationItemClick() {
  emit('navigation-item-click')
}
</script>
