import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { configureBackendStore, useBackendStore } from '@/stores'
import LoginButton from './LoginButton.vue'

describe('LoginButton', () => {
  const ButtonStub = {
    name: 'Button',
    template: "<button class='button-stub' @click=\"$emit('click')\">{{ label }}</button>",
    props: ['label', 'disabled', 'loading'],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('triggers BFF login when configured', async () => {
    configureBackendStore({ authenticationType: 'BFF', bff: { flow: { loginRedirect: false } } })
    const backendStore = useBackendStore()
    const loginSpy = vi.spyOn(backendStore, 'login').mockResolvedValue({} as never)

    const wrapper = mount(LoginButton, {
      global: {
        stubs: { Button: ButtonStub },
      },
    })

    await wrapper.find('.button-stub').trigger('click')
    expect(loginSpy).toHaveBeenCalled()
  })
})
