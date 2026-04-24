import { createApp, nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import { all as primeLocalesAll } from 'primelocale'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { createLibI18n, resolvePrimeLocale } from '..'

type PrimeVueGlobal = { config: { locale?: Record<string, unknown> } }

const getPrimeLocale = (app: ReturnType<typeof createApp>): Record<string, unknown> | undefined => {
  const primevue = app.config.globalProperties.$primevue as PrimeVueGlobal | undefined
  return primevue?.config.locale
}

describe('createLibI18n', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ships wefa default English messages', () => {
    const i18n = createLibI18n()
    // form.submit comes from wefa's bundled en/form.json.
    expect(i18n.global.t('form.submit')).toBe('Submit')
  })

  it('lets project translations (via glob) override wefa defaults', () => {
    const glob = {
      '/src/locales/en/form.json': { default: { submit: 'Send it' } },
      '/src/locales/fr/form.json': { default: { submit: 'Envoyer' } },
    }
    const i18n = createLibI18n({ glob })

    expect(i18n.global.t('form.submit')).toBe('Send it')

    i18n.global.locale.value = 'fr'
    expect(i18n.global.t('form.submit')).toBe('Envoyer')
  })

  it('preserves sibling default keys when a partial override is provided', () => {
    const i18n = createLibI18n({
      messages: { en: { form: { submit: 'Send' } } },
    })
    // The override provides only form.submit — other default form.* keys must survive.
    expect(i18n.global.t('form.submit')).toBe('Send')
    // `username` is a default key in wefa's en/form.json; it must not be dropped.
    expect(i18n.global.t('form.username')).toBe('Username')
  })

  it('explicit options.messages wins over glob and defaults', () => {
    const glob = {
      '/src/locales/en/form.json': { default: { submit: 'From glob' } },
    }
    const i18n = createLibI18n({
      glob,
      messages: { en: { form: { submit: 'From options' } } },
    })
    expect(i18n.global.t('form.submit')).toBe('From options')
  })

  it('syncs PrimeVue config.locale with the active vue-i18n locale on install', async () => {
    const app = createApp({ render: () => null })
    app.use(PrimeVue)
    const i18n = createLibI18n({ locale: 'en' })
    app.use(i18n)

    expect(getPrimeLocale(app)).toStrictEqual(primeLocalesAll.en)

    i18n.global.locale.value = 'fr'
    await nextTick()
    expect(getPrimeLocale(app)).toStrictEqual(primeLocalesAll.fr)
  })

  it('applies primevueLocaleOverrides and preserves them across locale swaps', async () => {
    const app = createApp({ render: () => null })
    app.use(PrimeVue)
    const i18n = createLibI18n({
      locale: 'en',
      primevueLocaleOverrides: {
        '*': { accept: 'Confirm', aria: { close: 'Dismiss' } },
        fr: { accept: 'Valider' },
      },
    })
    app.use(i18n)

    expect(getPrimeLocale(app)?.accept).toBe('Confirm')
    expect((getPrimeLocale(app)?.aria as Record<string, unknown>).close).toBe('Dismiss')

    i18n.global.locale.value = 'fr'
    await nextTick()
    // Per-locale override wins over `*`; `aria.close` from `*` still applied;
    // non-overridden keys come from the French bundle.
    expect(getPrimeLocale(app)?.accept).toBe('Valider')
    expect((getPrimeLocale(app)?.aria as Record<string, unknown>).close).toBe('Dismiss')
    expect(getPrimeLocale(app)?.reject).toBe(primeLocalesAll.fr.reject)
  })

  it('falls back to English PrimeVue messages for an unknown locale', async () => {
    const app = createApp({ render: () => null })
    app.use(PrimeVue)
    const i18n = createLibI18n({ locale: 'en' })
    app.use(i18n)

    i18n.global.locale.value = 'xx-NONE'
    await nextTick()
    expect(getPrimeLocale(app)).toStrictEqual(primeLocalesAll.en)
  })

  it('warns and skips PrimeVue sync if PrimeVue is not installed first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createApp({ render: () => null })
    const i18n = createLibI18n()
    app.use(i18n)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[wefa] createLibI18n'))
  })
})

describe('resolvePrimeLocale', () => {
  it('returns the exact match when available', () => {
    expect(resolvePrimeLocale('fr')).toBe(primeLocalesAll.fr)
  })

  it('handles hyphen/underscore variants', () => {
    expect(resolvePrimeLocale('en-GB')).toBe(primeLocalesAll['en-GB'])
    expect(resolvePrimeLocale('en_GB')).toBe(primeLocalesAll['en-GB'])
  })

  it('falls back to the primary subtag when no regional match exists', () => {
    expect(resolvePrimeLocale('fr-XX')).toBe(primeLocalesAll.fr)
  })

  it('falls back to English for entirely unknown locales', () => {
    expect(resolvePrimeLocale('xx-NONE')).toBe(primeLocalesAll.en)
  })
})
