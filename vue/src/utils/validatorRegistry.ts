import * as z from 'zod'

export const validatorRegistry = new Map<
  string,
  (t: (key: string, params?: Record<string, unknown>) => string, field: string) => z.ZodTypeAny
>()

// Pre-register common validation functions as factories
validatorRegistry.set('email', (t, field) =>
  z.string().email({ message: t('validation.email', { field }) })
)
validatorRegistry.set('url', (t, field) =>
  z.string().url({ message: t('validation.url', { field }) })
)
validatorRegistry.set('passwordWeak', (t, field) =>
  z
    .string()
    .min(6, { message: t('validation.passwordMin', { field, minLength: 6 }) })
    .regex(/[A-Z]/, { message: t('validation.passwordUpper', { field }) })
    .regex(/[a-z]/, { message: t('validation.passwordLower', { field }) })
)

validatorRegistry.set('passwordStrong', (t, field) =>
  z
    .string()
    .min(12, { message: t('validation.passwordStrongMin', { field, minLength: 12 }) })
    .regex(/^[\x20-\x7E]+$/, { message: t('validation.passwordAscii', { field }) })
    .regex(/[A-Z]/, { message: t('validation.passwordUpper', { field }) })
    .regex(/\d/, { message: t('validation.passwordNumber', { field }) })
    .regex(/[^A-Za-z0-9]/, { message: t('validation.passwordSpecial', { field }) })
)

// Pre-register WeFa's own validators as factories
// validatorRegistry.set('customValidator', (t, field) => z.string().regex(/^[A-Z]+$/, { message: t('validation.customValidator', { field }) }))

/**
 * Registers a validator factory by providing the key and the factory function.
 * @param name - The registry key (validator name)
 * @param factory - The factory that returns a Zod schema, taking t and field
 */
export function registerValidator(
  name: string,
  factory: (
    t: (key: string, params?: Record<string, unknown>) => string,
    field: string
  ) => z.ZodTypeAny
) {
  validatorRegistry.set(name, factory)
}
