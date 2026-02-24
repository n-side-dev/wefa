import { describe, it, expect, vi } from 'vitest'
import { createApp, ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { bffAuthPlugin } from '../index'

describe('bffAuthPlugin', () => {
  it('runs session check on install when enabled', async () => {
    const app = createApp({})
    const router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    vi.spyOn(router, 'isReady').mockResolvedValue(undefined)
    vi.spyOn(router, 'push').mockResolvedValue(undefined)

    const backendStore = {
      authenticationType: 'BFF',
      authenticated: ref(false),
      checkSession: vi.fn().mockResolvedValue(true),
      login: vi.fn().mockResolvedValue({}),
      bffOptions: { flow: { sessionExpiredRedirectToLogin: false } },
    }

    await app.use(bffAuthPlugin, {
      backendStore: backendStore as never,
      router,
      checkOnInstall: true,
    })

    expect(backendStore.checkSession).toHaveBeenCalled()
  })
})
