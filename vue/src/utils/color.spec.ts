import { describe, expect, it } from 'vitest'
import { getAccessibleTextColor, getRelativeLuminance, hashString, hslToRgb } from './color'

describe('color utilities', () => {
  it('hashes strings deterministically', () => {
    expect(hashString('alice')).toBe(hashString('alice'))
    expect(hashString('alice')).not.toBe(hashString('bob'))
  })

  it('converts hsl values to rgb', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('computes luminance in expected bounds', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0)
    expect(getRelativeLuminance(255, 255, 255)).toBe(1)
  })

  it('chooses readable text color for background contrast', () => {
    expect(getAccessibleTextColor({ r: 0, g: 0, b: 0 })).toBe('#FFFFFF')
    expect(getAccessibleTextColor({ r: 255, g: 255, b: 255 })).toBe('#0F172A')
  })
})
