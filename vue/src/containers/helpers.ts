import type { MenuItem } from 'primevue/menuitem'
import { inject, provide, type Ref } from 'vue'
import {
  type RouteLocationMatched,
  type RouteRecordRaw,
  type RouteLocationAsRelativeGeneric,
  type RouteLocationAsPathGeneric,
} from 'vue-router'
import type { WeFaRouteMeta } from '@/router'
import { useI18nLib } from '@/locales'

export interface GenericContainerProps {
  depth?: number
  start?: {
    logo?: string
    appName?: string
  }
  end?: {
    showUser: boolean
    showSettings: boolean
    showLogout: boolean
    settingsRoute: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
    logoutRoute: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
  }
}

/**
 * Generates a list of PrimeVue-compatible MenuItem by inspecting children of a provided route
 * @param routeLocationMatched route to inspect, obtain with useRoute().matched[routerViewDepth]
 * @param depth how deep to recursively look for children, 1 is the base
 * @returns MenuItem[] compatible with PrimeVue Menu components
 */
export function menuItemsFromRoute(
  routeLocationMatched: Ref<RouteLocationMatched>,
  depth: number = 1
): MenuItem[] {
  return routeLocationMatched.value.children
    ?.filter((child: RouteRecordRaw) => {
      const routeMeta = child.meta?.wefa as WeFaRouteMeta | undefined
      return routeMeta?.showInNavigation === undefined || routeMeta.showInNavigation
    })
    .map((child: RouteRecordRaw) => {
      return itemizeRouteRecordRaw(child, routeLocationMatched.value.path, depth, 1)
    })
}

/**
 * Sub function of menuItemsFromRoute, used to build MenuItem instances
 * @param routeRecordRaw recursion node
 * @param parentPath required to build full paths
 * @param maxDepth recursion limiter
 * @param currentDepth recursion accumulator
 * @returns MenuItem instance
 */
export function itemizeRouteRecordRaw(
  routeRecordRaw: RouteRecordRaw,
  parentPath: string,
  maxDepth: number,
  currentDepth: number
): MenuItem {
  const currentPath = `${parentPath}/${routeRecordRaw.path}`
  const routeMeta = routeRecordRaw.meta?.wefa as WeFaRouteMeta | undefined

  const menuItem: MenuItem = {
    label: routeMeta?.title ?? String(routeRecordRaw.name ?? routeRecordRaw.path),
    icon: routeMeta?.icon,
    to: { path: currentPath },
    depth: currentDepth,
    items:
      currentDepth < maxDepth
        ? routeRecordRaw.children?.map((child: RouteRecordRaw) => {
            return itemizeRouteRecordRaw(child, currentPath, maxDepth, currentDepth + 1)
          })
        : undefined,
  }

  return menuItem
}

/**
 * Builds an end section to a PrimeVue-Menu-based component
 * @param endProps "end" section of GenericContainerProps
 * @returns MenuItem[] compatible with PrimeVue Menu components
 */
export function makeEndSectionMenuItems(endProps: GenericContainerProps['end']): MenuItem[] {
  if (!endProps) {
    return []
  }

  // For translations
  const { t } = useI18nLib()

  const endItems: MenuItem[] = []

  if (endProps.showUser) {
    endItems.push({
      label: 'John Doe', // Tracked in SOFA-292: replace with authStore-backed user data.
      icon: 'pi pi-user',
    })
  }

  if (endProps.showSettings) {
    endItems.push({
      label: t('navigation.settings'),
      icon: 'pi pi-cog',
      iconOnly: true,
      to: endProps.settingsRoute,
    })
  }

  if (endProps.showLogout) {
    endItems.push({
      label: t('navigation.signout'),
      icon: 'pi pi-sign-out',
      iconOnly: true,
      to: endProps.logoutRoute,
    })
  }

  if (endItems.length) {
    endItems.unshift({ special: 'spacer' }, { special: 'divider' })
  }

  return endItems
}

/**
 * Set up a Router depth tracker, used by container components to extract their target route from the router
 * This NEEDS to be called on any component with a <RouterView />
 * Use like this :
 * const targetRoute = useRoute().matched[routerViewDepth]
 * @returns current routerViewDepth on a component instance.
 */
export function setupDepthTracker(): number {
  const routerViewDepth = inject('routerViewDepth', 0)
  provide('routerViewDepth', routerViewDepth + 1)
  return routerViewDepth
}
