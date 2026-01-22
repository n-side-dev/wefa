/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'

// Mocks for TanStack Vue Query
const useQueryMock = vi.fn()
const useMutationMock = vi.fn()

vi.mock('@tanstack/vue-query', () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
  useMutation: (...args: any[]) => useMutationMock(...args),
}))

import typedApiClient, {
  query as typedQuery,
  mutation as typedMutation,
} from '@/network/typedApiClient'
import axiosInstance from '@/network/axios'

describe('network/typedApiClient', () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    useMutationMock.mockReset()
  })

  it('setupOpenApiClient should attach axiosInstance to provided client', () => {
    const setConfig = vi.fn()
    const client = { setConfig }
    typedApiClient.setupOpenApiClient(client)
    expect(setConfig).toHaveBeenCalledTimes(1)
    expect(setConfig).toHaveBeenCalledExactlyOnceWith({ axios: axiosInstance })
  })

  it('setupOpenApiClient should attach custom axios instance when provided', () => {
    const setConfig = vi.fn()
    const client = { setConfig }
    const customAxios = { custom: true } as any
    typedApiClient.setupOpenApiClient(client, customAxios)
    expect(setConfig).toHaveBeenCalledTimes(1)
    expect(setConfig).toHaveBeenCalledExactlyOnceWith({ axios: customAxios })
  })

  describe('query()', () => {
    it('configures useQuery with callable name and options ref; enabled guard; unwraps data', async () => {
      // Define a named callable to check queryKey uses callable.name
      /**
       *
       * @param options
       */
      async function getFoo(options: any): Promise<{ data: any }> {
        return { data: { echoed: options } }
      }

      const optionsRef: Ref<any | undefined> = ref(undefined)

      let capturedOptions: any
      useQueryMock.mockImplementation((opts: any) => {
        capturedOptions = opts
        return { data: undefined }
      })

      const uq = typedQuery(getFoo, optionsRef as any, { retry: 0 } as any)
      expect(uq).toBeDefined()
      expect(useQueryMock).toHaveBeenCalledTimes(1)

      // queryKey includes callable.name and the options ref
      expect(capturedOptions.queryKey).toEqual([getFoo.name, optionsRef])

      // enabled should be false when options undefined
      expect(capturedOptions.enabled()).toBe(false)
      await expect(capturedOptions.queryFn()).resolves.toBeUndefined()

      // Should forward query options
      expect(capturedOptions.retry).toBe(0)

      // With options provided, queryFn should call callable and unwrap data
      const opts = { id: 123 }
      optionsRef.value = opts
      const data = await capturedOptions.queryFn()
      expect(data).toEqual({ echoed: opts })
    })

    it('queryFn should throw when callable returns an AxiosError-like object', async () => {
      /**
       *
       * @param _
       */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function getError(_: any) {
        return { isAxiosError: true, message: 'boom' }
      }

      const optionsRef: Ref<any | undefined> = ref({})

      let capturedOptions: any
      useQueryMock.mockImplementation((opts: any) => {
        capturedOptions = opts
        return { data: undefined }
      })

      typedQuery(getError as any, optionsRef as any)
      await expect(capturedOptions.queryFn()).rejects.toBeDefined()
    })
  })

  describe('mutation()', () => {
    it('configures useMutation and unwraps data; throws on isAxiosError', async () => {
      /**
       *
       * @param options
       */
      async function postFoo(options: any): Promise<{ data: any }> {
        return { data: { ok: true, options } }
      }

      let capturedOptions: any
      useMutationMock.mockImplementation((opts: any) => {
        capturedOptions = opts
        return { mutate: vi.fn() }
      })

      const um = typedMutation(postFoo as any, { meta: { a: 1 } } as any)
      expect(um).toBeDefined()
      expect(useMutationMock).toHaveBeenCalledTimes(1)
      expect(capturedOptions.meta).toEqual({ a: 1 })

      const result = await capturedOptions.mutationFn({ k: 9 })
      expect(result).toEqual({ ok: true, options: { k: 9 } })

      // Error case
      /**
       *
       * @param _
       */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function postErr(_: any) {
        return { isAxiosError: true, message: 'nope' }
      }
      typedMutation(postErr as any)
      // mutationFn is captured from the last call above
      await expect(capturedOptions.mutationFn({})).rejects.toBeDefined()
    })
  })
})
