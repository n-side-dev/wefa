import {
  createI18n,
  useI18n,
  type I18nOptions,
  type LocaleMessages,
  type LocaleMessageValue,
} from 'vue-i18n'

const defaultMessages: LocaleMessages<Record<string, LocaleMessageValue>> = loadTranslations()

/**
 * Load project translation files dynamically (for consumer use)
 * This function scans the specified glob pattern for JSON files in the locales directory,
 * @param glob Glob pattern to match translation files
 * @returns An object containing the loaded translations, structured by locale and root field.
 */
export function loadTranslations(
  glob: Record<string, { default: Record<string, LocaleMessageValue> }> | undefined = undefined
): LocaleMessages<Record<string, LocaleMessageValue>> {
  const modules = glob
    ? glob
    : (import.meta.glob('@/locales/*/*.json', { eager: true }) as Record<
        string,
        { default: LocaleMessages<LocaleMessageValue> }
      >)

  const messages: LocaleMessages<Record<string, LocaleMessageValue>> = {}
  for (const path in modules) {
    // Extract locale and root field (e.g., ./locales/en/validation.json -> locale: en, rootField: validation)
    const matched = path.match(/\/locales\/([\w-]+)\/([\w-]+)\.json$/i)
    if (matched && matched.length > 2) {
      const locale = matched[1]
      const rootField = matched[2]
      /* eslint-disable security/detect-object-injection */
      const moduleData = modules[path]

      // Ensure we have valid locale, rootField, and moduleData before proceeding
      if (locale && rootField && moduleData) {
        // Safe local assignation. No safeguard needed.
        if (!messages[locale]) {
          messages[locale] = {}
        }
        messages[locale][rootField] = moduleData.default
      }
      /* eslint-enable security/detect-object-injection */
    }
  }
  return messages
}

/**
 * Create the i18n instance with merged messages
 * This function merges library default translations with project-provided messages,
 * allowing project overrides to take precedence.
 * It supports dynamic loading of translations and provides a consistent i18n setup.
 * @param options I18nOptions
 * @returns I18n instance
 */
export function createLibI18n(options: I18nOptions = {}) {
  // Merge library defaults with project-provided messages (project overrides take precedence)
  const mergedMessages: LocaleMessages<LocaleMessageValue> = {}

  // Safe local assignation. No safeguard needed.
  /* eslint-disable security/detect-object-injection */
  for (const locale in defaultMessages) {
    mergedMessages[locale] = { ...defaultMessages[locale] }
    if (options.messages?.[locale]) {
      for (const rootField in options.messages[locale]) {
        const override =
          typeof options.messages[locale][rootField] === 'object' &&
          options.messages[locale][rootField] !== null
            ? options.messages[locale][rootField]
            : {}
        mergedMessages[locale][rootField] = {
          ...mergedMessages[locale][rootField],
          ...override,
        }
      }
    }
  }
  /* eslint-enable security/detect-object-injection */

  return createI18n({
    legacy: false, // Use Composition API
    locale: 'en', // Default locale
    fallbackLocale: 'en',
    formatFallbackMessages: true, // Enable fallback for missing translations
    silentTranslationWarn: true, // Silence warnings for missing translations
    warnHtmlMessage: false, // Disable warnings for HTML in translations
    silentFallbackWarn: true, // Silence warnings for fallback
    missingWarn: false, // Disable warnings for missing translations
    messages: mergedMessages as LocaleMessages<Record<string, LocaleMessageValue>>,
    ...options, // Merge other options (e.g., locale, numberFormats)
  })
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
