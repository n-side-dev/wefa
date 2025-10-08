/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { useRouter, type Router } from 'vue-router'
import { NavbarContainer, SideMenuContainer } from '..'
import RouterViewSFC from './RouterViewSFC.vue'

// Create a global variable to store the router instance
let routerInstance: Router | null = null

const meta = {
  title: 'Router containers/Overview',
  component: RouterViewSFC,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (story) => {
      return {
        components: { story },
        template: '<div class="flex w-230 h-150 bg-surface-100 p-2 m-0"><story /></div>',
        async beforeMount() {
          const router = useRouter()
          routerInstance = router
          await router.push({ path: '/containers/settings/passwordreset' })
        },
      }
    },
  ],
} satisfies Meta<typeof RouterViewSFC>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const SideMenu: Story = {
  args: {},
  play: async () => {
    const route = routerInstance?.getRoutes().find((r) => r.path === '/containers/settings')

    route.components.default = SideMenuContainer
    route.props.default = () => ({})

    const routeApiToken = routerInstance
      ?.getRoutes()
      .find((r) => r.path === '/containers/settings/apitoken')
    routeApiToken.components.default = NavbarContainer

    await routerInstance.push({ path: '/containers/settings/apitoken' })
  },
}

export const SideMenuWithDetails: Story = {
  args: {},
  play: async () => {
    const route = routerInstance?.getRoutes().find((r) => r.path === '/containers/settings')
    route.components.default = SideMenuContainer
    route.props.default = () => ({
      depth: 2,
      width: 50,
      start: {
        logo: '/WEFA_notext_logo.svg',
        appName: 'Storybook',
      },
      end: {
        showUser: true,
        showSettings: true,
        showLogout: true,
        settingsRoute: { path: '/' },
        logoutRoute: { path: '/' },
      },
    })

    const routeApiToken = routerInstance
      ?.getRoutes()
      .find((r) => r.path === '/containers/settings/apitoken')
    routeApiToken.components.default = NavbarContainer
  },
}

export const NavBar: Story = {
  args: {},
  play: async () => {
    const route = routerInstance?.getRoutes().find((r) => r.path === '/containers/settings')
    route.components.default = NavbarContainer
    route.props.default = () => ({})

    const routeApiToken = routerInstance
      ?.getRoutes()
      .find((r) => r.path === '/containers/settings/apitoken')
    routeApiToken.components.default = SideMenuContainer
  },
}

export const NavBarWithDetails: Story = {
  args: {},
  play: async () => {
    const route = routerInstance?.getRoutes().find((r) => r.path === '/containers/settings')
    route.components.default = NavbarContainer
    route.props.default = () => ({
      depth: 3,
      start: {
        logo: '/WEFA_notext_logo.svg',
        appName: 'Storybook',
      },
      end: {
        showUser: true,
        showSettings: true,
        showLogout: true,
        settingsRoute: { path: '/' },
        logoutRoute: { path: '/' },
      },
    })

    const routeApiToken = routerInstance
      ?.getRoutes()
      .find((r) => r.path === '/containers/settings/apitoken')
    routeApiToken.components.default = SideMenuContainer
  },
}
