<template>
  <div class="flex flex-col grow p-4 gap-4">
    <section v-if="topLevelEntries.length > 0">
      <NavigationLinkComponent
        v-for="entry in topLevelEntries"
        :key="entry.path"
        :route="entry.path"
        :icon="entry.icon"
        :label="entry.label"
        @navigation-item-click="emitNavigationItemClick"
      />
    </section>

    <section v-for="section in sectionEntries" :key="section.label" class="flex flex-col gap-2">
      <h3 class="mb-1 px-2 text-sm font-medium text-zinc-500">{{ section.label }}</h3>
      <div>
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
import { routeNavigationEntries, type WeFaRouteEntry } from '@/router'
import NavigationLinkComponent from '@/containers/LayoutContainer/SideNavigationComponent/MainComponent/NavigationLinkComponent.vue'

type NavigationEntry = WeFaRouteEntry

interface SectionNavigationEntries {
  label: string
  entries: NavigationEntry[]
}

const router = useRouter()
const emit = defineEmits<{
  (event: 'navigation-item-click'): void
}>()

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
