import {
  createI18n,
  useI18n,
  type I18n,
  type I18nOptions,
  type LocaleMessages,
  type LocaleMessageValue,
} from 'vue-i18n'
import { watch, type App } from 'vue'
import { all as primeLocalesAll } from 'primelocale'

type GlobResult = Record<string, { default: Record<string, LocaleMessageValue> }>

const defaultMessages: LocaleMessages<Record<string, LocaleMessageValue>> = loadTranslations()

/**
 * Load project translation files dynamically (for consumer use)
 * This function scans the specified glob pattern for JSON files in the locales directory,
 * @param glob Glob pattern to match translation files
 * @returns An object containing the loaded translations, structured by locale and root field.
 */
export function loadTranslations(
  glob: GlobResult | undefined = undefined
): LocaleMessages<Record<string, LocaleMessageValue>> {
  const modules = glob
    ? glob
    : (import.meta.glob('@/locales/*/*.json', { eager: true }) as GlobResult)

  const messages: LocaleMessages<Record<string, LocaleMessageValue>> = {}
  for (const path in modules) {
    // Extract locale and root field (e.g., ./locales/en/validation.json -> locale: en, rootField: validation)
    const matched = path.match(/\/locales\/([\w-]+)\/([\w-]+)\.json$/i)
    if (matched && matched.length > 2) {
      const locale = matched[1]
      const rootField = matched[2]
      const moduleData = modules[path]

      // Ensure we have valid locale, rootField, and moduleData before proceeding
      if (locale && rootField && moduleData) {
        // Safe local assignation. No safeguard needed.
        if (!messages[locale]) {
          messages[locale] = {}
        }
        messages[locale][rootField] = moduleData.default
      }
    }
  }
  return messages
}

/**
 * Resolve a consumer locale string (e.g. 'en', 'en-GB', 'fr_CA') to the best-matching
 * primelocale bundle, falling back through hyphen/underscore variants, the primary
 * subtag, and finally English.
 */
export function resolvePrimeLocale(locale: string): Record<string, unknown> {
  const map = primeLocalesAll as unknown as Record<string, Record<string, unknown>>
  const primary = locale.split(/[-_]/)[0] ?? 'en'
  const candidates = [locale, locale.replace('-', '_'), locale.replace('_', '-'), primary, 'en']
  for (const candidate of candidates) {
    if (candidate && map[candidate]) return map[candidate]
  }
  return map.en
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Recursively merge `source` into `target`, so partial overrides preserve sibling
 * keys at every depth. Arrays and primitives from `source` replace the target value.
 */
function deepMerge<T>(target: T, source: unknown): T {
  if (!isPlainObject(source)) return source === undefined ? target : (source as T)
  const base: Record<string, unknown> = isPlainObject(target) ? { ...target } : {}
  for (const key of Object.keys(source)) {
    base[key] = deepMerge(base[key], source[key])
  }
  return base as T
}

export type CreateLibI18nOptions = I18nOptions & {
  /**
   * Result of `import.meta.glob('./locales/**\/*.json', { eager: true })` from the
   * consuming project. Files are expected to follow the `<locale>/<category>.json`
   * naming convention. Any keys that collide with wefa's defaults will override them.
   */
  glob?: GlobResult
  /**
   * Per-locale overrides for PrimeVue's `config.locale`. Deep-merged on top of the
   * primelocale bundle every time the active locale changes, so consumer-supplied
   * terminology, branding, or compliance wording survives locale swaps. Keys may be
   * keyed by exact tag (`'en-GB'`), primary subtag (`'fr'`), or `'*'` to apply to
   * every locale.
   */
  primevueLocaleOverrides?: Record<string, Record<string, unknown>>
}

/**
 * Resolve the best-matching supported locale from the browser's preferred
 * languages. Walks `navigator.languages` (falling back to `navigator.language`),
 * strips any region subtag (`fr-BE` → `fr`, `pt_BR` → `pt`), and returns the
 * first entry from `supportedLocales` that matches on the primary subtag.
 * Returns `undefined` when no candidate matches or `navigator` is unavailable.
 * @param supportedLocales Locales the i18n instance knows about.
 * @returns Matching locale tag from `supportedLocales`, or `undefined`.
 */
export function resolveBrowserLocale(supportedLocales: readonly string[]): string | undefined {
  if (typeof navigator === 'undefined') return undefined
  const preferences = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const preference of preferences) {
    const primary = preference?.toLowerCase().split(/[-_]/)[0]
    if (!primary) continue
    const match = supportedLocales.find(
      (locale) => locale.toLowerCase().split(/[-_]/)[0] === primary
    )
    if (match) return match
  }
  return undefined
}

