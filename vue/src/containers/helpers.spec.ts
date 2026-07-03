import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type {
  RouteLocationMatched,
  RouteLocationNormalizedLoaded,
  RouteRecordRaw,
} from 'vue-router'

import { itemizeRouteRecordRaw, menuItemsFromRoute } from './helpers'

const StubComponent = { template: '<div />' }

describe('router container helpers', () => {
  it('builds named menu item links with current route params', () => {
    const routeRecord: RouteRecordRaw = {
      path: 'summary',
      name: 'dynamic-summary',
      component: StubComponent,
    }
    const currentRoute = {
      params: {
        instanceId: 'instance-1',
        unrelatedId: 'discarded',
      },
    } as unknown as RouteLocationNormalizedLoaded

    const menuItem = itemizeRouteRecordRaw(routeRecord, '/dynamic/:instanceId', 1, 1, currentRoute)

    expect(menuItem.to).toEqual({
      name: 'dynamic-summary',
      params: {
        instanceId: 'instance-1',
      },
    })
  })

  it('keeps the path fallback for unnamed child routes', () => {
    const routeRecord: RouteRecordRaw = {
      path: 'summary',
      component: StubComponent,
    }

    const menuItem = itemizeRouteRecordRaw(routeRecord, '/static', 1, 1)

    expect(menuItem.to).toEqual({
      path: '/static/summary',
    })
  })

  it('passes current route params through nested menu items', () => {
    const levelRoute = ref({
      path: '/dynamic/:instanceId',
      children: [
        {
          path: 'summary',
          name: 'dynamic-summary',
          component: StubComponent,
          children: [
            {
              path: 'details',
              name: 'dynamic-details',
              component: StubComponent,
            },
          ],
        },
      ],
    } as unknown as RouteLocationMatched)
    const currentRoute = {
      params: {
        instanceId: 'instance-1',
      },
    } as unknown as RouteLocationNormalizedLoaded

    const menuItems = menuItemsFromRoute(levelRoute, 2, currentRoute)

    expect(menuItems[0]?.to).toEqual({
      name: 'dynamic-summary',
      params: {
        instanceId: 'instance-1',
      },
    })
    expect(menuItems[0]?.items?.[0]?.to).toEqual({
      name: 'dynamic-details',
      params: {
        instanceId: 'instance-1',
      },
    })
  })
})
