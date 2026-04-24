import { config } from '@vue/test-utils'
import { createLibI18n } from './src/locales'
import PrimeVue from 'primevue/config'
import { vi } from 'vitest'

const i18n = createLibI18n()

const localStorageState = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => (localStorageState.has(key) ? localStorageState.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => {
    localStorageState.set(key, String(value))
  }),
  removeItem: vi.fn((key: string) => {
    localStorageState.delete(key)
  }),
  clear: vi.fn(() => {
    localStorageState.clear()
  }),
  key: vi.fn((index: number) => Array.from(localStorageState.keys())[index] ?? null),
}

Object.defineProperty(localStorageMock, 'length', {
  get: () => localStorageState.size,
})

vi.stubGlobal('localStorage', localStorageMock)

// PrimeVue must come before i18n: createLibI18n's install hook syncs PrimeVue's
// `config.locale` with the active vue-i18n locale, which requires PrimeVue to
// already be installed on the app.
config.global.plugins = [
  PrimeVue,
  i18n
]

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
