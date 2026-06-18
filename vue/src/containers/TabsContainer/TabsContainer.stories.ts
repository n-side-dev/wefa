import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { useRouter, type Router } from 'vue-router'

import { TabsContainer } from './index'
import RouterViewSFC from '../storybook/RouterViewSFC.vue'

let routerInstance: Router | null = null

const meta = {
  title: 'Router containers/TabsContainer',
  component: RouterViewSFC,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div class="flex h-120 w-230 bg-surface-100 p-2"><story /></div>',
      async beforeMount() {
        const router = useRouter()
        routerInstance = router
        await router.push({ path: '/containers/settings/passwordreset' })
      },
    }),
  ],
} satisfies Meta<typeof RouterViewSFC>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  play: async () => {
    const route = routerInstance
      ?.getRoutes()
      .find((routeRecord) => routeRecord.path === '/containers/settings')

    if (!route?.components) {
      return
    }

    route.components.default = TabsContainer
    route.props.default = () => ({})

    await routerInstance?.push({ path: '/containers/settings/passwordreset' })
  },
}
