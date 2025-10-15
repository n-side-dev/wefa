import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { within, waitFor, userEvent, expect } from 'storybook/test'
import { ref } from 'vue'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'

import ApiMutationButton from './ApiMutationButton.vue'

// Simple mock for a TanStack Mutation-like object used by the component
/**
 *
 * @param options
 * @param options.outcome
 * @param options.delayMs
 */
function createMockMutation(options?: { outcome?: 'success' | 'error'; delayMs?: number }): {
  mutation: UseMutationReturnType<unknown, AxiosError, unknown, unknown>
  mutationBody: typeof mutationBody
} {
  const isPending = ref(false)
  const data = ref<unknown | undefined>(undefined)
  const error = ref<AxiosError | undefined>(undefined)
  const outcome = options?.outcome ?? 'success'
  const delayMs = options?.delayMs ?? 500

  const mutationBody = ref<unknown>({ foo: 'bar' })

  /**
   *
   * @param body
   */
  function mutate(body: unknown) {
    mutationBody.value = body
    isPending.value = true
    data.value = undefined
    error.value = undefined
    setTimeout(() => {
      isPending.value = false
      if (outcome === 'success') {
        data.value = { ok: true }
      } else {
        error.value = new Error('boom') as AxiosError
      }
    }, delayMs)
  }

  const mutationMinimal = {
    isPending,
    data,
    error,
    mutate,
  } satisfies Record<string, unknown>

  const mutation = mutationMinimal as unknown as UseMutationReturnType<unknown, AxiosError, unknown, unknown>

  return { mutation, mutationBody }
}

const meta: Meta<typeof ApiMutationButton> = {
  title: 'Components/NetworkButton/ApiMutationButton',
  component: ApiMutationButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A network-aware button (mutation) that displays different states based on API call status. Built on PrimeVue Button.',
      },
    },
  },
  args: {
    relaunchableOnError: false,
    relaunchableOnSuccess: false,
  },
  argTypes: {
    relaunchableOnError: {
      control: 'boolean',
      description: 'Whether the button can be clicked again after an error occurs',
    },
    relaunchableOnSuccess: {
      control: 'boolean',
      description: 'Whether the button can be clicked again after a successful response',
    },
    defaultButton: { control: 'object' },
    successButton: { control: 'object' },
    errorButton: { control: 'object' },
    loadingButton: { control: 'object' },
    mutation: { control: false },
    mutationBody: { control: false },
  },
}

export default meta

type Story = StoryObj<typeof meta>

/**
 *
 * @param canvas
 */
function getButton(canvas: ReturnType<typeof within>) {
  return canvas.getByRole('button')
}

/**
 *
 * @param canvas
 * @param text
 */
async function waitForText(canvas: ReturnType<typeof within>, text: string) {
  await waitFor(() => expect(getButton(canvas)).toHaveTextContent(text))
}

export const Default: Story = {
  render: (args) => ({
    components: { ApiMutationButton },
    setup() {
      const { mutation, mutationBody } = createMockMutation({ outcome: 'success' })
      return { args, mutation, mutationBody }
    },
    template:
      '<ApiMutationButton v-bind="args" :mutation="mutation" :mutationBody="mutationBody" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitForText(canvas, 'Submit')
    await userEvent.click(getButton(canvas))
    await waitForText(canvas, 'Loading...')
    await waitForText(canvas, 'Success')
  },
}

export const WithCustomLabels: Story = {
  args: {
    defaultButton: { text: 'Save', icon: 'pi pi-save' },
    successButton: { text: 'Saved!', icon: 'pi pi-check' },
    errorButton: { text: 'Save Failed', icon: 'pi pi-times' },
    loadingButton: { text: 'Saving...' },
  },
  render: (args) => ({
    components: { ApiMutationButton },
    setup() {
      const { mutation, mutationBody } = createMockMutation({ outcome: 'success' })
      return { args, mutation, mutationBody }
    },
    template:
      '<ApiMutationButton v-bind="args" :mutation="mutation" :mutationBody="mutationBody" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitForText(canvas, 'Save')
    await userEvent.click(getButton(canvas))
    await waitForText(canvas, 'Saving...')
    await waitForText(canvas, 'Saved!')
  },
}

export const ErrorState: Story = {
  render: (args) => ({
    components: { ApiMutationButton },
    setup() {
      const { mutation, mutationBody } = createMockMutation({ outcome: 'error' })
      return { args, mutation, mutationBody }
    },
    template:
      '<ApiMutationButton v-bind="args" :mutation="mutation" :mutationBody="mutationBody" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(getButton(canvas))
    await waitForText(canvas, 'Loading...')
    await waitForText(canvas, 'Error')
  },
}

export const RelaunchableOnError: Story = {
  args: { relaunchableOnError: true },
  render: (args) => ({
    components: { ApiMutationButton },
    setup() {
      const { mutation, mutationBody } = createMockMutation({ outcome: 'error' })
      return { args, mutation, mutationBody }
    },
    template:
      '<ApiMutationButton v-bind="args" :mutation="mutation" :mutationBody="mutationBody" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(getButton(canvas))
    await waitForText(canvas, 'Loading...')
    await waitForText(canvas, 'Retry')
  },
}

export const RelaunchableOnSuccess: Story = {
  args: {
    relaunchableOnSuccess: true,
    successButton: { text: 'Success - Click Again', icon: 'pi pi-refresh' },
  },
  render: (args) => ({
    components: { ApiMutationButton },
    setup() {
      const { mutation, mutationBody } = createMockMutation({ outcome: 'success' })
      return { args, mutation, mutationBody }
    },
    template:
      '<ApiMutationButton v-bind="args" :mutation="mutation" :mutationBody="mutationBody" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(getButton(canvas))
    await waitForText(canvas, 'Loading...')
    await waitForText(canvas, 'Success - Click Again')
  },
}
