import { describe, it, expect, afterEach, vi } from 'vitest'
import * as z from 'zod'
import { useValidatorResolver } from '../useValidatorResolver'
import { validatorRegistry, registerValidator } from '@/utils/validatorRegistry'

const tSpy = vi.hoisted(() => vi.fn((key: string) => key))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: tSpy }),
}))

describe('composables/useValidatorResolver', () => {
  const snapshot = new Map(validatorRegistry)

  afterEach(() => {
    validatorRegistry.clear()
    for (const [name, factory] of snapshot) validatorRegistry.set(name, factory)
    tSpy.mockClear()
    vi.restoreAllMocks()
  })

  it('returns a functional Zod schema for a registered validator name', () => {
    const { resolve } = useValidatorResolver()
    const schema = resolve('email', 'Email')
    expect(schema.safeParse('a@b.co').success).toBe(true)
    expect(schema.safeParse('bogus').success).toBe(false)
  })

  it('forwards the i18n `t` function to registered factories', () => {
    const factory = vi.fn((t, field) => z.string().min(1, { message: t('k', { field }) }))
    registerValidator('inspect', factory)

    const { resolve } = useValidatorResolver()
    resolve('inspect', 'FieldName')

    expect(factory).toHaveBeenCalledWith(tSpy, 'FieldName')
  })

  it('warns and returns the default `z.any()` fallback for unknown names', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { resolve } = useValidatorResolver()
    const schema = resolve('nope', 'X')
    // z.any() accepts literally anything.
    expect(schema.safeParse(undefined).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Validator "nope" not registered'))
  })

  it('honours a custom fallback when supplied', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fallback = z.string().min(3)
    const { resolve } = useValidatorResolver(fallback)
    const schema = resolve('missing', 'X')
    expect(schema.safeParse('ok').success).toBe(false)
    expect(schema.safeParse('okay').success).toBe(true)
  })
})
