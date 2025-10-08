import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosInstance,
  type CreateAxiosDefaults,
} from 'axios'
import { ref, watch, type Ref } from 'vue'

export interface ApiInterface<T = unknown> {
  action: () => Promise<void>
  loading: Ref<boolean>
  result: Ref<T | undefined>
  error: Ref<AxiosError | undefined>
  called: Ref<boolean>
  onSuccess: (fn: (result: T | undefined) => void) => void
  onError: (fn: (error: AxiosError) => void) => void
}

/**
 * Vue Composable to manage API call state including loading, result, error, and called status.
 * @returns An object containing refs for loading, result, error, called, and a function to reset these states.
 */
function useApi<T = unknown>() {
  const loading: Ref<boolean> = ref(false)
  const result: Ref<T | undefined> = ref(undefined)
  const error: Ref<AxiosError | undefined> = ref(undefined)
  const called: Ref<boolean> = ref(false)

  /**
   * Resets the state of the API call.
   * If maintainState is true, maintains the current result and error values.
   * @param maintainState - Whether to maintain the current result and error values
   */
  function resetState(maintainState?: boolean) {
    loading.value = true
    if (!maintainState) {
      result.value = undefined
      error.value = undefined
    }
  }

  return { loading, result, error, called, resetState }
}

/**
 * Vue Composable for handling success and error callbacks.
 *
 * The `useCallbacks` function provides a way to manage and set success and error callbacks.
 * It returns functions to register these callbacks and reactive references to the current callbacks.
 * @returns An object containing:
 * - onSuccess: Function to register a success callback.
 * - onSuccessCallable: Reactive reference to the current success callback function.
 * - onError: Function to register an error callback.
 * - onErrorCallable: Reactive reference to the current error callback function.
 */
function useCallbacks<T = unknown>() {
  const onSuccessCallable: Ref<(result: T | undefined) => void> = ref(() => {})
  /**
   * Sets a callback function to be called when the API call is successful.
   * @param fn - The callback function to be executed on success
   */
  function onSuccess(fn: (result: T | undefined) => void) {
    onSuccessCallable.value = fn
  }
  const onErrorCallable: Ref<(error: AxiosError) => void> = ref(() => {})
  /**
   * Sets a callback function to be called when the API call encounters an error.
   * @param fn - The callback function to be executed on error
   */
  function onError(fn: (error: AxiosError) => void) {
    onErrorCallable.value = fn
  }

  return { onSuccess, onSuccessCallable, onError, onErrorCallable }
}

// Method signatures have been refactored to use generics for better type safety

export default class ApiClient {
  baseUrl: string
  axiosInstance: AxiosInstance

