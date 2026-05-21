import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import { useBackendStore, type AuthenticationType } from '@/stores'
import Can from './Can.vue'

const seed = (perms: readonly string[]) => {
  const store = useBackendStore({ authenticationType: 'TOKEN' as AuthenticationType })
  store.setPermissions(perms)
}

const meta: Meta<typeof Can> = {
  title: 'Components/Can',
  component: Can,
  args: {
    permission: 'demo.read',
    mode: 'all',
  },
  argTypes: {
    permission: {
      control: 'text',
      description: 'Permission string (or array) required to render the default slot.',
    },
    mode: {
      control: 'select',
      options: ['all', 'any'],
      description: "When `permission` is an array, choose 'all' or 'any' matching.",
    },
  },
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof Can>

export const Allowed: Story = {
  args: { permission: 'demo.read' },
  render: (args) => ({
    components: { Can },
    setup() {
      seed(['demo.read'])
      return { args }
    },
    template: `
      <Can v-bind="args">
        <span data-testid="content">Sensitive content visible because permission is granted.</span>
      </Can>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('content')).toBeInTheDocument()
  },
}

export const Denied: Story = {
  args: { permission: 'demo.admin' },
  render: (args) => ({
    components: { Can },
    setup() {
      seed(['demo.read'])
      return { args }
    },
    template: `
      <Can v-bind="args">
        <span data-testid="content">You should not see this.</span>
        <template #fallback>
          <span data-testid="fallback">Access denied — admin permission required.</span>
        </template>
      </Can>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByTestId('content')).not.toBeInTheDocument()
    await expect(canvas.getByTestId('fallback')).toBeInTheDocument()
  },
}

export const AnyMode: Story = {
  args: { permission: ['demo.editor', 'demo.admin'], mode: 'any' },
  render: (args) => ({
    components: { Can },
    setup() {
      seed(['demo.editor'])
      return { args }
    },
    template: `
      <Can v-bind="args">
        <span data-testid="content">Allowed because at least one permission is held.</span>
      </Can>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('content')).toBeInTheDocument()
  },
}

export const ScopedSlot: Story = {
  args: { permission: 'demo.admin' },
  render: (args) => ({
    components: { Can },
    setup() {
      seed(['demo.read'])
      return { args }
    },
    template: `
      <Can v-bind="args">
        <template #default="{ allowed }">
          <span data-testid="probe">allowed = {{ allowed }}</span>
        </template>
        <template #fallback="{ allowed }">
          <span data-testid="probe">allowed = {{ allowed }}</span>
        </template>
      </Can>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('probe').textContent).toContain('allowed = false')
  },
}
