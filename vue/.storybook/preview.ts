import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createRouter, createWebHistory } from 'vue-router'
import type { App } from 'vue'
import PrimeVue from 'primevue/config'
import { createNsideTheme } from '../src/theme'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
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
    meta: {
      wefa: {
        title: 'Home',
        icon: 'pi pi-home',
        showInCommandPalette: true,
        assistant: {
          docId: 'home.page',
        },
      },
    },
    component: { template: '<div>Home</div>' },
  },
  {
    path: '/catalog',
    name: 'catalog',
    meta: {
      wefa: {
        title: 'Catalog',
        icon: 'pi pi-box',
        showInCommandPalette: true,
        assistant: {
          docId: 'catalog.list',
        },
      },
    },
    component: { template: '<div>Catalog</div>' },
  },
  {
    path: '/catalog/:id/edit',
    name: 'catalogEdit',
    meta: {
      wefa: {
        title: 'Edit Product',
        icon: 'pi pi-pencil',
        assistant: {
          docId: 'catalog.edit',
        },
      },
    },
    component: { template: '<div>Edit Product</div>' },
  },
  {
    path: '/products',
    name: 'products',
    meta: { wefa: { title: 'Products', icon: 'pi pi-box' } },
    component: { template: '<div>Products</div>' },
    children: [
      {
        path: 'category/:id',
        name: 'category',
        meta: { wefa: { title: 'Category', icon: 'pi pi-tag' } },
        component: { template: '<div>Category</div>' },
        children: [
          {
            path: 'item/:itemId',
            name: 'item',
            meta: { wefa: { title: 'Product Item', icon: 'pi pi-shopping-cart' } },
            component: { template: '<div>Item</div>' },
          },
        ],
      },
    ],
  },
  {
    path: '/users',
    name: 'users',
    meta: { wefa: { title: 'Users', icon: 'pi pi-users' } },
    component: { template: '<div>Users</div>' },
    children: [
      {
        path: 'profile/:id',
        name: 'profile',
        meta: { wefa: { title: 'User Profile', icon: 'pi pi-user' } },
        component: { template: '<div>Profile</div>' },
      },
    ],
  },
  // Routes for RoutedTabsComponent stories
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: { wefa: { title: 'Dashboard', icon: 'pi pi-chart-line' } },
    component: {
      template: '<div><h2>Tab 1 Content</h2><p>This is the content for the first tab.</p></div>',
    },
  },
  {
    path: '/analytics',
    name: 'Analytics',
    meta: { wefa: { title: 'Analytics', icon: 'pi pi-chart-bar' } },
    component: {
      template: '<div><h2>Tab 2 Content</h2><p>This is the content for the second tab.</p></div>',
    },
  },
  {
    path: '/containers',
    name: 'Container Demo',
    meta: { wefa: { title: 'Container Demo' } },
    component: BareContainer,
    children: [
      {
        path: 'settings',
        name: 'settings',
        meta: { wefa: { title: 'Settings' } },
        component: SideMenuContainer,
        children: [
          {
            path: 'passwordreset',
            name: 'passwordreset',
            meta: { wefa: { title: 'Password', icon: 'pi pi-asterisk' } },
            component: PlaceholderView,
          },
          {
            path: 'apitoken',
            name: 'apitoken',
            meta: { wefa: { title: 'API Token', icon: 'pi pi-key' } },
            redirect: { name: 'apitoken-readonly' },
            component: NavbarContainer,
            children: [
              {
                path: 'readonly',
                name: 'apitoken-readonly',
                meta: { wefa: { title: 'Read-Only' } },
                component: PlaceholderView,
              },
              {
                path: 'readwrite',
                name: 'apitoken-readwrite',
                meta: { wefa: { title: 'Read + Write' } },
                component: PlaceholderView,
              },
              {
                path: 'admin',
                name: 'apitoken-admin',
                meta: { wefa: { title: 'Admin' } },
                component: NavbarContainer,
                children: [
                  {
                    path: 'audit',
                    name: 'apitoken-admin-audit',
                    meta: { wefa: { title: 'Audit' } },
                    component: PlaceholderView,
                  },
                  {
                    path: 'logs',
                    name: 'apitoken-admin-logs',
                    meta: { wefa: { title: 'Logs' } },
                    component: PlaceholderView,
                  },
                ],
              },
            ],
          },
          {
            path: 'preferences',
            name: 'preferences',
            meta: { wefa: { title: 'Preferences', icon: 'pi pi-user-edit' } },
            component: PlaceholderView,
          },
        ],
      },
    ],
  },

  // Add a catch-all route to handle any unmatched paths
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: NotFoundView,
  },
]

// Create a router instance
const router = createRouter({
  history: createWebHistory(),
  routes: dummyRoutes,
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
      preset: createNsideTheme('green'),
    },
  })
  // Provide TanStack Query client for components/stories using useQuery/useMutation
  const queryClient = new QueryClient()
  app.use(VueQueryPlugin, { queryClient })
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
          'Overview',
          'Router containers',
          [
            'Overview',
            'BareContainer',
            'NavbarContainer',
            'SideMenuContainer',
            'Making your own Container',
          ],
          '...',
        ],
      },
    },
  },
}

export default preview
