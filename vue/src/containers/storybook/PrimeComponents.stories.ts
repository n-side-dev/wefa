import { type Meta, type StoryObj } from '@storybook/vue3-vite'

import PrimeComponentsShowcase from './PrimeComponentsShowcase.vue'

const meta = {
  title: 'PrimeComponents',
  component: PrimeComponentsShowcase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PrimeComponentsShowcase>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
