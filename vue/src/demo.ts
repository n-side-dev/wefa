import './assets/main.css'
import './demo/demo.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createLibI18n } from './locales'

import App from './demo/DemoApp.vue'
import router from './demo/router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

const app = createApp(App)
const i18n = createLibI18n({})

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.mount('#app')
