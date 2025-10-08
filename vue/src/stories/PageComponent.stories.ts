import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { expect, userEvent, within } from 'storybook/test'

import MyPageComponent from './PageComponent.vue'

const meta = {
  title: 'Example/Page',
  component: MyPageComponent,
  render: () => ({
    components: { MyPage: MyPageComponent },
    template: '<my-page />',
  }),
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated docsPage entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
} satisfies Meta<typeof MyPageComponent>

export default meta
type Story = StoryObj<typeof meta>

// More on component testing: https://storybook.js.org/docs/writing-tests/interaction-testing
export const LoggedIn: Story = {
  // eslint-disable-next-line
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    const loginButton = canvas.getByRole('button', { name: /Log in/i })
    await expect(loginButton).toBeInTheDocument()
    await userEvent.click(loginButton)
    await expect(loginButton).not.toBeInTheDocument()

    const logoutButton = canvas.getByRole('button', { name: /Log out/i })
    await expect(logoutButton).toBeInTheDocument()
  },
}

export const LoggedOut: Story = {}
