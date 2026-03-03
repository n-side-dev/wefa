import { createRouter, createWebHistory } from 'vue-router'
import DemoView from '@/demo/views/DemoView.vue'
import ShowcaseView from '@/demo/views/ShowcaseView.vue'
import PlaygroundView from '@/demo/views/PlaygroundView.vue'
import DemoContent from '@/demo/views/DemoContent.vue'

export interface WeFaRouteMeta {
  section?: string
  showInNavigation?: boolean
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: DemoView,
      meta: {
        title: 'Home',
        icon: 'pi pi-home',
        wefa: {
          showInNavigation: true,
        } as WeFaRouteMeta,
      },
    },
    {
      path: '/showcase',
      name: 'showcase',
      component: ShowcaseView,
      meta: {
        title: 'Showcase',
        icon: 'pi pi-bars',
        wefa: {
          showInNavigation: true,
        } as WeFaRouteMeta,
      },
    },
    {
      path: '/playground',
      name: 'playground',
      component: PlaygroundView,
      meta: {
        title: 'Playground',
        wefa: {
          showInNavigation: true,
          section: 'Others',
        } as WeFaRouteMeta,
      },
    },
    {
      path: '/demo',
      name: 'demo',
      component: DemoContent,
      meta: {
        title: 'Demo',
        wefa: {
          showInNavigation: true,
          section: 'Others',
        } as WeFaRouteMeta,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: () => import('@/components/NotFound/NotFound.vue'),
    },
  ],
})

export default router
