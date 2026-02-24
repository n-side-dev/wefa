import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { configureBackendStore, useBackendStore } from '@/stores'
import LogoutButton from './LogoutButton.vue'

describe('LogoutButton', () => {
  const ButtonStub = {
    name: 'Button',
    template: "<button class='button-stub' @click=\"$emit('click')\">{{ label }}</button>",
    props: ['label', 'disabled', 'loading'],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('triggers BFF logout when configured', async () => {
    configureBackendStore({ authenticationType: 'BFF', bff: { flow: { logoutRedirect: false } } })
    const backendStore = useBackendStore()
    const logoutSpy = vi.spyOn(backendStore, 'logout').mockResolvedValue()

    const wrapper = mount(LogoutButton, {
      global: {
        stubs: { Button: ButtonStub },
      },
    })

    await wrapper.find('.button-stub').trigger('click')
    expect(logoutSpy).toHaveBeenCalled()
  })
})
