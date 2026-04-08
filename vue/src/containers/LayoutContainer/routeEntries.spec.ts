import { describe, it, expect } from 'vitest'
import { defineComponent } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import {
  routeAssistantManifestEntries,
  routeCommandPaletteEntries,
  routeNavigationEntries,
} from '@/router/routeEntries'

const StubView = defineComponent({
  template: '<div />',
})

describe('routeEntries', () => {
  it('extracts navigation entries with normalized nested paths', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/reports/',
        name: 'reports',
        component: StubView,
        meta: {
          wefa: {
            title: 'Reports',
            icon: 'pi pi-chart-line',
            showInNavigation: true,
          },
        },
      },
      {
        path: '/settings',
        name: 'settings',
        component: StubView,
        meta: {
          wefa: {
            title: 'Settings',
            showInNavigation: true,
            section: ' Admin ',
          },
        },
        children: [
          {
            path: 'users/',
            name: 'users',
            component: StubView,
            meta: {
              wefa: {
                title: 'Users',
                showInNavigation: true,
                section: 'Admin',
              },
            },
          },
        ],
      },
      {
        path: '/hidden',
        name: 'hidden',
        component: StubView,
        meta: {
          wefa: {
            title: 'Hidden',
          },
        },
      },
    ]

    expect(routeNavigationEntries(routes)).toEqual([
      {
        path: '/reports',
        label: 'Reports',
        icon: 'pi pi-chart-line',
        section: undefined,
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: undefined,
        section: 'Admin',
      },
      {
        path: '/settings/users',
        label: 'Users',
        icon: undefined,
        section: 'Admin',
      },
    ])
  })

  it('extracts command palette entries and skips dynamic/wildcard routes', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/home',
        name: 'home',
        component: StubView,
        meta: {
          wefa: {
            title: 'Home',
            showInCommandPalette: true,
          },
        },
      },
      {
        path: '/users/:id',
        name: 'userDetails',
        component: StubView,
        meta: {
          wefa: {
            title: 'User Details',
            showInCommandPalette: true,
          },
        },
      },
      {
        path: '/products',
        name: 'products',
        component: StubView,
        meta: {
          wefa: {
            title: 'Products',
            showInCommandPalette: true,
          },
        },
        children: [
          {
            path: ':productId',
            name: 'productDetails',
            component: StubView,
            meta: {
              wefa: {
                title: 'Product Details',
                showInCommandPalette: true,
              },
            },
          },
          {
            path: 'overview',
            name: 'productOverview',
            component: StubView,
            meta: {
              wefa: {
                title: 'Overview',
                showInCommandPalette: true,
              },
            },
          },
        ],
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: StubView,
        meta: {
          wefa: {
            title: 'Not Found',
            showInCommandPalette: true,
          },
        },
      },
    ]

    expect(routeCommandPaletteEntries(routes)).toEqual([
      {
        path: '/home',
        label: 'Home',
        icon: undefined,
        section: undefined,
      },
      {
        path: '/products',
        label: 'Products',
        icon: undefined,
        section: undefined,
      },
      {
        path: '/products/overview',
        label: 'Overview',
        icon: undefined,
        section: undefined,
      },
    ])
  })

  it('extracts assistant manifest entries from route metadata and keeps parameterized routes', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/catalog',
        name: 'catalog',
        component: StubView,
        meta: {
          wefa: {
            title: 'Catalog',
            assistant: {
              docId: 'catalog.list',
              routeLabelKey: 'catalog.title',
            },
          },
        },
        children: [
          {
            path: ':productId',
            name: 'productDetails',
            component: StubView,
            meta: {
              wefa: {
                title: 'Product Details',
                assistant: {
                  docId: 'catalog.product.details',
                },
              },
            },
          },
        ],
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: StubView,
        meta: {
          wefa: {
            title: 'Not Found',
            assistant: {
              docId: 'not.found',
            },
          },
        },
      },
      {
        path: '/duplicate',
        name: 'duplicate',
        component: StubView,
        meta: {
          wefa: {
            title: 'Duplicate',
            assistant: {
              docId: 'catalog.list',
            },
          },
        },
      },
    ]

    expect(routeAssistantManifestEntries(routes)).toEqual([
      {
        docId: 'catalog.list',
        pathTemplate: '/catalog',
        label: 'Catalog',
        routeName: 'catalog',
        section: undefined,
        icon: undefined,
        routeLabelKey: 'catalog.title',
        routeSummaryKey: undefined,
      },
      {
        docId: 'catalog.product.details',
        pathTemplate: '/catalog/:productId',
        label: 'Product Details',
        routeName: 'productDetails',
        section: undefined,
        icon: undefined,
        routeLabelKey: undefined,
        routeSummaryKey: undefined,
      },
    ])
  })
})
