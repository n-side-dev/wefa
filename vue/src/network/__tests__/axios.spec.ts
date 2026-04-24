import { describe, it, expect } from 'vitest'
import axiosInstance, { BACKEND_BASE_URL } from '../axios'

describe('network/axios', () => {
  it('exports a singleton AxiosInstance with the expected HTTP methods', () => {
    expect(axiosInstance).toBeDefined()
    expect(typeof axiosInstance.get).toBe('function')
    expect(typeof axiosInstance.post).toBe('function')
    expect(typeof axiosInstance.put).toBe('function')
    expect(typeof axiosInstance.patch).toBe('function')
    expect(typeof axiosInstance.delete).toBe('function')
    expect(typeof axiosInstance.request).toBe('function')
    expect(axiosInstance.defaults).toBeTruthy()
  })

  it('baseURL matches BACKEND_BASE_URL (or empty when unset)', () => {
    // We use `?? ''` to normalize undefined → '' so the assertion holds in
    // both the vite-configured and unset cases without a conditional.
    const expected = BACKEND_BASE_URL || ''
    expect(axiosInstance.defaults.baseURL ?? '').toBe(expected)
  })

  it('re-exposes the same singleton through the network barrel export', async () => {
    const barrel = await import('@/network')
    expect(barrel.axiosInstance).toBe(axiosInstance)
  })
})
