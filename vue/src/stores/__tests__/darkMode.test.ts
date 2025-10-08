import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDarkModeStore } from '../darkMode'

describe('useDarkModeStore', () => {
  let classListAdd: ReturnType<typeof vi.fn>
  let classListRemove: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Set up fresh Pinia instance before each test
    setActivePinia(createPinia())

    // Mock document.documentElement.classList
    classListAdd = vi.fn()
    classListRemove = vi.fn()
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          add: classListAdd,
          remove: classListRemove,
        },
      },
    })

    // Mock matchMedia
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  it('should default to system mode', () => {
    const store = useDarkModeStore()
    expect(store.mode).toBe('system')
  })

  it('should set dark mode and apply class', () => {
    const store = useDarkModeStore()
    store.setDarkMode()
    expect(store.mode).toBe('dark')
    expect(classListAdd).toHaveBeenCalledWith('app-dark-mode')
  })

  it('should set light mode and remove class', () => {
    const store = useDarkModeStore()
    store.setLightMode()
    expect(store.mode).toBe('light')
    expect(classListRemove).toHaveBeenCalledWith('app-dark-mode')
  })

  it('should set system mode and apply correct class based on matchMedia', () => {
    const store = useDarkModeStore()
    store.setSystemMode()
    expect(store.mode).toBe('system')
    expect(classListAdd).toHaveBeenCalledWith('app-dark-mode')
  })

  it('should update the dark mode selector', () => {
    const store = useDarkModeStore()
    store.setDarkModeSelector('custom-dark')
    store.setDarkMode()
    expect(classListAdd).toHaveBeenCalledWith('custom-dark')
  })
})
