// CSS
import './assets/main.css'
import './demo/demo.css'

// APP
import { createApp } from 'vue'
import App from './demo/DemoApp.vue'
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
import { client } from '@/demo/openapi/client.gen'
import { typedApiClient } from '@/network'
typedApiClient.setupOpenApiClient(client)

// Pinia for stores
import pinia from './demo/pinia'
app.use(pinia)

// PrimeToasts
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
app.use(ToastService)
app.use(ConfirmationService)

// i18n
import { createLibI18n } from './locales'
const i18n = createLibI18n({})
app.use(i18n)

// Router
import { backendStore } from '@/demo/backendStore.ts'
import router from './demo/router'

import { legalConsentPlugin } from '@/plugins'
app.use(router)
app.use(legalConsentPlugin, { router: router, backendStore: backendStore, path: 'legal-consent' })
app.use(cookiesPlugin, { cookies: cookies })

// Primevue
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.mount('#app')
