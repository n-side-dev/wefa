// Note: guards.ts currently hard-codes `isAuthenticated = true` /
// `isUnauthenticated = true` (tracked as SOFA-292). These tests lock in the
// current "never-redirect" behaviour; they need to be updated when the auth
// wiring lands.
import { describe, it, expect, vi } from 'vitest'
import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  NavigationGuardNext,
} from 'vue-router'
import type { BackendStore } from '@/stores'
import { requiresAuth, requiresUnauth, defaultRouteGuards } from '../guards'
import { createLibRouteRecords, libRouteRecords } from '../libRoutes'

/**
 * Build a minimal route whose `matched` entries carry the supplied meta shape.
 * @param meta Meta object attached to the single matched record.
 * @returns A RouteLocationNormalized suitable for guard invocation.
 */
function routeWithMeta(meta: Record<string, unknown>): RouteLocationNormalized {
  return {
    matched: [{ meta } as unknown as RouteLocationNormalized['matched'][number]],
  } as RouteLocationNormalized
}

const fromRoute = {} as RouteLocationNormalizedLoaded

describe('router/guards', () => {
  describe('requiresAuth', () => {
    it('does not call next with a redirect when authenticated (current stub)', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresAuth(routeWithMeta({ wefa: { requiresAuth: true } }), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })

    it('ignores routes without requiresAuth meta', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresAuth(routeWithMeta({}), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('requiresUnauth', () => {
    it('does not call next with a redirect when unauthenticated (current stub)', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresUnauth(routeWithMeta({ wefa: { requiresUnauth: true } }), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })

    it('ignores routes without requiresUnauth meta', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresUnauth(routeWithMeta({}), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('defaultRouteGuards', () => {
    it('runs both auth and unauth guards without throwing', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      expect(() =>
        defaultRouteGuards(
          routeWithMeta({ wefa: { requiresAuth: true, requiresUnauth: true } }),
          fromRoute,
          next
        )
      ).not.toThrow()
      expect(next).not.toHaveBeenCalled()
    })
  })
})

describe('router/libRoutes', () => {
  it('defines the login route metadata with the expected shape', () => {
    const login = libRouteRecords.login
    expect(login.path).toBe('/auth/login')
    expect(login.name).toBe('authLogin')
    expect(login.meta?.wefa?.title).toBe('Login')
    expect(login.meta?.wefa?.icon).toBe('pi pi-sign-in')
    expect(typeof login.component).toBe('function')
  })

  it('defines the logout route metadata with the expected shape', () => {
    const logout = libRouteRecords.logout
    expect(logout.path).toBe('/auth/logout')
    expect(logout.name).toBe('authLogout')
    expect(logout.meta?.wefa?.title).toBe('Logout')
    expect(logout.meta?.wefa?.icon).toBe('pi pi-sign-out')
    expect(typeof logout.component).toBe('function')
  })
})

describe('router/createLibRouteRecords', () => {
  /**
   * Build a minimal BackendStore double — just enough type surface for the
   * factory's prop closures to reference.
   */
  function makeBackendStore(): BackendStore {
    return { login: vi.fn(), logout: vi.fn() } as unknown as BackendStore
  }

  /**
   * Route records expose `props` as `boolean | Record | ((to) => Record)`.
   * The factory always produces a function so tests can call it with a
   * dummy route location and inspect the resulting props bag.
   * @param record Route record whose `props` field should be invoked.
   * @param record.props The prop function (or static value) under test.
   * @returns The props object produced by the record's prop function.
   */
  function invokeProps(record: { props?: unknown }): Record<string, unknown> {
    const propsFn = record.props as (to: unknown) => Record<string, unknown>
    expect(typeof propsFn).toBe('function')
    return propsFn({})
  }

  it('reuses the static path / name / meta and keeps the async component loader', () => {
    const records = createLibRouteRecords({ backendStore: makeBackendStore() })
    expect(records.login.path).toBe(libRouteRecords.login.path)
    expect(records.login.name).toBe(libRouteRecords.login.name)
    expect(records.login.meta).toEqual(libRouteRecords.login.meta)
    expect(typeof records.login.component).toBe('function')
    expect(records.logout.path).toBe(libRouteRecords.logout.path)
    expect(records.logout.name).toBe(libRouteRecords.logout.name)
  })

  it('binds backendStore and gdpr:true into the login props', () => {
    const backendStore = makeBackendStore()
    const records = createLibRouteRecords({ backendStore })
    expect(invokeProps(records.login)).toEqual({ backendStore, gdpr: true })
  })

  it('merges loginProps overrides over the defaults', () => {
    const backendStore = makeBackendStore()
    const records = createLibRouteRecords({
      backendStore,
      loginProps: { gdpr: false, logoAlt: 'Acme', defaultRedirect: '/home' },
    })
    expect(invokeProps(records.login)).toEqual({
      backendStore,
      gdpr: false,
      logoAlt: 'Acme',
      defaultRedirect: '/home',
    })
  })

  it('binds backendStore into the logout props', () => {
    const backendStore = makeBackendStore()
    const records = createLibRouteRecords({ backendStore })
    expect(invokeProps(records.logout)).toEqual({ backendStore })
  })

  it('merges logoutProps overrides over the defaults', () => {
    const backendStore = makeBackendStore()
    const records = createLibRouteRecords({
      backendStore,
      logoutProps: { redirectTo: { path: '/goodbye' } },
    })
    expect(invokeProps(records.logout)).toEqual({
      backendStore,
      redirectTo: { path: '/goodbye' },
    })
  })
})
