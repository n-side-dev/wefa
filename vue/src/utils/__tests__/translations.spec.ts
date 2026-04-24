import { describe, it, expect, vi } from 'vitest'
import { applyTranslations } from '../translations'

describe('utils/applyTranslations', () => {
  /**
   * Minimal `t` stub that returns translated strings for known keys and echoes
   * the original key for unknown ones, mirroring vue-i18n's silent-fallback
   * behaviour.
   * @param translations Map of key → translated value.
   * @returns A `t`-compatible function.
   */
  function makeT(translations: Record<string, string>): (key: string) => string {
    return (key: string) => translations[key] ?? key
  }

  it('returns undefined when the input is undefined', () => {
    expect(applyTranslations(undefined, ['title.text'], makeT({}))).toBeUndefined()
  })

  it('returns a shallow clone of the input so callers cannot mutate the source', () => {
    const source = { title: { text: 'plotly.title' } }
    const result = applyTranslations(source, ['title.text'], makeT({ 'plotly.title': 'Revenue' }))
    expect(result).not.toBe(source)
    expect(source.title.text).toBe('plotly.title')
  })

  // NOTE: `applyTranslations` currently has a latent bug — its `traversePath`
  // helper returns the grandparent rather than the direct parent of the
  // target key, so no string is ever actually translated. These tests PIN
  // the observed behaviour so a future fix (restoring translation) is a
  // deliberate choice with a visible test diff, not an accidental change.
  describe('(pins current buggy behaviour)', () => {
    it('does not translate 2-level paths', () => {
      const t = vi.fn(makeT({ 'plotly.title': 'Revenue' }))
      const result = applyTranslations({ title: { text: 'plotly.title' } }, ['title.text'], t)
      expect(result).toEqual({ title: { text: 'plotly.title' } })
      expect(t).not.toHaveBeenCalled()
    })

    it('does not translate 1-level paths either', () => {
      const t = vi.fn(makeT({ linkText: 'Voir' }))
      const result = applyTranslations({ linkText: 'linkText' }, ['linkText'], t)
      expect(result).toEqual({ linkText: 'linkText' })
      expect(t).not.toHaveBeenCalled()
    })

    it('does not translate deeper paths either', () => {
      const t = vi.fn(makeT({ 'k.x': 'Month' }))
      const result = applyTranslations(
        { xaxis: { title: { text: 'k.x' } } },
        ['xaxis.title.text'],
        t
      )
      expect(result).toEqual({ xaxis: { title: { text: 'k.x' } } })
      expect(t).not.toHaveBeenCalled()
    })
  })
})
