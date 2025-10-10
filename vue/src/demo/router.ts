import { createRouter, createWebHistory } from 'vue-router'
import DemoView from './DemoView.vue'
import ShowcaseView from './ShowcaseView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'demo',
      component: DemoView,
    },
    {
      path: '/showcase',
      name: 'showcase',
      component: ShowcaseView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: () => import('@/components/NotFound/NotFound.vue'),
    },
  ],
})

export default router
