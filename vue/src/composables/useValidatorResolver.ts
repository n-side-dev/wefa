import { validatorRegistry } from '@/utils/validatorRegistry'
import * as z from 'zod'
import { useI18n } from 'vue-i18n'

/**
 * Provides a safe validator resolver for dynamic validator loading from the registry.
 * @param defaultFallback The fallback Zod schema if not found (default: z.any())
 * @returns An object with a `resolve` method to get validators by name.
 */
export function useValidatorResolver(defaultFallback: z.ZodTypeAny = z.any()) {
  const { t } = useI18n()

  const resolve = (name: string, field: string): z.ZodTypeAny => {
    const validatorFactory = validatorRegistry.get(name)
    if (!validatorFactory) {
      console.warn(`Validator "${name}" not registered in the registry.`)
      return defaultFallback
    }
    return validatorFactory(t, field)
  }
  return { resolve }
}
