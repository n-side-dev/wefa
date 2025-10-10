/* eslint-disable @typescript-eslint/no-explicit-any */
// URL-Based API Client, based on TanStack useQuery and useMutation

import { type Ref } from 'vue'
import { useQuery, type UseQueryReturnType, type UseQueryOptions } from '@tanstack/vue-query'
import {
  useMutation,
  type UseMutationReturnType,
  type UseMutationOptions,
} from '@tanstack/vue-query'
import axiosInstance from '@/network/axios'
import type { AxiosError } from 'axios'

/**
 * Wraps a generic HTTP GET request (by URL) with TanStack useQuery.
 * The API is called automatically again when the URL changes.
 * The API is not called if the URL is ref(undefined).
 * @param url ref to a string or undefined, the endpoint to call
 * @param queryOptions TanStack useQuery options: https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery
 * @returns TanStack useQuery return: https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery
 *
 * Example usage:
 *   const { data, isLoading, error } = apiClient.query(ref('/api/get-data/'))
 */
function query(
  url: Ref<string | undefined>,
  queryOptions?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
): UseQueryReturnType<any, AxiosError> {
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      if (!url.value) {
        return undefined
      }
      const response = await axiosInstance.get(url.value)
      return response.data
    },
    enabled: () => {
      return !!url.value
    },
    ...queryOptions,
  })
}

/**
 * Wraps a generic HTTP POST request (by URL and body) with TanStack useMutation.
 * The API is not called if the URL is ref(undefined).
 * @param url ref to a string or undefined, the endpoint to call
 * @param mutationOptions TanStack useMutation options: https://tanstack.com/query/v5/docs/framework/vue/reference/useMutation
 * @returns TanStack useMutation return: https://tanstack.com/query/v5/docs/framework/vue/reference/useMutation
 *
 * Example usage:
 *   const mutation = apiClient.mutation(ref('/api/post-data/'))
 *   mutation.mutate({ foo: 'bar' })
 */
function mutation(
  url: Ref<string | undefined>,
  mutationOptions?: Omit<UseMutationOptions<unknown, AxiosError, any>, 'mutationFn'>
): UseMutationReturnType<unknown, AxiosError, any, unknown> {
  return useMutation<unknown, AxiosError, any, unknown>({
    mutationFn: async (body: any) => {
      if (!url.value) return undefined
      const response = await axiosInstance.post(url.value, body)
      return response.data as unknown
    },
    ...mutationOptions,
  })
}

export default {
  query,
  mutation,
}
