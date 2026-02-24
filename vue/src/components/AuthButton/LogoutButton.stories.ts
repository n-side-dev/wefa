import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { configureBackendStore } from '@/stores'
import { createPinia, setActivePinia } from 'pinia'
import LogoutButton from './LogoutButton.vue'

const meta: Meta<typeof LogoutButton> = {
  title: 'Components/AuthButton/LogoutButton',
  component: LogoutButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Logout button that adapts to the configured authentication mode.',
      },
    },
  },
  args: {
    label: 'Sign out',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { LogoutButton },
    setup() {
      setActivePinia(createPinia())
      configureBackendStore({ authenticationType: 'BFF', bff: { flow: { logoutRedirect: false } } })
      return { args }
    },
    template: '<LogoutButton v-bind="args" />',
  }),
}
