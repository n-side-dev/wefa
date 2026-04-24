import { describe, it, expect, afterEach, vi } from 'vitest'
import { validatorRegistry, registerValidator } from '../validatorRegistry'

describe('utils/validatorRegistry', () => {
  const snapshot = new Map(validatorRegistry)

  afterEach(() => {
    validatorRegistry.clear()
    for (const [name, factory] of snapshot) validatorRegistry.set(name, factory)
  })

  /**
   * `t` stub that returns a deterministic key-based string so assertions can
   * inspect both which translation key was requested and what params flowed
   * through.
   */
  function makeT() {
    return vi.fn((key: string, params?: Record<string, unknown>) => {
      const suffix = params ? `(${JSON.stringify(params)})` : ''
      return `${key}${suffix}`
    })
  }

  it('ships built-in validator factories', () => {
    expect(validatorRegistry.has('email')).toBe(true)
    expect(validatorRegistry.has('url')).toBe(true)
    expect(validatorRegistry.has('passwordWeak')).toBe(true)
    expect(validatorRegistry.has('passwordStrong')).toBe(true)
  })

  it('email factory flows params through `t` and accepts valid values', () => {
    const t = makeT()
    const schema = validatorRegistry.get('email')!(t, 'Email')
    expect(schema.safeParse('alice@example.com').success).toBe(true)
    const invalid = schema.safeParse('not-an-email')
    expect(invalid.success).toBe(false)
    expect(t).toHaveBeenCalledWith('validation.email', { field: 'Email' })
  })

  it('url factory accepts a well-formed URL and rejects garbage', () => {
    const t = makeT()
    const schema = validatorRegistry.get('url')!(t, 'Homepage')
    expect(schema.safeParse('https://example.com').success).toBe(true)
    expect(schema.safeParse('nope').success).toBe(false)
    expect(t).toHaveBeenCalledWith('validation.url', { field: 'Homepage' })
  })

  it('passwordWeak factory enforces min length + case rules', () => {
    const t = makeT()
    const schema = validatorRegistry.get('passwordWeak')!(t, 'Password')
    expect(schema.safeParse('Abcdef').success).toBe(true)
    expect(schema.safeParse('short').success).toBe(false)
    expect(schema.safeParse('ALLUPPER').success).toBe(false)
    expect(schema.safeParse('alllower').success).toBe(false)
    expect(t).toHaveBeenCalledWith('validation.passwordMin', { field: 'Password', minLength: 6 })
  })

  it('passwordStrong factory enforces min length + ASCII + mixed classes', () => {
    const t = makeT()
    const schema = validatorRegistry.get('passwordStrong')!(t, 'Password')
    expect(schema.safeParse('Abcdefg1!xyzQ').success).toBe(true)
    expect(schema.safeParse('short1!A').success).toBe(false)
    expect(schema.safeParse('LongEnoughButNoSpecial1').success).toBe(false)
    expect(schema.safeParse('LongEnoughButNoDigit!!').success).toBe(false)
    expect(schema.safeParse('cafécafé1!CAFÉCAFÉ').success).toBe(false)
  })

  it('registerValidator adds new entries and overrides existing ones', () => {
    registerValidator('custom', (_t, _field) => {
      // deliberately ignores t/field; behaviour coverage handled elsewhere
      return validatorRegistry.get('email')!(_t, _field)
    })
    expect(validatorRegistry.has('custom')).toBe(true)

    let calls = 0
    registerValidator('custom', (_t, _field) => {
      calls += 1
      return validatorRegistry.get('url')!(_t, _field)
    })
    validatorRegistry.get('custom')!(makeT(), 'X')
    expect(calls).toBe(1)
  })
})
