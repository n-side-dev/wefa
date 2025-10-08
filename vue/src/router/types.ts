import type { RouteRecordRaw, RouteMeta } from 'vue-router'

// If updated, you need to update the documentation in router.mdx
export interface WeFaRouteMeta extends RouteMeta {
  title: string
  icon?: string
  requiresAuth?: boolean
  requiresUnauth?: boolean
  showInNavigation?: boolean
}

export type WeFaRouteRecordRaw = RouteRecordRaw & {
  meta: WeFaRouteMeta
}