  constructor(baseUrl: string, config: CreateAxiosDefaults = {}) {
    this.baseUrl = baseUrl

    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      ...config,
    })
  }

  /**
   * Sends a GET request to the specified URL using the provided configuration.
   *
   * If lazy is true, the request is not sent automatically and must be triggered manually using action().
   * If maintainState is true, the request will keep the current result/error when triggering again.
   * @param url - The URL to send the GET request to
   * @param config - Optional Axios request configuration
   * @param lazy - If true, the request is not sent automatically
   * @param maintainState - If true, maintains the current result/error when triggering again
   * @returns An object containing the following properties:
   *   - action: Function to manually trigger the GET request.
   *   - loading: Ref<boolean> indicating if the request is in progress.
   *   - result: Ref<T> containing the response data.
   *   - error: Ref<AxiosError | undefined> containing the error, if any occurred.
   *   - called: Ref<boolean> indicating if the request has been called.
   *   - onSuccess: Function to set a callback fired on successful response.
   *   - onError: Function to set a callback fired on error response.
   */
  get<T = unknown>(
    url: Ref<string>,
    config?: AxiosRequestConfig<unknown>,
    lazy?: boolean,
    maintainState: boolean = false
  ): ApiInterface<T> {
    const api = this.submit<T, never>(url, this.axiosInstance.get, undefined, config, maintainState)

    // Handle automatic request triggering if not lazy
    if (!lazy) {
      watch(url, () => {
        api.action()
      })
      api.action()
    }

    return api
  }

  /**
   * Makes an API DELETE request and manages the state of the request.
   *
   * If maintainState is true, the request will keep the current result/error when triggering again.
   * @param url - The URL to send the DELETE request to
   * @param config - Optional Axios request configuration
   * @param maintainState - If true, maintains the current result/error when triggering again
   * @returns An object containing the `action` method to initiate the request,
   * and properties `loading`, `result`, `error`, `called`, `onSuccess`, and `onError`
   * to manage the state and callbacks.
   */
  delete<T = unknown>(
    url: Ref<string>,
    config?: AxiosRequestConfig<unknown>,
    maintainState: boolean = false
  ): ApiInterface<T> {
    return this.submit<T, never>(url, this.axiosInstance.delete, undefined, config, maintainState)
  }

  /**
   * Makes a POST request to a given URL with optional data and configuration.
   *
   * If maintainState is true, the request will keep the current result/error when triggering again.
   * @param url - The URL to send the POST request to
   * @param data - The data to send in the request body
   * @param config - Optional Axios request configuration
   * @param maintainState - If true, maintains the current result/error when triggering again
   * @returns An object containing the action function, loading state, result, error, called flag,
   * onSuccess callback, and onError callback.
   */
  post<T = unknown, D = unknown>(
    url: Ref<string>,
    data?: Ref<D | undefined>,
    config?: AxiosRequestConfig<unknown>,
    maintainState: boolean = false
  ): ApiInterface<T> {
    return this.submit<T, D>(url, this.axiosInstance.post, data, config, maintainState)
  }

  /**
   * Sends an HTTP PATCH request to the specified URL with the given data and configuration.
   *
   * If maintainState is true, the request will keep the current result/error when triggering again.
   * @param url - The URL to send the PATCH request to
   * @param data - The data to send in the request body
   * @param config - Optional Axios request configuration
   * @param maintainState - If true, maintains the current result/error when triggering again
   * @returns An object containing methods and properties to handle the request state:
   * - action: Function to initiate the PATCH request.
   * - loading: Ref<boolean> indicating if the request is in progress.
   * - result: Ref<T> containing the response data.
   * - error: Ref<AxiosError | undefined> containing the error, if any occurred.
   * - called: Ref<boolean> indicating if the request has been made.
   * - onSuccess: Function to be called when the request is successful.
   * - onError: Function to be called when the request encounters an error.
   */
  patch<T = unknown, D = unknown>(
    url: Ref<string>,
    data?: Ref<D | undefined>,
    config?: AxiosRequestConfig<unknown>,
    maintainState: boolean = false
  ): ApiInterface<T> {
    return this.submit<T, D>(url, this.axiosInstance.patch, data, config, maintainState)
  }

  /**
   * Makes a PUT request to the specified URL with the given data and configuration.
   *
   * If maintainState is true, the request will keep the current result/error when triggering again.
   * @param url - The URL to send the PUT request to
   * @param data - The data to send in the request body
   * @param config - Optional Axios request configuration
   * @param maintainState - If true, maintains the current result/error when triggering again
   * @returns An object containing properties and methods related to the PUT request:
   * - action: Function to submit the PUT request
   * - loading: Ref<boolean> indicating the loading state
   * - result: Ref<T> containing the response data
   * - error: Ref<AxiosError | undefined> containing the error, if any occurred
   * - called: Ref<boolean> indicating if the PUT request has been called
   * - onSuccess: Function to handle a successful PUT request
   * - onError: Function to handle an error in the PUT request
   */
  put<T = unknown, D = unknown>(
    url: Ref<string>,
    data?: Ref<D | undefined>,
    config?: AxiosRequestConfig<unknown>,
    maintainState: boolean = false
  ): ApiInterface<T> {
    return this.submit<T, D>(url, this.axiosInstance.put, data, config, maintainState)
  }

  /**
   * Core function that handles all types of HTTP requests.
   * This method centralizes the request handling logic for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
   * to ensure consistent behavior and reduce code duplication.
   *
   * If maintainState is true, the request will keep the current result/error when triggering again.
   * @param url - The URL to send the request to
   * @param axiosMethod - The Axios method function to use for the request
   * @param data - The data to send in the request body
   * @param config - Optional Axios request configuration
   * @param maintainState - If true, maintains the current result/error when triggering again
   * @returns An object containing the function to submit the request and various states related to the request.
   */
  submit<T = unknown, D = unknown>(
    url: Ref<string>,
    axiosMethod: (url: string, data?: D, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>,
    data?: Ref<D | undefined>,
    config?: AxiosRequestConfig<unknown>,
    maintainState: boolean = false
  ): ApiInterface<T> {
    // The callCounter is used to handle race conditions when multiple requests are made in quick succession.
    // It ensures that only the response from the most recent request is processed.
    let callCounter = 0

    const { loading, result, error, called, resetState } = useApi<T>()
    const { onSuccess, onSuccessCallable, onError, onErrorCallable } = useCallbacks<T>()

    /**
     * Executes the HTTP request and handles the response.
     * @returns A promise that resolves when the request is complete.
     */
    async function action(): Promise<void> {
      called.value = true

      callCounter += 1
      const currentCallCounter = callCounter

      resetState(maintainState)

      return axiosMethod(url.value, data?.value, config)
        .then((response) => {
          if (callCounter === currentCallCounter) {
            result.value = response.data
            onSuccessCallable.value(result.value)
          }
        })
        .catch((err) => {
          if (callCounter === currentCallCounter) {
            error.value = err
            onErrorCallable.value(err)
          }
        })
        .finally(() => {
          if (callCounter === currentCallCounter) {
            loading.value = false
          }
        })
    }

    return { action, loading, result, error, called, onSuccess, onError }
  }
}
