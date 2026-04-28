import type { RouteMeta, RouteRecordRaw } from 'vue-router'

// If updated, you need to update the documentation in router.mdx
export interface WeFaRouteMeta {
  title: string
  icon?: string
  requiresAuth?: boolean
  requiresUnauth?: boolean
  showInNavigation?: boolean
  section?: string
  showBreadcrumb?: boolean
  /**
   * When true, the route renders standalone outside the app's main
   * `LayoutContainer` (no side navigation, no breadcrumb). Used for forced
   * acceptance flows like the legal-consent gate.
   */
  fullscreen?: boolean
}

export type WeFaRouteRecordRaw = RouteRecordRaw & {
  meta: RouteMeta & {
    wefa: WeFaRouteMeta
  }
}

/**
 * Augment vue-router's RouteMeta globally so every route can carry WeFa metadata.
 *
 * Why:
 * - Vue Router exposes `route.meta` as a shared interface (`RouteMeta`).
 * - We add `wefa` to that interface so `route.meta.wefa` is type-safe everywhere
 *   (guards, containers, breadcrumb, stories, etc.).
 *
 * Notes:
 * - `wefa` is optional (`?`) because not every route must define it.
 * - This is type-only: it changes TypeScript checking/autocomplete, not runtime behavior.
 */
declare module 'vue-router' {
  interface RouteMeta {
    wefa?: WeFaRouteMeta
  }
}
