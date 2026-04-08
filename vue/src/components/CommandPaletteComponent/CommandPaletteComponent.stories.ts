import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CommandPaletteComponent from './CommandPaletteComponent.vue'

const meta = {
  title: 'Components/CommandPaletteComponent',
  component: CommandPaletteComponent,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CommandPaletteComponent>

export default meta

type Story = StoryObj<typeof meta>

export const NavigateOnly: Story = {}

export const NavigateWithAskMode: Story = {
  args: {
    assistant: {
      enabled: true,
      generateRecipe: async () => {
        return {
          status: 'recipe',
          conversationToken: 'story-token',
          summary: 'Open catalog and then edit product #42.',
          steps: [
            {
              id: 'step-1',
              title: 'Open catalog',
              target: {
                docId: 'catalog.list',
              },
            },
            {
              id: 'step-2',
              title: 'Edit product',
              target: {
                docId: 'catalog.edit',
                params: {
                  id: '42',
                },
              },
            },
          ],
        }
      },
    },
  },
}
