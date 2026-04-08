import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DemoView from '@/demo/views/DemoView.vue'
import ShowcaseView from '@/demo/views/ShowcaseView.vue'
import PlaygroundView from '@/demo/views/PlaygroundView.vue'
import DemoContent from '@/demo/views/DemoContent.vue'
import CatalogView from '@/demo/views/CatalogView.vue'
import ProductCreateView from '@/demo/views/ProductCreateView.vue'
import CartView from '@/demo/views/CartView.vue'
import CheckoutView from '@/demo/views/CheckoutView.vue'

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
    path: '/catalog',
    name: 'catalogHome',
    component: CatalogView,
    meta: {
      wefa: {
        title: 'Catalog',
        icon: 'pi pi-box',
        showInNavigation: true,
        showInCommandPalette: true,
        section: 'Commerce',
        assistant: {
          docId: 'catalog.home',
        },
      },
    },
  },
  {
    path: '/catalog/products/new',
    name: 'productCreate',
    component: ProductCreateView,
    meta: {
      wefa: {
        title: 'Create Product',
        icon: 'pi pi-plus-circle',
        showInNavigation: true,
        showInCommandPalette: true,
        section: 'Commerce',
        assistant: {
          docId: 'catalog.product.create',
        },
      },
    },
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
    meta: {
      wefa: {
        title: 'Cart',
        icon: 'pi pi-shopping-cart',
        showInNavigation: true,
        showInCommandPalette: true,
        section: 'Commerce',
        assistant: {
          docId: 'cart.view',
        },
      },
    },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView,
    meta: {
      wefa: {
        title: 'Checkout',
        icon: 'pi pi-credit-card',
        showInNavigation: true,
        showInCommandPalette: true,
        section: 'Commerce',
        assistant: {
          docId: 'checkout.view',
        },
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
