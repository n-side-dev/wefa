// CSS
import '../assets/main.css'

// APP
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)

import { type CookieConfiguration, cookiesPlugin } from '@/plugins/cookies'

const cookies: CookieConfiguration[] = [
  {
    type: 'Essential',
    key: 'essential',
    name: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function property.',
  },
]

// TanStack for API Clients
import { VueQueryPlugin } from '@tanstack/vue-query'
app.use(VueQueryPlugin)

// Setup axios, manually providing the baseUrl in the absence of BACKEND_BASE_URL
import { axiosInstance } from '@/network'
axiosInstance.defaults.baseURL = 'http://localhost:8000'

// Setup typed api client, from OpenAPI schema
// If not done, first generate code with npm run openapi-codegen
import { client } from '@/demo/openapi/client.gen.ts'
import { typedApiClient } from '@/network'
typedApiClient.setupOpenApiClient(client)

// Pinia for stores
import pinia from './pinia.ts'
app.use(pinia)

// Restore the user's theme preference from localStorage (no-op in SSR).
import { useDarkModeStore } from '@/stores'
const darkModeStore = useDarkModeStore()
darkModeStore.setLocalStorageKey('dark-mode-wefa-demo')

// PrimeToasts
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
app.use(ToastService)
app.use(ConfirmationService)

// Primevue (install BEFORE i18n so vue-i18n can sync PrimeVue's locale)
import PrimeVue from 'primevue/config'
import { nsidePrimeVueTheme } from '@/theme'
app.use(PrimeVue, {
  theme: nsidePrimeVueTheme,
})

// i18n (install AFTER PrimeVue so the plugin can sync PrimeVue's locale)
import { createLibI18n, type CreateLibI18nOptions } from '@/locales'
const demoMessages = import.meta.glob('./locales/*/*.json', {
  eager: true,
}) as CreateLibI18nOptions['glob']
const i18n = createLibI18n({ glob: demoMessages })
app.use(i18n)

// Router
import { backendStore } from '@/demo/backendStore.ts'
import router from './router.ts'

import {
  defaultLegalConsentRoute,
  defaultPrivacyNoticeRoute,
  defaultTermsOfUseRoute,
  legalConsentPlugin,
  localeSelectorPlugin,
} from '@/plugins'
app.use(router)
app.use(legalConsentPlugin, {
  router: router,
  backendStore: backendStore,
  path: 'legal-consent',
  // Overlay `meta.wefa.title` on the library defaults so the breadcrumb and
  // any future nav entries pick up a human-readable label instead of the raw
  // route name. Titles are not i18n-translated by the library's nav
  // rendering, so they stay in English here.
  termsOfUseRoute: {
    ...defaultTermsOfUseRoute,
    meta: { ...defaultTermsOfUseRoute.meta, wefa: { title: 'Terms of Use' } },
  },
  privacyNoticeRoute: {
    ...defaultPrivacyNoticeRoute,
    meta: { ...defaultPrivacyNoticeRoute.meta, wefa: { title: 'Privacy Notice' } },
  },
  legalConsentRoute: {
    ...defaultLegalConsentRoute,
    meta: { ...defaultLegalConsentRoute.meta, wefa: { title: 'Legal Consent' } },
  },
})
app.use(localeSelectorPlugin, { backendStore: backendStore, i18n: i18n, endpoint: 'locale' })
app.use(cookiesPlugin, { cookies: cookies })

// Re-evaluate navigation guards when authentication flips so post-login/logout
// route changes happen automatically.
backendStore.setupAuthRouteGuard(router)

app.mount('#app')
