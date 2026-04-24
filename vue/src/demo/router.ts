import { unref } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DemoView from '@/demo/views/DemoView.vue'
import ShowcaseView from '@/demo/views/ShowcaseView.vue'
import PlaygroundView from '@/demo/views/PlaygroundView.vue'
import DemoContent from '@/demo/views/DemoContent.vue'
import LoginView from '@/demo/views/LoginView.vue'
import { backendStore } from '@/demo/backendStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      wefa: {
        title: 'Sign in',
        requiresUnauth: true,
      },
    },
  },
  {
    path: '/home',
    name: 'home',
    component: DemoView,
    meta: {
      wefa: {
        title: 'Home',
        icon: 'pi pi-home',
        showInNavigation: true,
        requiresAuth: true,
      },
    },
  },
  {
    path: '/showcase',
    name: 'showcase',
    component: ShowcaseView,
    meta: {
      wefa: {
        title: 'Showcase',
        icon: 'pi pi-bars',
        showInNavigation: true,
        requiresAuth: true,
      },
    },
  },
  {
    path: '/playground',
    name: 'playground',
    component: PlaygroundView,
    meta: {
      wefa: {
        title: 'Playground',
        showInNavigation: true,
        section: 'Others',
        requiresAuth: true,
      },
    },
  },
  {
    path: '/demo',
    name: 'demo',
    component: DemoContent,
    meta: {
      wefa: {
        title: 'Demo',
        showInNavigation: true,
        section: 'Others',
        requiresAuth: true,
      },
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/components/NotFound/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  // Pinia auto-unwraps refs on the store, so `backendStore.authenticated` is a
  // plain boolean at runtime; `unref()` keeps this safe either way.
  const authenticated = Boolean(unref(backendStore.authenticated))
  const requiresAuth = to.matched.some((record) => record.meta.wefa?.requiresAuth === true)
  const requiresUnauth = to.matched.some((record) => record.meta.wefa?.requiresUnauth === true)
  if (requiresAuth && !authenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (requiresUnauth && authenticated) {
    return { path: '/home' }
  }
  return true
})

export default router
