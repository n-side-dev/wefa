import { config } from '@vue/test-utils'
import { createLibI18n } from './src/locales'
import PrimeVue from 'primevue/config'
import { vi } from 'vitest'

const i18n = createLibI18n()

config.global.plugins = [
  i18n,
  PrimeVue
]

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
