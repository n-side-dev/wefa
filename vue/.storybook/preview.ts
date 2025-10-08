import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createRouter, createWebHistory } from 'vue-router'
import type { App } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { createLibI18n } from '../src/locales'
import '../src/assets/main.css'
import NotFoundView from '../src/views/NotFoundView.vue'
import PlaceholderView from '@/containers/storybook/PlaceholderView.vue'
import { SideMenuContainer, BareContainer, NavbarContainer } from '@/containers'

// Create fake routes for stories
const dummyRoutes = [
  {
    path: '/',
    name: 'home',
    meta: { title: 'Home', icon: 'pi pi-home' },
    component: { template: '<div>Home</div>' }
  },
  {
    path: '/products',
    name: 'products',
    meta: { title: 'Products', icon: 'pi pi-box' },
    component: { template: '<div>Products</div>' },
    children: [
      {
        path: 'category/:id',
        name: 'category',
        meta: { title: 'Category', icon: 'pi pi-tag' },
        component: { template: '<div>Category</div>' },
        children: [
          {
            path: 'item/:itemId',
            name: 'item',
            meta: { title: 'Product Item', icon: 'pi pi-shopping-cart' },
            component: { template: '<div>Item</div>' }
          }
        ]
      }
    ]
  },
  {
    path: '/users',
    name: 'users',
    meta: { title: 'Users', icon: 'pi pi-users' },
    component: { template: '<div>Users</div>' },
    children: [
      {
        path: 'profile/:id',
        name: 'profile',
        meta: { title: 'User Profile', icon: 'pi pi-user' },
        component: { template: '<div>Profile</div>' }
      }
    ]
  },
  // Routes for RoutedTabsComponent stories
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: { title: 'Dashboard', icon: 'pi pi-chart-line' },
    component: { template: '<div><h2>Tab 1 Content</h2><p>This is the content for the first tab.</p></div>' }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    meta: { title: 'Analytics', icon: 'pi pi-chart-bar' },
    component: { template: '<div><h2>Tab 2 Content</h2><p>This is the content for the second tab.</p></div>' }
  },
  {
    path: '/containers',
    name: 'Container Demo',
    meta: { title: 'Container Demo' },
    component: BareContainer,
    children: [
      {
        path: 'settings',
        name: 'settings',
        meta: { title: 'Settings' },
        component: SideMenuContainer,
        children: [
          { path: 'passwordreset', name: 'passwordreset', meta: { title: 'Password', icon: 'pi pi-asterisk' }, component: PlaceholderView },
          { path: 'apitoken', name: 'apitoken', meta: { title: 'API Token', icon: 'pi pi-key' }, redirect: {name: 'apitoken-readonly'}, component: NavbarContainer, children: [
            { path: 'readonly', name: 'apitoken-readonly', meta: { title: 'Read-Only' }, component: PlaceholderView },
            { path: 'readwrite', name: 'apitoken-readwrite', meta: { title: 'Read + Write' }, component: PlaceholderView },
            { path: 'admin', name: 'apitoken-admin', meta: { title: 'Admin' }, component: NavbarContainer, children: [
              { path: 'audit', name: 'apitoken-admin-audit', meta: { title: 'Audit' }, component: PlaceholderView },
              { path: 'logs', name: 'apitoken-admin-logs', meta: { title: 'Logs' }, component: PlaceholderView }
            ]}
          ]},
          { path: 'preferences', name: 'preferences', meta: { title: 'Preferences', icon: 'pi pi-user-edit' }, component: PlaceholderView },
        ],
      },
    ]
  },
  
  // Add a catch-all route to handle any unmatched paths
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: NotFoundView
  }
]

// Create a router instance
const router = createRouter({
  history: createWebHistory(),
  routes: dummyRoutes
})

// Silence warnings for Storybook iframe paths
router.beforeEach((to, from, next) => {
  // Check if the path starts with /iframe.html (Storybook specific)
  if (to.path.startsWith('/iframe.html')) {
    // Allow navigation but don't trigger warnings
    next()
    return
  }
  next()
})

const i18n = createLibI18n()

// Set up global dependencies for all stories
setup((app: App) => {
  app.use(router)
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
    },
  })
  app.use(i18n)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'tod o' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    options: {
      storySort: {
        order: [
          'Router containers', [
            'Overview',
            'BareContainer',
            'NavbarContainer',
            'SideMenuContainer',
            'Making your own Container'
          ],
        ],
      },
    },
  },
}

export default preview
