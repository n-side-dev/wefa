import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, userEvent } from 'storybook/test'
import NotFound from './NotFound.vue'

const meta: Meta<typeof NotFound> = {
  title: 'Components/NotFound',
  component: NotFound,
  args: {
    code: '404',
    title: 'Page Not Found',
    msg: 'Sorry, the page you are looking for does not exist.',
    buttonLabel: 'Go Home',
    buttonIcon: 'pi pi-home',
    buttonRoute: '/',
    goBackLabel: 'Go Back',
  },
  argTypes: {
    code: { control: 'text', description: 'Error code to display' },
    title: { control: 'text', description: 'Title for the not found page' },
    msg: { control: 'text', description: 'Message to display for not found' },
    buttonLabel: { control: 'text', description: 'Label for the home button' },
    buttonIcon: { control: 'text', description: 'PrimeIcon for the home button' },
    buttonRoute: {
      control: 'text',
      description: 'Route to navigate to when home button is clicked',
    },
    goBackLabel: { control: 'text', description: 'Label for the go back button' },
  },
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof NotFound>

export const Default: Story = {
  render: (args) => ({
    components: { NotFound },
    setup() {
      return { args }
    },
    template: '<NotFound v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('404')).toBeInTheDocument()
    await expect(canvas.getByText('Page Not Found')).toBeInTheDocument()
    await expect(canvas.getByText('Go Home')).toBeInTheDocument()
    await expect(canvas.getByText('Go Back')).toBeInTheDocument()
  },
}

export const CustomMessage: Story = {
  args: {
    msg: 'Custom not found message for this story.',
  },
  render: (args) => ({
    components: { NotFound },
    setup() {
      return { args }
    },
    template: '<NotFound v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Custom not found message for this story.')).toBeInTheDocument()
  },
}

export const WithSlot: Story = {
  render: (args) => ({
    components: { NotFound },
    setup() {
      return { args }
    },
    template: `
      <NotFound v-bind="args">
        <template #default>
          <div class="text-blue-500 font-semibold">Custom slot content</div>
        </template>
      </NotFound>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Custom slot content')).toBeInTheDocument()
  },
}

export const CustomHomeButton: Story = {
  args: {
    buttonLabel: 'Return to Dashboard',
    buttonIcon: 'pi pi-arrow-left',
    buttonRoute: '/dashboard',
  },
  render: (args) => ({
    components: { NotFound },
    setup() {
      return { args }
    },
    template: '<NotFound v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Return to Dashboard')).toBeInTheDocument()
  },
}

export const CustomGoBackButton: Story = {
  args: {
    goBackLabel: 'Previous Page',
  },
  render: (args) => ({
    components: { NotFound },
    setup() {
      return { args }
    },
    template: '<NotFound v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Previous Page')).toBeInTheDocument()
  },
}

export const Navigation: Story = {
  render: (args) => ({
    components: { NotFound },
    setup() {
      return { args }
    },
    template: '<NotFound v-bind="args" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByText('Go Home')
    await userEvent.click(button)
    // You may want to mock $router and assert navigation in a real test environment
  },
}
