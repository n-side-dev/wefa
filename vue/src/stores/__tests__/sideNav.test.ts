import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useSideNavStore } from '../sideNav'

describe('useSideNavStore', () => {
  let setItem: ReturnType<typeof vi.fn>
  let getItem: ReturnType<typeof vi.fn>
  let savedValue: string | null

  beforeEach(() => {
    setActivePinia(createPinia())

    savedValue = null
    setItem = vi.fn((_key: string, value: string) => {
      savedValue = value
    })
    getItem = vi.fn(() => savedValue)

    vi.stubGlobal('localStorage', {
      getItem,
      setItem,
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    })
  })

  it('defaults to expanded (collapsed = false)', () => {
    const store = useSideNavStore()
    expect(store.collapsed).toBe(false)
  })

  it('toggles collapsed state', () => {
    const store = useSideNavStore()
    store.toggle()
    expect(store.collapsed).toBe(true)
    store.toggle()
    expect(store.collapsed).toBe(false)
  })

  it('setCollapsed sets the explicit value', () => {
    const store = useSideNavStore()
    store.setCollapsed(true)
    expect(store.collapsed).toBe(true)
    store.setCollapsed(false)
    expect(store.collapsed).toBe(false)
  })

  it('persists changes to localStorage', async () => {
    const store = useSideNavStore()
    store.toggle()
    await nextTick()
    expect(setItem).toHaveBeenCalledWith('side-nav-collapsed-wefa', 'true')
  })

  it('reads saved value when setLocalStorageKey is called', () => {
    savedValue = 'true'
    const store = useSideNavStore()
    store.setLocalStorageKey('my-app-side-nav')
    expect(store.collapsed).toBe(true)
    expect(getItem).toHaveBeenCalledWith('my-app-side-nav')
  })

  it('uses the configured key when persisting', async () => {
    const store = useSideNavStore()
    store.setLocalStorageKey('my-app-side-nav')
    store.toggle()
    await nextTick()
    expect(setItem).toHaveBeenCalledWith('my-app-side-nav', 'true')
  })
})
