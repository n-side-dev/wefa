import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, waitFor } from 'storybook/test'
import { useRouter, type RouteMeta, type RouteRecordRaw, type Router } from 'vue-router'
import LayoutComponent from './LayoutComponent.vue'

interface RouteMetaWefaNavigation {
  showInNavigation?: boolean
  section?: string
}

interface StoryRouteMeta extends RouteMeta {
  showInNavigation?: boolean
  section?: string
  wefa?: RouteMetaWefaNavigation
}

type RouteConfigurationMode = 'legacy' | 'wefa'

interface RouteNavigationConfiguration {
  mode: RouteConfigurationMode
  showInNavigation: boolean
  section?: string
}

type RouterNavigationConfiguration = Record<string, RouteNavigationConfiguration>

const defaultRouteMetaByName = new Map<string, StoryRouteMeta>()
let defaultRouteMetaCaptured = false
let routerInstance: Router | null = null

function walkRoutes(routes: RouteRecordRaw[], callback: (route: RouteRecordRaw) => void) {
  for (const route of routes) {
    callback(route)

    if (route.children?.length) {
      walkRoutes(route.children, callback)
    }
  }
}

function cloneRouteMeta(meta: RouteMeta | StoryRouteMeta | undefined): StoryRouteMeta {
  return structuredClone((meta ?? {}) as StoryRouteMeta)
}

function captureDefaultRouteMeta(routes: RouteRecordRaw[]) {
  if (defaultRouteMetaCaptured) {
    return
  }

  walkRoutes(routes, (route) => {
    if (!route.name) {
      return
    }

    defaultRouteMetaByName.set(String(route.name), cloneRouteMeta(route.meta))
  })

  defaultRouteMetaCaptured = true
}

function resetRouteMeta(routes: RouteRecordRaw[]) {
  walkRoutes(routes, (route) => {
    if (!route.name) {
      return
    }

    route.meta = cloneRouteMeta(defaultRouteMetaByName.get(String(route.name)))
  })
}

function applyNavigationConfiguration(
  routes: RouteRecordRaw[],
  configuration: RouterNavigationConfiguration
) {
  resetRouteMeta(routes)

  walkRoutes(routes, (route) => {
    if (!route.name) {
      return
    }

    const routeConfiguration = configuration[String(route.name)]
    if (!routeConfiguration) {
      return
    }

    const routeMeta = cloneRouteMeta(route.meta)

    if (routeConfiguration.mode === 'legacy') {
      routeMeta.showInNavigation = routeConfiguration.showInNavigation
      if (routeConfiguration.section) {
        routeMeta.section = routeConfiguration.section
      } else {
        delete routeMeta.section
      }
      delete routeMeta.wefa
    } else {
      routeMeta.wefa = {
        ...routeMeta.wefa,
        showInNavigation: routeConfiguration.showInNavigation,
      }

      if (routeConfiguration.section) {
        routeMeta.wefa.section = routeConfiguration.section
      } else {
        delete routeMeta.wefa.section
      }

      delete routeMeta.showInNavigation
      delete routeMeta.section
    }

    route.meta = routeMeta
  })
}

function findRouteMeta(routeName: string): StoryRouteMeta {
  const router = routerInstance
  if (!router) {
    throw new Error('Router instance is not available')
  }

  const routes = router.options.routes as RouteRecordRaw[]
  let foundMeta: StoryRouteMeta | null = null

  walkRoutes(routes, (route) => {
    if (String(route.name) === routeName) {
      foundMeta = (route.meta ?? {}) as StoryRouteMeta
    }
  })

  if (!foundMeta) {
    throw new Error(`Route with name "${routeName}" was not found`)
  }

  return foundMeta
}

const legacyNavigationConfiguration = {
  home: { mode: 'legacy', showInNavigation: true },
  products: { mode: 'legacy', showInNavigation: true },
  users: { mode: 'legacy', showInNavigation: true },
} satisfies RouterNavigationConfiguration

const wefaSectionedConfiguration = {
  home: { mode: 'wefa', showInNavigation: true },
  Dashboard: { mode: 'wefa', showInNavigation: true, section: 'Insights' },
  Analytics: { mode: 'wefa', showInNavigation: true, section: 'Insights' },
  users: { mode: 'wefa', showInNavigation: true, section: 'Administration' },
} satisfies RouterNavigationConfiguration

const mixedNestedConfiguration = {
  home: { mode: 'legacy', showInNavigation: true },
  products: { mode: 'wefa', showInNavigation: true, section: 'Catalog' },
  users: { mode: 'legacy', showInNavigation: true, section: 'Accounts' },
} satisfies RouterNavigationConfiguration

const meta = {
  title: 'Components/LayoutComponent',
  component: LayoutComponent,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    projectTitle: 'WeFa Storybook',
  },
  argTypes: {
    projectTitle: {
      control: 'text',
      description: 'Label shown in desktop and mobile navigation headers.',
    },
  },
  decorators: [
    (story, context) => ({
      components: { story },
      template: `
        <div class="min-h-screen bg-surface-100">
          <story />
        </div>
      `,
      async beforeMount() {
        const router = useRouter()
        routerInstance = router
        const routes = router.options.routes as RouteRecordRaw[]
        captureDefaultRouteMeta(routes)

        const configuration =
          (context.parameters.routerNavigationConfiguration as RouterNavigationConfiguration) ?? {}

        applyNavigationConfiguration(routes, configuration)

        const initialPath = (context.parameters.initialPath as string) ?? '/'
        await router.push(initialPath)
      },
    }),
  ],
} satisfies Meta<typeof LayoutComponent>

export default meta
type Story = StoryObj<typeof meta>

export const LegacyMetaFields: Story = {
  parameters: {
    initialPath: '/products',
    routerNavigationConfiguration: legacyNavigationConfiguration,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(findRouteMeta('home').showInNavigation).toBe(true)
      expect(findRouteMeta('products').showInNavigation).toBe(true)
      expect(findRouteMeta('users').showInNavigation).toBe(true)
    })

    await waitFor(() => {
      const productLabels = canvas.getAllByText(/^Products$/)
      expect(productLabels.length).toBeGreaterThan(0)
    })
  },
}

export const WefaSectionedMeta: Story = {
  parameters: {
    initialPath: '/analytics',
    routerNavigationConfiguration: wefaSectionedConfiguration,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(findRouteMeta('Dashboard').wefa?.showInNavigation).toBe(true)
      expect(findRouteMeta('Dashboard').wefa?.section).toBe('Insights')
      expect(findRouteMeta('users').wefa?.section).toBe('Administration')
    })

    await waitFor(() => {
      expect(canvas.getByText('Tab 2 Content')).toBeInTheDocument()
    })
  },
}

export const MixedNestedRoutes: Story = {
  parameters: {
    initialPath: '/products/category/electronics/item/laptop',
    routerNavigationConfiguration: mixedNestedConfiguration,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(findRouteMeta('home').showInNavigation).toBe(true)
      expect(findRouteMeta('products').wefa?.section).toBe('Catalog')
      expect(findRouteMeta('users').section).toBe('Accounts')
    })

    await waitFor(() => {
      expect(canvas.getByText('Category')).toBeInTheDocument()
      expect(canvas.getByText('Product Item')).toBeInTheDocument()
    })
  },
}
