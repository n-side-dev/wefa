<template>
  <div class="size-full flex flex-col gap-2">
    <!-- PrimeVue variant -->
    <Menubar
      :model="menuItems"
      :pt="{
        root: 'w-full flex flex-row',
        rootList: 'grow flex flex-row',
        item: 'has-[.spacer]:grow has-[.divider]:hover:unset',
      }"
    >
      <!-- Logo + app name -->
      <template v-if="start.logo || start.appName" #start>
        <div class="flex flex-row items-center">
          <img :src="start.logo" class="h-8" />
          <span v-if="start.appName" class="ml-4">{{ t(start.appName) }}</span>
          <Divider layout="vertical" />
        </div>
      </template>

      <!-- Items -->
      <template #item="{ item, props, root, hasSubmenu }">
        <router-link v-if="item.to" v-slot="{ href, navigate, isActive }" :to="item.to">
          <a
            :href="href"
            v-bind="props.action"
            :class="{
              'bg-(--p-highlight-background) text-(--p-highlight-color) rounded-(--p-navigation-item-border-radius)':
                isActive,
            }"
            @click.prevent="
              () => {
                hasSubmenu ?? navigate()
              }
            "
          >
            <span
              v-if="item.icon"
              :class="{ [item.icon]: true, 'text-(--p-highlight-color)': isActive }"
            />
            <span v-if="!item.iconOnly" :class="{ 'text-(--p-highlight-color)': isActive }">{{
              t(item.label as string)
            }}</span>
            <i
              v-if="hasSubmenu"
              :class="[
                'pi pi-angle-down ml-auto',
                {
                  'pi-angle-down': root,
                  'pi-angle-right': !root,
                  'text-(--p-highlight-color)': isActive,
                },
              ]"
            ></i>
          </a>
        </router-link>

        <!-- Spacer -->
        <div v-else-if="item.special === 'spacer'" class="spacer"></div>

        <!-- No link -->
        <div v-else>
          <a v-bind="props.action">
            <span v-if="item.icon" :class="{ [item.icon]: true }" />
            <span v-if="!item.iconOnly && item.label">{{ t(item.label as string) }}</span>
          </a>
        </div>
      </template>
    </Menubar>

    <div
      :class="[
        'overflow-auto',
        {
          'size-[calc(100%-4*var(--spacing))] m-2 mt-0': routerViewDepth === 0,
          'size-full': routerViewDepth !== 0,
        },
      ]"
    >
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import Menubar from 'primevue/menubar'
import Divider from 'primevue/divider'

import {
  makeEndSectionMenuItems,
  menuItemsFromRoute,
  setupDepthTracker,
  type GenericContainerProps,
} from '../helpers'
import { libRouteRecords } from '@/router'

// Calling setupDepthTracker() is mandatory for all components with a <RouterView />
const routerViewDepth = setupDepthTracker()

import { useRoute, type RouteLocationMatched } from 'vue-router'
import { computed, type ComputedRef } from 'vue'
import { useI18nLib } from '@/locales'

const route = useRoute()
const levelRoute: ComputedRef<RouteLocationMatched> = computed(() => {
  return route.matched[routerViewDepth] as RouteLocationMatched
})

const { t } = useI18nLib()

export interface NavBarContainerProps extends GenericContainerProps {
  depth?: number
}

const {
  depth = 1,
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
} = defineProps<NavBarContainerProps>()

const menuItems = menuItemsFromRoute(levelRoute, depth).concat(makeEndSectionMenuItems(end))
</script>
