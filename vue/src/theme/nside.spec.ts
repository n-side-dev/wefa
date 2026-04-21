import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  createNsideTheme,
  nsidePreset,
  nsidePrimeVueTheme,
  nsideThemeOptions,
} from './nside'

const themeCss = readFileSync(resolve(process.cwd(), 'src/assets/main.css'), 'utf8')

describe('N-SIDE theme exports', () => {
  it('returns the canonical MMS-derived preset without arguments', () => {
    expect(createNsideTheme()).toBe(nsidePreset)
  })

  it('keeps legacy primary arguments as backward-compatible no-ops', () => {
    expect(createNsideTheme('green')).toBe(nsidePreset)
    expect(createNsideTheme('orange')).toBe(nsidePreset)
    expect(createNsideTheme('blue')).toBe(nsidePreset)
  })

  it('exports a full PrimeVue theme config with the shared dark-mode selector', () => {
    expect(nsidePrimeVueTheme.preset).toBe(nsidePreset)
    expect(nsidePrimeVueTheme.options).toEqual(nsideThemeOptions)
    expect(nsidePrimeVueTheme.options.darkModeSelector).toBe('.app-dark-mode')
  })
})

describe('N-SIDE shared stylesheet', () => {
  it('contains the flagship light-mode token contract', () => {
    expect(themeCss).toContain("@import url('https://fonts.googleapis.com/css2?family=Poppins")
    expect(themeCss).toContain('--brand-navy: #182950;')
    expect(themeCss).toContain('--brand-surface: #ffffff;')
    expect(themeCss).toContain('--brand-teal: #05b5c8;')
    expect(themeCss).toContain('--brand-shadow-lg: 0 34px 90px -50px rgba(24, 41, 80, 0.42);')
  })

  it('contains the shared dark-mode wiring and dark token overrides', () => {
    expect(themeCss).toContain('@custom-variant dark (&:where(.app-dark-mode, .app-dark-mode *));')
    expect(themeCss).toContain('.app-dark-mode {')
    expect(themeCss).toContain('color-scheme: dark;')
    expect(themeCss).toContain('--brand-surface: #0f1b31;')
    expect(themeCss).toContain('--brand-link: #69dceb;')
  })
})
