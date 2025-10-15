import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { within, waitFor, userEvent, expect } from 'storybook/test'
import { ref } from 'vue'
import type { UseQueryReturnType } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'

import ApiQueryButton from './ApiQueryButton.vue'

// Simple mock for a TanStack Query-like object used by the component
/**
 *
 * @param options
 * @param options.outcome
 * @param options.delayMs
 */
function createMockQuery(options?: {
  outcome?: 'success' | 'error'
  delayMs?: number
}): UseQueryReturnType<unknown, AxiosError> {
  const isLoading = ref(false)
  const data = ref<unknown | undefined>(undefined)
  const error = ref<AxiosError | undefined>(undefined)
  const outcome = options?.outcome ?? 'success'
  const delayMs = options?.delayMs ?? 500

  /**
   *
   */
  function refetch() {
    isLoading.value = true
    data.value = undefined
    error.value = undefined
    setTimeout(() => {
      isLoading.value = false
      if (outcome === 'success') {
        data.value = { ok: true }
      } else {
        error.value = new Error('boom') as AxiosError
      }
    }, delayMs)
  }

  // Provide minimal shape and cast via unknown to the full Vue Query type
  const minimal = {
    isLoading,
    data,
    error,
    refetch,
  } satisfies Record<string, unknown>

  return minimal as unknown as UseQueryReturnType<unknown, AxiosError>
}

const meta: Meta<typeof ApiQueryButton> = {
  title: 'Components/NetworkButton/ApiQueryButton',
  component: ApiQueryButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A network-aware button (query) that displays different states based on API call status. Built on PrimeVue Button.',
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
    query: { control: false },
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
    components: { ApiQueryButton },
    setup() {
      const query = createMockQuery({ outcome: 'success' })
      return { args, query }
    },
    template: '<ApiQueryButton v-bind="args" :query="query" />',
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
    components: { ApiQueryButton },
    setup() {
      const query = createMockQuery({ outcome: 'success' })
      return { args, query }
    },
    template: '<ApiQueryButton v-bind="args" :query="query" />',
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
    components: { ApiQueryButton },
    setup() {
      const query = createMockQuery({ outcome: 'error' })
      return { args, query }
    },
    template: '<ApiQueryButton v-bind="args" :query="query" />',
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
    components: { ApiQueryButton },
    setup() {
      const query = createMockQuery({ outcome: 'error' })
      return { args, query }
    },
    template: '<ApiQueryButton v-bind="args" :query="query" />',
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
    components: { ApiQueryButton },
    setup() {
      const query = createMockQuery({ outcome: 'success' })
      return { args, query }
    },
    template: '<ApiQueryButton v-bind="args" :query="query" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(getButton(canvas))
    await waitForText(canvas, 'Loading...')
    await waitForText(canvas, 'Success - Click Again')
  },
}
