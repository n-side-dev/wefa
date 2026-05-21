import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useBackendStore, type AuthenticationType } from '@/stores'
import { usePermission } from '../usePermission'

describe('composables/usePermission', () => {
  let backendStore: ReturnType<typeof useBackendStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    backendStore = useBackendStore({
      authenticationType: 'TOKEN' as AuthenticationType,
    })
  })

  it('returns false when the user holds no permissions', () => {
    const allowed = usePermission('order.delete')
    expect(allowed.value).toBe(false)
  })

  it('returns true when the requirement array is empty (vacuous)', () => {
    backendStore.setPermissions([])
    const allowed = usePermission([])
    expect(allowed.value).toBe(true)
  })

  it('returns true when a single required permission is granted', () => {
    backendStore.setPermissions(['order.delete'])
    const allowed = usePermission('order.delete')
    expect(allowed.value).toBe(true)
  })

  it("requires ALL permissions in 'all' mode (default)", () => {
    backendStore.setPermissions(['a'])
    const allowed = usePermission(['a', 'b'])
    expect(allowed.value).toBe(false)
  })

  it("requires only ONE permission in 'any' mode", () => {
    backendStore.setPermissions(['a'])
    const allowed = usePermission(['a', 'b'], { mode: 'any' })
    expect(allowed.value).toBe(true)
  })

  it('reacts to changes in the permission name argument (ref)', () => {
    backendStore.setPermissions(['users.read'])
    const name = ref<string>('users.write')
    const allowed = usePermission(name)
    expect(allowed.value).toBe(false)
    name.value = 'users.read'
    expect(allowed.value).toBe(true)
  })

  it('reacts to changes in the underlying permission set', () => {
    const allowed = usePermission('feature.beta')
    expect(allowed.value).toBe(false)
    backendStore.setPermissions(['feature.beta'])
    expect(allowed.value).toBe(true)
  })

  it('clears the computed result when the store is logged out', () => {
    backendStore.setPermissions(['feature.beta'])
    const allowed = usePermission('feature.beta')
    expect(allowed.value).toBe(true)
    backendStore.logout()
    expect(allowed.value).toBe(false)
  })
})