/**
 * Create the i18n instance with merged messages from wefa defaults, the consumer's
 * project translation files (passed via `options.glob`), and any explicit
 * `options.messages`. The returned Vue plugin also keeps PrimeVue's `config.locale`
 * in sync with the active vue-i18n locale — install PrimeVue before `app.use(i18n)`
 * for the sync to activate.
 * @param options CreateLibI18nOptions
 * @returns Vue plugin / i18n instance
 */
export function createLibI18n(options: CreateLibI18nOptions = {}) {
  const { glob, messages: explicitMessages, primevueLocaleOverrides, ...i18nOptions } = options
  const projectMessages = glob ? loadTranslations(glob) : {}

  const mergedMessages: LocaleMessages<LocaleMessageValue> = {}
  const locales = new Set<string>([
    ...Object.keys(defaultMessages),
    ...Object.keys(projectMessages),
    ...Object.keys(explicitMessages ?? {}),
  ])
  for (const locale of locales) {
    let merged: Record<string, LocaleMessageValue> = {
      ...(defaultMessages[locale] ?? {}),
    }
    merged = deepMerge(merged, projectMessages[locale])
    merged = deepMerge(merged, explicitMessages?.[locale])
    mergedMessages[locale] = merged
  }

  const supportedLocales = Array.from(locales)
  const detectedLocale = resolveBrowserLocale(supportedLocales) ?? 'en'

  const i18n = createI18n<false>({
    legacy: false, // Use Composition API
    locale: detectedLocale, // Default locale
    fallbackLocale: 'en',
    formatFallbackMessages: true, // Enable fallback for missing translations
    silentTranslationWarn: true, // Silence warnings for missing translations
    warnHtmlMessage: false, // Disable warnings for HTML in translations
    silentFallbackWarn: true, // Silence warnings for fallback
    missingWarn: false, // Disable warnings for missing translations
    ...i18nOptions, // Merge other options (e.g., locale, numberFormats)
    messages: mergedMessages as LocaleMessages<Record<string, LocaleMessageValue>>,
  })

  const originalInstall = i18n.install.bind(i18n) as (app: App, ...args: unknown[]) => void
  i18n.install = ((app: App, ...args: unknown[]) => {
    originalInstall(app, ...args)

    const primevue = app.config.globalProperties.$primevue as
      | { config: { locale?: Record<string, unknown> } }
      | undefined
    if (!primevue) {
      console.warn(
        '[wefa] createLibI18n: PrimeVue is not installed on this app. ' +
          'Install PrimeVue (app.use(PrimeVue, ...)) before app.use(i18n) to enable PrimeVue locale sync.'
      )
      return
    }

    const resolveOverrides = (loc: string): Record<string, unknown> => {
      if (!primevueLocaleOverrides) return {}
      const primary = loc.split(/[-_]/)[0] ?? ''
      // Most general → most specific; later layers win.
      const layers = ['*', primary, loc.replace('_', '-'), loc.replace('-', '_'), loc]
      let merged: Record<string, unknown> = {}
      for (const key of layers) {
        if (key && primevueLocaleOverrides[key]) {
          merged = deepMerge(merged, primevueLocaleOverrides[key])
        }
      }
      return merged
    }

    const applyLocale = (loc: unknown) => {
      const tag = String(loc)
      primevue.config.locale = deepMerge(resolvePrimeLocale(tag), resolveOverrides(tag))
    }
    applyLocale(i18n.global.locale.value)
    watch(i18n.global.locale, applyLocale)
  }) as I18n['install']

  return i18n
}

/**
 * Composable for components to use i18n
 * @returns An object with `t` and `mergeLocaleMessage` methods for translation and dynamic message merging.
 */
export function useI18nLib() {
  return useI18n({ useScope: 'global' })
}

/**
 * Utility to add or override translations dynamically after creation
 * @param locale The locale to register translations for
 * @param messages The translation messages to add or override
 */
export function registerTranslations(locale: string, messages: LocaleMessages<LocaleMessageValue>) {
  const { mergeLocaleMessage } = useI18nLib()
  mergeLocaleMessage(locale, messages)
}
