/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { ref, type Ref } from 'vue'

// Mocks for TanStack Vue Query
const useQueryMock = vi.fn()
const useMutationMock = vi.fn()

vi.mock('@tanstack/vue-query', () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
  useMutation: (...args: any[]) => useMutationMock(...args),
}))

import apiClient from '@/network/apiClient'
import axiosInstance from '@/network/axios'

describe('network/apiClient', () => {
  let axiosMock: AxiosMockAdapter

  beforeEach(() => {
    useQueryMock.mockReset()
    useMutationMock.mockReset()
    axiosMock = new AxiosMockAdapter(axiosInstance)
  })

  afterEach(() => {
    axiosMock.reset()
    axiosMock.restore()
  })

  describe('query()', () => {
    it('configures TanStack useQuery with url Ref and guards undefined url; calls axios.get and unwraps data', async () => {
      const url: Ref<string | undefined> = ref(undefined)

      // Capture the options passed to useQuery
      let capturedOptions: any
      useQueryMock.mockImplementation((opts: any) => {
        capturedOptions = opts
        // Return a minimal shape; the wrapper just returns useQuery's return value, but our test
        // focuses on the configuration, not the reactive behavior
        return { data: undefined }
      })

      const queryOptions = { staleTime: 123, retry: 0 }
      const ret = apiClient.query(url, queryOptions as any)
      expect(ret).toBeDefined()
      expect(useQueryMock).toHaveBeenCalledTimes(1)
      expect(capturedOptions).toBeDefined()

      // queryKey must include the url ref
      expect(capturedOptions.queryKey).toEqual([url])

      // enabled should be false when url is undefined
      expect(capturedOptions.enabled()).toBe(false)

      // queryFn should early-return undefined when url is undefined
      await expect(capturedOptions.queryFn()).resolves.toBeUndefined()

      // Should spread/forward queryOptions
      expect(capturedOptions.staleTime).toBe(123)
      expect(capturedOptions.retry).toBe(0)

      // Now provide a URL and ensure axios.get is called and data unwrapped
      url.value = '/hello'
      const payload = { hello: 'world' }
      axiosMock.onGet('/hello').reply(200, payload)

      // enabled should now be true
      expect(capturedOptions.enabled()).toBe(true)

      const data = await capturedOptions.queryFn()
      expect(data).toEqual(payload)
      expect(axiosMock.history.get.length).toBe(1)
      expect(axiosMock.history.get[0]!.url).toBe('/hello')
    })
  })

  describe('mutation()', () => {
    it('configures TanStack useMutation; calls axios.post and unwraps data; guards undefined url', async () => {
      const url: Ref<string | undefined> = ref(undefined)

      // Capture the options passed to useMutation
      let capturedOptions: any
      useMutationMock.mockImplementation((opts: any) => {
        capturedOptions = opts
        return { mutate: vi.fn() }
      })

      const mutationOptions = { meta: { foo: 'bar' } }
      const ret = apiClient.mutation(url, mutationOptions as any)
      expect(ret).toBeDefined()
      expect(useMutationMock).toHaveBeenCalledTimes(1)
      expect(capturedOptions).toBeDefined()

      // Forwarded options
      expect(capturedOptions.meta).toEqual({ foo: 'bar' })

      // When url is undefined, mutationFn should early-return undefined and not call axios
      const resultUndefined = await capturedOptions.mutationFn({ some: 'body' })
      expect(resultUndefined).toBeUndefined()
      expect(axiosMock.history.post.length).toBe(0)

      // Now with a URL set, should call axios.post and unwrap data
      url.value = '/submit'
      const body = { a: 1 }
      const responseData = { ok: true }
      axiosMock.onPost('/submit', body).reply(200, responseData)

      const data = await capturedOptions.mutationFn(body)
      expect(data).toEqual(responseData)
      expect(axiosMock.history.post.length).toBe(1)
      expect(axiosMock.history.post[0]!.url).toBe('/submit')
      expect(JSON.parse(axiosMock.history.post[0]!.data as string)).toEqual(body)
    })
  })
})
