/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// Stub PrimeVue Button so we can inspect props and trigger clicks
vi.mock('primevue/button', () => {
  const { defineComponent, h } = require('vue')
  const ButtonStub = defineComponent({
    name: 'PrimeVueButtonStub',
    props: {
      label: [String],
      icon: [String],
      severity: String,
      loading: Boolean,
      disabled: Boolean,
    },
    emits: ['click'],
    setup(props, { emit, attrs }) {
      return () =>
        h(
          'button',
          {
            'data-label': props.label as any,
            'data-icon': props.icon as any,
            'data-severity': props.severity as any,
            'data-loading': props.loading ? 'true' : 'false',
            disabled: props.disabled,
            class: attrs.class,
            onClick: () => emit('click'),
          },
          props.label as any,
        )
    },
  })
  return { default: ButtonStub }
})

// Mock i18n so t() returns the key
vi.mock('@/locales', () => ({ useI18nLib: () => ({ t: (key: string) => key }) }))

import ApiMutationButton from '../ApiMutationButton.vue'

describe('ApiMutationButton.vue', () => {
  let mutateSpy: ReturnType<typeof vi.fn>
  beforeEach(() => {
    mutateSpy = vi.fn()
  })

  function mountWithState(state: {
    isPending?: boolean
    data?: any
    error?: any
    body?: any
    relaunchableOnSuccess?: boolean
    relaunchableOnError?: boolean
  } = {}) {
    const mutation = {
      isPending: ref(!!state.isPending),
      data: ref(state.data),
      error: ref(state.error),
      mutate: mutateSpy,
    }
    const mutationBody = ref(state.body ?? { foo: 'bar' })

    const wrapper = mount(ApiMutationButton as any, {
      props: {
        mutation,
        mutationBody,
        relaunchableOnSuccess: state.relaunchableOnSuccess ?? false,
        relaunchableOnError: state.relaunchableOnError ?? false,
      },
    })

    const btn = () => wrapper.get('button')
    const label = () => btn().attributes('data-label')
    const severity = () => btn().attributes('data-severity')

    return { wrapper, mutation, mutationBody, btn, label, severity }
  }

  it('renders default state and triggers mutate with body on click', async () => {
    const { btn, label, severity, mutationBody } = mountWithState()
    expect(label()).toBe('network_button.submit')
    expect(severity()).toBe('primary')
    expect(btn().attributes('disabled')).toBeUndefined()

    await btn().trigger('click')
    expect(mutateSpy).toHaveBeenCalledTimes(1)
    expect(mutateSpy).toHaveBeenCalledWith(mutationBody.value)
  })

  it('renders loading state: info severity, disabled, and no action on click', async () => {
    const { btn, label, severity } = mountWithState({ isPending: true })
    expect(label()).toBe('network_button.loading')
    expect(severity()).toBe('info')
    expect(btn().attributes('disabled')).toBeDefined()

    await btn().trigger('click')
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('renders success state (not relaunchable): disabled and no action on click', async () => {
    const { mutation, btn, label, severity } = mountWithState({ data: { ok: true } })
    // ensure not loading
    mutation.isPending.value = false
    await nextTick()

    expect(label()).toBe('network_button.success')
    expect(severity()).toBe('success')
    expect(btn().attributes('disabled')).toBeDefined()

    await btn().trigger('click')
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('renders success state (relaunchable): enabled and triggers mutate on click', async () => {
    const { mutation, btn, label, severity, mutationBody } = mountWithState({ data: { ok: true }, relaunchableOnSuccess: true })
    mutation.isPending.value = false
    await nextTick()

    expect(label()).toBe('network_button.success')
    expect(severity()).toBe('success')
    expect(btn().attributes('disabled')).toBeUndefined()

    await btn().trigger('click')
    expect(mutateSpy).toHaveBeenCalledTimes(1)
    expect(mutateSpy).toHaveBeenCalledWith(mutationBody.value)
  })

  it('renders error state (not relaunchable): disabled with error text', async () => {
    const { btn, label, severity } = mountWithState({ error: new Error('boom') })
    expect(label()).toBe('network_button.error')
    expect(severity()).toBe('danger')
    expect(btn().attributes('disabled')).toBeDefined()
  })

  it('renders error state (relaunchable): shows retry, enabled, triggers mutate on click', async () => {
    const { btn, label, severity, mutationBody } = mountWithState({ error: new Error('boom'), relaunchableOnError: true })
    expect(label()).toBe('network_button.retry')
    expect(severity()).toBe('danger')
    expect(btn().attributes('disabled')).toBeUndefined()

    await btn().trigger('click')
    expect(mutateSpy).toHaveBeenCalledTimes(1)
    expect(mutateSpy).toHaveBeenCalledWith(mutationBody.value)
  })
})
