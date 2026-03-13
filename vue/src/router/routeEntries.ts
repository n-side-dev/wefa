import type { RouteRecordRaw } from 'vue-router'
import type { WeFaRouteMeta } from './types'

export interface WeFaRouteEntry {
  path: string
  label: string
  icon?: string
  section?: string
}

interface WeFaRouteEntryOptions {
  include: (meta: WeFaRouteMeta | undefined) => boolean
  excludeParameterizedRoutes?: boolean
}

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
 * Checks whether a route path contains route params or wildcard segments.
 * @param path Absolute route path
 * @returns True when route path is not directly actionable
 */
function isParameterizedPath(path: string): boolean {
  return path.includes(':') || path.includes('*')
}

/**
 * Recursively traverses route records and collects entries matching the configured filter.
 * @param routes Route list to inspect
 * @param options Collection options
 * @param parentPath Parent route path used to resolve children
 * @returns Flattened entries in declaration order
 */
function collectRouteEntries(
  routes: RouteRecordRaw[],
  options: WeFaRouteEntryOptions,
  parentPath: string = '/'
): WeFaRouteEntry[] {
  const entries: WeFaRouteEntry[] = []

  for (const route of routes) {
    const fullPath = resolvePath(parentPath, route.path)
    const routeMeta = route.meta?.wefa as WeFaRouteMeta | undefined

    if (
      options.include(routeMeta) &&
      (!options.excludeParameterizedRoutes || !isParameterizedPath(fullPath))
    ) {
      entries.push({
        path: fullPath,
        label: routeMeta?.title ?? String(route.name ?? fullPath),
        icon: routeMeta?.icon,
        section: routeMeta?.section?.trim() || undefined,
      })
    }

    if (route.children?.length) {
      entries.push(...collectRouteEntries(route.children, options, fullPath))
    }
  }

  return entries
}

/**
 * Extracts navigation entries from the router tree based on showInNavigation metadata.
 * @param routes Router records to inspect
 * @returns Flattened navigation entries in declaration order
 */
export function routeNavigationEntries(routes: RouteRecordRaw[]): WeFaRouteEntry[] {
  return collectRouteEntries(routes, {
    include: (meta) => meta?.showInNavigation === true,
  })
}

/**
 * Extracts command palette entries from the router tree based on showInCommandPalette metadata.
 * Dynamic and wildcard routes are skipped because they are not directly actionable.
 * @param routes Router records to inspect
 * @returns Flattened command entries in declaration order
 */
export function routeCommandPaletteEntries(routes: RouteRecordRaw[]): WeFaRouteEntry[] {
  return collectRouteEntries(routes, {
    include: (meta) => meta?.showInCommandPalette === true,
    excludeParameterizedRoutes: true,
  })
}
