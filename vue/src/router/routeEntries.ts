import type { RouteRecordRaw } from 'vue-router'
import type { WeFaRouteMeta } from './types'

export interface WeFaRouteEntry {
  path: string
  label: string
  icon?: string
  section?: string
}

export interface WeFaAssistantManifestEntry {
  docId: string
  pathTemplate: string
  label: string
  routeName?: string
  section?: string
  icon?: string
  routeLabelKey?: string
  routeSummaryKey?: string
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
 * Recursively traverses route records and collects assistant manifest entries.
 * Wildcard routes are skipped because they do not represent actionable targets.
 * @param routes Route list to inspect
 * @param parentPath Parent route path used to resolve children
 * @returns Flattened assistant manifest entries in declaration order
 */
function collectAssistantManifestEntries(
  routes: RouteRecordRaw[],
  parentPath: string = '/'
): WeFaAssistantManifestEntry[] {
  const entries: WeFaAssistantManifestEntry[] = []

  for (const route of routes) {
    const fullPath = resolvePath(parentPath, route.path)
    const routeMeta = route.meta?.wefa as WeFaRouteMeta | undefined
    const docId = routeMeta?.assistant?.docId?.trim()

    if (docId && !fullPath.includes('*')) {
      entries.push({
        docId,
        pathTemplate: fullPath,
        label: routeMeta?.title ?? String(route.name ?? fullPath),
        routeName: route.name ? String(route.name) : undefined,
        section: routeMeta?.section?.trim() || undefined,
        icon: routeMeta?.icon,
        routeLabelKey: routeMeta?.assistant?.routeLabelKey,
        routeSummaryKey: routeMeta?.assistant?.routeSummaryKey,
      })
    }

    if (route.children?.length) {
      entries.push(...collectAssistantManifestEntries(route.children, fullPath))
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

/**
 * Extracts assistant manifest entries from the router tree based on assistant metadata.
 * Routes are included when `meta.wefa.assistant.docId` is provided.
 * @param routes Router records to inspect
 * @returns Flattened assistant manifest entries in declaration order
 */
export function routeAssistantManifestEntries(
  routes: RouteRecordRaw[]
): WeFaAssistantManifestEntry[] {
  const entries = collectAssistantManifestEntries(routes)
  const uniqueEntries: WeFaAssistantManifestEntry[] = []
  const seenDocIds = new Set<string>()

  for (const entry of entries) {
    if (seenDocIds.has(entry.docId)) {
      continue
    }
    seenDocIds.add(entry.docId)
    uniqueEntries.push(entry)
  }

  return uniqueEntries
}
