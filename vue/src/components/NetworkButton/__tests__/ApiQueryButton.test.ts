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

import ApiQueryButton from '../ApiQueryButton.vue'

describe('ApiQueryButton.vue', () => {
  let refetchSpy: ReturnType<typeof vi.fn>
  beforeEach(() => {
    refetchSpy = vi.fn()
  })

  function mountWithState(state: {
    isLoading?: boolean
    data?: any
    error?: any
    relaunchableOnSuccess?: boolean
    relaunchableOnError?: boolean
  } = {}) {
    const query = {
      isLoading: ref(!!state.isLoading),
      data: ref(state.data),
      error: ref(state.error),
      refetch: refetchSpy,
    }

    const wrapper = mount(ApiQueryButton as any, {
      props: {
        query,
        relaunchableOnSuccess: state.relaunchableOnSuccess ?? false,
        relaunchableOnError: state.relaunchableOnError ?? false,
      },
    })

    const btn = () => wrapper.get('button')
    const label = () => btn().attributes('data-label')
    const severity = () => btn().attributes('data-severity')

    return { wrapper, query, btn, label, severity }
  }

  it('renders default state and triggers refetch on click', async () => {
    const { btn, label, severity } = mountWithState()
    expect(label()).toBe('network_button.submit')
    expect(severity()).toBe('primary')
    expect(btn().attributes('disabled')).toBeUndefined()

    await btn().trigger('click')
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })

  it('renders loading state: info severity, disabled, and no action on click', async () => {
    const { btn, label, severity } = mountWithState({ isLoading: true })
    expect(label()).toBe('network_button.loading')
    expect(severity()).toBe('info')
    expect(btn().attributes('disabled')).toBeDefined()

    await btn().trigger('click')
    expect(refetchSpy).not.toHaveBeenCalled()
  })

  it('renders success state (not relaunchable): disabled and no action on click', async () => {
    const { query, btn, label, severity } = mountWithState({ data: { ok: true } })
    query.isLoading.value = false
    await nextTick()

    expect(label()).toBe('network_button.success')
    expect(severity()).toBe('success')
    expect(btn().attributes('disabled')).toBeDefined()

    await btn().trigger('click')
    expect(refetchSpy).not.toHaveBeenCalled()
  })

  it('renders success state (relaunchable): enabled and triggers refetch on click', async () => {
    const { query, btn, label, severity } = mountWithState({ data: { ok: true }, relaunchableOnSuccess: true })
    query.isLoading.value = false
    await nextTick()

    expect(label()).toBe('network_button.success')
    expect(severity()).toBe('success')
    expect(btn().attributes('disabled')).toBeUndefined()

    await btn().trigger('click')
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })

  it('renders error state (not relaunchable): disabled with error text', async () => {
    const { btn, label, severity } = mountWithState({ error: new Error('boom') })
    expect(label()).toBe('network_button.error')
    expect(severity()).toBe('danger')
    expect(btn().attributes('disabled')).toBeDefined()
  })

  it('renders error state (relaunchable): shows retry, enabled, triggers refetch on click', async () => {
    const { btn, label, severity } = mountWithState({ error: new Error('boom'), relaunchableOnError: true })
    expect(label()).toBe('network_button.retry')
    expect(severity()).toBe('danger')
    expect(btn().attributes('disabled')).toBeUndefined()

    await btn().trigger('click')
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })
})
