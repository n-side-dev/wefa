<template>
  <div
    :class="[
      'flex flex-row gap-2',
      {
        'size-[calc(100%-4*var(--spacing))] m-2': routerViewDepth === 0,
        'size-full': routerViewDepth !== 0,
      },
    ]"
  >
    <Menu
      :model="menuItems"
      :style="widthStyle"
      :pt="{
        root: 'h-full flex flex-col overflow-auto',
        list: 'grow',
        item: 'has-[.spacer]:grow',
      }"
    >
      <!-- Logo + app name -->
      <template v-if="start.logo || start.appName" #start>
        <div
          class="flex flex-col items-center gap-2 m-(--p-divider-horizontal-margin) mb-0 p-(--p-menu-list-padding)"
        >
          <img :src="start.logo" class="max-h-10" />
          <span v-if="start.appName" class="text-center max-w-60">{{ t(start.appName) }}</span>

          <Divider />
        </div>
      </template>

      <!-- Section headers -->
      <!-- @vue-ignore -->
      <template #submenulabel="{ item }">
        <router-link v-slot="{ href, navigate }" :to="item.to ?? '/'">
          <a
            :href="href"
            class="flex flex-row items-center gap-(--p-menu-item-gap)"
            @click="navigate"
          >
            <span v-if="item.icon" :class="item.icon" />
            <span>{{ t(item.label) }}</span>
          </a>
        </router-link>
      </template>

      <!-- Items -->
      <template #item="{ item, props }">
        <!-- Normal case -->
        <router-link v-if="item.to" v-slot="{ href, navigate, isActive }" :to="item.to">
          <a
            :href="href"
            v-bind="props.action"
            :class="{
              'bg-(--p-highlight-background) text-(--p-highlight-color) rounded-(--p-navigation-item-border-radius)':
                isActive,
            }"
            @click="navigate"
          >
            <span v-if="item.depth > 1" class="w-4"></span>
            <span
              v-if="item.icon"
              :class="{ [item.icon]: true, 'text-(--p-highlight-color)': isActive }"
            />
            <span :class="{ 'text-(--p-highlight-color)': isActive }">{{
              t(item.label as string)
            }}</span>
          </a>
        </router-link>

        <!-- Spacer -->
        <div v-else-if="item.special === 'spacer'" class="spacer"></div>

        <!-- Divider -->
        <div v-else-if="item.special === 'divider'">
          <Divider />
        </div>

        <!-- No link -->
        <div v-else>
          <a v-bind="props.action">
            <span v-if="item.depth > 1" class="w-4"></span>
            <span v-if="item.icon" :class="{ [item.icon]: true }" />
            <span>{{ t(item.label as string) }}</span>
          </a>
        </div>
      </template>
    </Menu>

    <div class="overflow-auto size-full">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import Menu from 'primevue/menu'
import Divider from 'primevue/divider'

import {
  makeEndSectionMenuItems,
  menuItemsFromRoute,
  setupDepthTracker,
  type GenericContainerProps,
} from '../helpers'
import { libRouteRecords } from '@/router'

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
const routerViewDepth: number = setupDepthTracker()

import { useRoute, type RouteLocationMatched } from 'vue-router'
import { computed, type ComputedRef } from 'vue'
import { useI18nLib } from '@/locales'

const route = useRoute()
const levelRoute: ComputedRef<RouteLocationMatched> = computed(() => {
  return route.matched[routerViewDepth] as RouteLocationMatched
})

const { t } = useI18nLib()

export interface SideMenuContainerProps extends GenericContainerProps {
  depth?: 1 | 2
  width?: number
}

const {
  depth = 1,
  width = 50,
  start = {
    logo: undefined,
    appName: undefined,
  },
  end = {
    showUser: false,
    showSettings: false,
    showLogout: false,
    settingsRoute: { path: '/settings' },
    logoutRoute: { path: libRouteRecords.logout.path },
  },
} = defineProps<SideMenuContainerProps>()

const menuItems = menuItemsFromRoute(levelRoute, depth).concat(makeEndSectionMenuItems(end))

const widthStyle = computed(() => `min-width: calc(var(--spacing)*${width}) !important;`)
</script>
