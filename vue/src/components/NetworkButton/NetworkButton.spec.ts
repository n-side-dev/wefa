import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import type { ApiInterface } from '@/network/apiClient.ts'
import type { AxiosError } from 'axios'
import NetworkButton from './NetworkButton.vue'

/**
 * Creates a mock ApiInterface for testing purposes
 * @param initialState - The initial state of the mock API
 * @param initialState.loading - Initial loading state
 * @param initialState.result - Initial result value
 * @param initialState.error - Initial error state
 * @param initialState.called - Initial called state
 * @returns A mock ApiInterface implementation for testing
 */
function createMockApiInterface(
  initialState: {
    loading?: boolean
    result?: unknown
    error?: AxiosError | undefined
    called?: boolean
  } = {}
): ApiInterface {
  const loading = ref(initialState.loading ?? false)
  const result = ref(initialState.result)
  const error = ref(initialState.error ?? undefined)
  const called = ref(initialState.called ?? false)

  const action = async () => {
    called.value = true
    loading.value = true

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10))

    loading.value = false

    if (initialState.error) {
      error.value = initialState.error
    } else {
      result.value = initialState.result ?? { success: true }
    }
  }

  const onSuccess = () => {
    // Mock implementation
  }

  const onError = () => {
    // Mock implementation
  }

  return {
    action,
    loading,
    result,
    error,
    called,
    onSuccess,
    onError,
  }
}

