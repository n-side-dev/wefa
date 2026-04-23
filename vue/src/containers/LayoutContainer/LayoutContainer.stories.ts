import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, waitFor } from 'storybook/test'
import { useRouter, type RouteMeta, type RouteRecordRaw, type Router } from 'vue-router'
import type { WeFaRouteMeta } from '@/router'
import LayoutContainer from './LayoutContainer.vue'

interface StoryRouteMeta extends RouteMeta {
  wefa?: WeFaRouteMeta
}

interface RouteNavigationConfiguration {
  showInNavigation: boolean
  section?: string
  showBreadcrumb?: boolean
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

    routeMeta.wefa = {
      ...(routeMeta.wefa ?? {
        title: String(route.name),
      }),
      showInNavigation: routeConfiguration.showInNavigation,
    }

    if (routeConfiguration.section) {
      routeMeta.wefa.section = routeConfiguration.section
    } else {
      delete routeMeta.wefa.section
    }

    if (routeConfiguration.showBreadcrumb !== undefined) {
      routeMeta.wefa.showBreadcrumb = routeConfiguration.showBreadcrumb
    } else {
      delete routeMeta.wefa.showBreadcrumb
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

const navigationConfiguration = {
  home: { showInNavigation: true },
  products: { showInNavigation: true },
  users: { showInNavigation: true },
} satisfies RouterNavigationConfiguration

const wefaSectionedConfiguration = {
  home: { showInNavigation: true },
  Dashboard: { showInNavigation: true, section: 'Insights' },
  Analytics: { showInNavigation: true, section: 'Insights' },
  users: { showInNavigation: true, section: 'Administration' },
} satisfies RouterNavigationConfiguration

const mixedNestedConfiguration = {
  home: { showInNavigation: true },
  products: { showInNavigation: true, section: 'Catalog' },
  users: { showInNavigation: true, section: 'Accounts' },
} satisfies RouterNavigationConfiguration

const hiddenBreadcrumbConfiguration = {
  showcase: { showInNavigation: true, showBreadcrumb: false },
} satisfies RouterNavigationConfiguration

const customLogoDataUri =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 40'%3E%3Crect width='180' height='40' rx='6' fill='%230b1220'/%3E%3Ctext x='90' y='26' text-anchor='middle' fill='%23ffffff' font-family='Arial,sans-serif' font-size='16'%3EWeFa%3C/text%3E%3C/svg%3E"

const meta = {
  title: 'Router containers/LayoutContainer',
  component: LayoutContainer,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    projectTitle: 'WeFa Storybook',
    projectLogo: undefined,
    projectLogoAlt: undefined,
    breadcrumbHomeRoute: '/home',
    breadcrumbShowHome: true,
  },
  argTypes: {
    projectTitle: {
      control: 'text',
      description: 'Label shown in desktop and mobile navigation headers.',
    },
    projectLogo: {
      control: 'text',
      description: 'Optional logo URL rendered in the top navigation area.',
    },
    projectLogoAlt: {
      control: 'text',
      description: 'Optional alt text used for the custom logo.',
    },
    breadcrumbHomeRoute: {
      control: 'text',
      description:
        'Route path used by the automatically rendered breadcrumb home icon. Defaults to `/home`.',
    },
    breadcrumbShowHome: {
      control: 'boolean',
      description:
        'Shows or hides the breadcrumb home icon while keeping autorouted route segments visible.',
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
} satisfies Meta<typeof LayoutContainer>

export default meta
type Story = StoryObj<typeof meta>

export const WefaNavigationMeta: Story = {
  parameters: {
    initialPath: '/products',
    routerNavigationConfiguration: navigationConfiguration,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(findRouteMeta('home').wefa?.showInNavigation).toBe(true)
      expect(findRouteMeta('products').wefa?.showInNavigation).toBe(true)
      expect(findRouteMeta('users').wefa?.showInNavigation).toBe(true)
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
      expect(findRouteMeta('home').wefa?.showInNavigation).toBe(true)
      expect(findRouteMeta('products').wefa?.section).toBe('Catalog')
      expect(findRouteMeta('users').wefa?.section).toBe('Accounts')
    })

    await waitFor(() => {
      expect(canvas.getByText('Category')).toBeInTheDocument()
      expect(canvas.getByText('Product Item')).toBeInTheDocument()
    })
  },
}

export const CustomBreadcrumbHomeRoute: Story = {
  args: {
    breadcrumbHomeRoute: '/products',
  },
  parameters: {
    initialPath: '/products/category/electronics/item/laptop',
    routerNavigationConfiguration: mixedNestedConfiguration,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(canvas.getByText('Category')).toBeInTheDocument()
      expect(canvas.getByText('Product Item')).toBeInTheDocument()
      expect(canvasElement.querySelector('.pi-home')).not.toBeNull()
    })
  },
}

export const CustomLogo: Story = {
  args: {
    projectTitle: 'WeFa Storybook',
    projectLogo: customLogoDataUri,
    projectLogoAlt: 'WeFa logo',
  },
  parameters: {
    initialPath: '/home',
    routerNavigationConfiguration: navigationConfiguration,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const logos = canvasElement.querySelectorAll('[data-test="project-logo"]')
      expect(logos.length).toBeGreaterThan(0)
    })
  },
}

export const NameOnlyFallback: Story = {
  args: {
    projectTitle: 'North Side',
    projectLogo: undefined,
    projectLogoAlt: undefined,
  },
  parameters: {
    initialPath: '/home',
    routerNavigationConfiguration: navigationConfiguration,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(canvas.getByText('NS')).toBeInTheDocument()
    })
  },
}

export const HiddenBreadcrumb: Story = {
  args: {
    projectTitle: 'WeFa Storybook',
  },
  parameters: {
    initialPath: '/showcase',
    routerNavigationConfiguration: hiddenBreadcrumbConfiguration,
  },
}
