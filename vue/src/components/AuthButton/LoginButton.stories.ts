import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { configureBackendStore } from '@/stores'
import { createPinia, setActivePinia } from 'pinia'
import LoginButton from './LoginButton.vue'

const meta: Meta<typeof LoginButton> = {
  title: 'Components/AuthButton/LoginButton',
  component: LoginButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Login button that adapts to the configured authentication mode.',
      },
    },
  },
  args: {
    label: 'Sign in',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { LoginButton },
    setup() {
      setActivePinia(createPinia())
      configureBackendStore({ authenticationType: 'BFF', bff: { flow: { loginRedirect: false } } })
      return { args }
    },
    template: '<LoginButton v-bind="args" />',
  }),
}
