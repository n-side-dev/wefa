import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import AvatarComponent from './AvatarComponent.vue'

const meta: Meta<typeof AvatarComponent> = {
  title: 'Components/AvatarComponent',
  component: AvatarComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Avatar component built on PrimeVue Avatar. It supports initials fallback, deterministic background color generation, image mode, and shape overrides.',
      },
    },
  },
  args: {
    username: 'Ada Lovelace',
    shape: 'square',
  },
  argTypes: {
    username: {
      control: 'text',
      description: 'Username used to compute initials, aria-label and deterministic colors.',
    },
    label: {
      control: 'text',
      description: 'Optional label that overrides computed initials.',
    },
    shape: {
      control: 'select',
      options: ['square', 'circle'],
      description: 'Avatar shape.',
    },
    imageUrl: {
      control: 'text',
      description: 'Image URL. When set, the label/initials fallback is hidden.',
    },
    class: {
      control: 'text',
      description: 'Class override for avatar sizing/typography.',
    },
    style: {
      control: 'object',
      description: 'Inline style override for avatar container.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const InitialsFallback: Story = {
  args: {
    username: 'Ada Lovelace',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('AL')).toBeInTheDocument()
    await expect(canvas.getByLabelText('Ada Lovelace')).toBeInTheDocument()
  },
}

export const SingleWordName: Story = {
  args: {
    username: 'Plato',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('PL')).toBeInTheDocument()
  },
}

export const CustomLabel: Story = {
  args: {
    username: 'Ada Lovelace',
    label: 'AI',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('AI')).toBeInTheDocument()
  },
}

export const WithImage: Story = {
  args: {
    username: 'Marie Curie',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop',
  },
}

export const CircleShapeCustomSize: Story = {
  args: {
    username: 'Grace Hopper',
    shape: 'circle',
    class: 'size-14 text-base font-bold',
  },
}
