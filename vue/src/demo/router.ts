import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DemoView from '@/demo/views/DemoView.vue'
import ShowcaseView from '@/demo/views/ShowcaseView.vue'
import PlaygroundView from '@/demo/views/PlaygroundView.vue'
import DemoContent from '@/demo/views/DemoContent.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
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
        showInCommandPalette: true,
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
        showInCommandPalette: true,
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
        showInCommandPalette: true,
        section: 'Others',
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
        showInCommandPalette: true,
        section: 'Others',
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

export default router
