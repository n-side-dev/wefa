import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import LocaleSelector from '../LocaleSelector.vue'
import { useLocaleStore } from '../../index'

const LocaleSelectStub = defineComponent({
  name: 'LocaleSelectStub',
  props: {
    modelValue: { type: String, default: '' },
    options: { type: Array as () => Array<{ value: string; label: string }>, default: () => [] },
    optionLabel: { type: String, default: 'label' },
    optionValue: { type: String, default: 'value' },
    ariaLabel: { type: String, default: '' },
    pt: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue'],
  methods: {
    handleChange(event: Event) {
      this.$emit('update:modelValue', (event.target as HTMLSelectElement).value)
    },
  },
  template: `
    <select
      :data-test="'locale-select'"
      :aria-label="ariaLabel"
      :value="modelValue"
      @change="handleChange"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  `,
})

/**
 * Seed the Pinia store with a minimal configured state, bypassing the full
 * plugin install flow.
 * @param locale Initial active locale code.
 * @param available Locales returned by the mocked `availableLocales`.
 */
function seedStore(locale = 'en', available: string[] = ['en', 'fr', 'nl']): void {
  const store = useLocaleStore()
  store.availableLocales = available
  store.defaultLocale = 'en'
  store.locale = locale
}

describe('LocaleSelector.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders one option per available locale with capitalized display names', () => {
    seedStore('en', ['en', 'fr'])

    const wrapper = mount(LocaleSelector, {
      global: { stubs: { Select: LocaleSelectStub } },
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(2)
    expect(options[0]!.attributes('value')).toBe('en')
    expect(options[1]!.attributes('value')).toBe('fr')
    // Intl.DisplayNames should produce localized, capitalized names
    expect(options[0]!.text().charAt(0)).toBe(options[0]!.text().charAt(0).toUpperCase())
    expect(options[1]!.text().charAt(0)).toBe(options[1]!.text().charAt(0).toUpperCase())
  })

  it('uses `locale_selector.label` as the aria-label', () => {
    seedStore('en', ['en'])

    const wrapper = mount(LocaleSelector, {
      global: { stubs: { Select: LocaleSelectStub } },
    })

    expect(wrapper.get('[data-test="locale-select"]').attributes('aria-label')).toBe('Language')
  })

  it('invokes store.setLocale when the user picks a new locale', async () => {
    seedStore('en', ['en', 'fr'])
    const store = useLocaleStore()
    const setSpy = vi.spyOn(store, 'setLocale').mockResolvedValue(undefined)

    const wrapper = mount(LocaleSelector, {
      global: { stubs: { Select: LocaleSelectStub } },
    })

    await wrapper.get('[data-test="locale-select"]').setValue('fr')
    await flushPromises()

    expect(setSpy).toHaveBeenCalledWith('fr')
  })

  it('falls back to the raw code when Intl.DisplayNames throws', () => {
    seedStore('en', ['en', 'xx'])
    vi.stubGlobal(
      'Intl',
      new Proxy(Intl, {
        get(target, prop) {
          if (prop === 'DisplayNames') {
            return class {
              constructor() {
                throw new Error('unsupported')
              }
            }
          }
          return Reflect.get(target, prop)
        },
      })
    )

    const wrapper = mount(LocaleSelector, {
      global: { stubs: { Select: LocaleSelectStub } },
    })

    const options = wrapper.findAll('option')
    expect(options.map((o) => o.text())).toEqual(['en', 'xx'])
  })

  it('falls back to the raw code when DisplayNames.of returns empty', () => {
    seedStore('en', ['zz'])

    class EmptyDisplayNames {
      of() {
        return ''
      }
    }
    vi.stubGlobal(
      'Intl',
      new Proxy(Intl, {
        get(target, prop) {
          if (prop === 'DisplayNames') return EmptyDisplayNames
          return Reflect.get(target, prop)
        },
      })
    )

    const wrapper = mount(LocaleSelector, {
      global: { stubs: { Select: LocaleSelectStub } },
    })

    expect(wrapper.findAll('option')[0]!.text()).toBe('zz')
  })

  it('re-renders options reactively when availableLocales changes', async () => {
    seedStore('en', ['en'])
    const store = useLocaleStore()

    const wrapper = mount(LocaleSelector, {
      global: { stubs: { Select: LocaleSelectStub } },
    })

    expect(wrapper.findAll('option')).toHaveLength(1)

    store.availableLocales = ['en', 'fr', 'nl']
    await flushPromises()

    expect(wrapper.findAll('option')).toHaveLength(3)
  })
})