describe('NetworkButton', () => {
  let mockQuery: ApiInterface

  beforeEach(() => {
    mockQuery = createMockApiInterface()
  })

  describe('Component Rendering', () => {
    it('renders PrimeVue Button component', () => {
      const wrapper = mount(NetworkButton, {
        props: { query: mockQuery },
      })

      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true)
    })

    it('applies network-button class', () => {
      const wrapper = mount(NetworkButton, {
        props: { query: mockQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.classes()).toContain('network-button')
    })
  })

  describe('Default State', () => {
    it('shows default text when not called', () => {
      const wrapper = mount(NetworkButton, {
        props: { query: mockQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Submit')
    })

    it('shows custom default text when provided', () => {
      const wrapper = mount(NetworkButton, {
        props: {
          query: mockQuery,
          defaultButton: { text: 'Custom Submit' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Custom Submit')
    })

    it('shows default icon when provided', () => {
      const wrapper = mount(NetworkButton, {
        props: {
          query: mockQuery,
          defaultButton: { icon: 'pi pi-send' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('icon')).toBe('pi pi-send')
    })

    it('applies primary severity by default', () => {
      const wrapper = mount(NetworkButton, {
        props: { query: mockQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('severity')).toBe('primary')
    })

    it('is enabled by default', () => {
      const wrapper = mount(NetworkButton, {
        props: { query: mockQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('disabled')).toBeFalsy()
    })
  })

  describe('Loading State', () => {
    it('shows loading text when query is loading', () => {
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      const wrapper = mount(NetworkButton, {
        props: { query: loadingQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Loading...')
    })

    it('shows custom loading text when provided', () => {
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      const wrapper = mount(NetworkButton, {
        props: {
          query: loadingQuery,
          loadingButton: { text: 'Processing...' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Processing...')
    })

    it('applies info severity when loading', () => {
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      const wrapper = mount(NetworkButton, {
        props: { query: loadingQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('severity')).toBe('info')
    })

    it('is disabled when loading', () => {
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      const wrapper = mount(NetworkButton, {
        props: { query: loadingQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      // Check if the button has the disabled attribute or prop
      expect(button.props('disabled') === true || button.attributes('disabled') !== undefined).toBe(
        true
      )
    })

    it('shows loading spinner', () => {
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      const wrapper = mount(NetworkButton, {
        props: { query: loadingQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('loading')).toBe(true)
    })
  })

  describe('Success State', () => {
    it('shows success text when query has result', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: { query: successQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Success')
    })

    it('shows custom success text when provided', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: {
          query: successQuery,
          successButton: { text: 'Completed!' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Completed!')
    })

    it('shows success icon when provided', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: {
          query: successQuery,
          successButton: { icon: 'pi pi-check-circle' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('icon')).toBe('pi pi-check-circle')
    })

    it('applies success severity when successful', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: { query: successQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('severity')).toBe('success')
    })

    it('is disabled by default when successful', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: { query: successQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      // Check if the button has the disabled attribute or prop
      expect(button.props('disabled') === true || button.attributes('disabled') !== undefined).toBe(
        true
      )
    })

    it('is enabled when relaunchableOnSuccess is true', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: {
          query: successQuery,
          relaunchableOnSuccess: true,
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('disabled')).toBeFalsy()
    })
  })

  describe('Error State', () => {
    it('shows error text when query has error', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: { query: errorQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Error')
    })

    it('shows custom error text when provided', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: {
          query: errorQuery,
          errorButton: { text: 'Failed!' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Failed!')
    })

    it('shows "Retry" text when relaunchableOnError is true', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: {
          query: errorQuery,
          relaunchableOnError: true,
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('label')).toBe('Retry')
    })

    it('shows error icon when provided', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: {
          query: errorQuery,
          errorButton: { icon: 'pi pi-times-circle' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('icon')).toBe('pi pi-times-circle')
    })

    it('applies danger severity when error occurs', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: { query: errorQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('severity')).toBe('danger')
    })

    it('is disabled by default when error occurs', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: { query: errorQuery },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      // Check if the button has the disabled attribute or prop
      expect(button.props('disabled') === true || button.attributes('disabled') !== undefined).toBe(
        true
      )
    })

    it('is enabled when relaunchableOnError is true', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: {
          query: errorQuery,
          relaunchableOnError: true,
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.props('disabled')).toBeFalsy()
    })
  })

  describe('Click Handling', () => {
    it('calls query.action when clicked in default state', async () => {
      let actionCalled = false
      const mockQueryWithAction = {
        ...mockQuery,
        action: async () => {
          actionCalled = true
        },
      }

      const wrapper = mount(NetworkButton, {
        props: { query: mockQueryWithAction },
      })

      await wrapper.findComponent({ name: 'Button' }).trigger('click')
      expect(actionCalled).toBe(true)
    })

    it('calls query.action when clicked in success state with relaunchableOnSuccess', async () => {
      let actionCalled = false
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      successQuery.action = async () => {
        actionCalled = true
      }

      const wrapper = mount(NetworkButton, {
        props: {
          query: successQuery,
          relaunchableOnSuccess: true,
        },
      })

      await wrapper.findComponent({ name: 'Button' }).trigger('click')
      expect(actionCalled).toBe(true)
    })

    it('calls query.action when clicked in error state with relaunchableOnError', async () => {
      let actionCalled = false
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      errorQuery.action = async () => {
        actionCalled = true
      }

      const wrapper = mount(NetworkButton, {
        props: {
          query: errorQuery,
          relaunchableOnError: true,
        },
      })

      await wrapper.findComponent({ name: 'Button' }).trigger('click')
      expect(actionCalled).toBe(true)
    })

    it('does not call query.action when disabled', async () => {
      let actionCalled = false
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      loadingQuery.action = async () => {
        actionCalled = true
      }

      const wrapper = mount(NetworkButton, {
        props: { query: loadingQuery },
      })

      await wrapper.findComponent({ name: 'Button' }).trigger('click')
      expect(actionCalled).toBe(false)
    })
  })

  describe('Custom Styling', () => {
    it('applies custom classes from defaultButton', () => {
      const wrapper = mount(NetworkButton, {
        props: {
          query: mockQuery,
          defaultButton: { class: 'custom-class' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.classes()).toContain('custom-class')
    })

    it('applies custom classes from successButton', () => {
      const successQuery = createMockApiInterface({ result: { data: 'success' } })
      const wrapper = mount(NetworkButton, {
        props: {
          query: successQuery,
          successButton: { class: 'success-class' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.classes()).toContain('success-class')
    })

    it('applies custom classes from errorButton', () => {
      const errorQuery = createMockApiInterface({
        error: {
          message: 'Network error',
          name: 'AxiosError',
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError,
      })
      const wrapper = mount(NetworkButton, {
        props: {
          query: errorQuery,
          errorButton: { class: 'error-class' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.classes()).toContain('error-class')
    })

    it('applies custom classes from loadingButton', () => {
      const loadingQuery = createMockApiInterface({ loading: true, called: true })
      const wrapper = mount(NetworkButton, {
        props: {
          query: loadingQuery,
          loadingButton: { class: 'loading-class' },
        },
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.classes()).toContain('loading-class')
    })
  })

  describe('Props Validation', () => {
    it('handles missing optional props gracefully', () => {
      const wrapper = mount(NetworkButton, {
        props: { query: mockQuery },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('handles empty button configuration objects', () => {
      const wrapper = mount(NetworkButton, {
        props: {
          query: mockQuery,
          defaultButton: {},
          successButton: {},
          errorButton: {},
          loadingButton: {},
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })
})
