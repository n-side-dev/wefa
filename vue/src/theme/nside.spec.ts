import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createNsideTheme, nsidePreset, nsidePrimeVueTheme, nsideThemeOptions } from './nside'

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
  it('keeps the font import, Tailwind wiring, and dark-mode custom variant', () => {
    expect(themeCss).toContain("@import url('https://fonts.googleapis.com/css2?family=Poppins")
    expect(themeCss).toContain("@import 'tailwindcss';")
    expect(themeCss).toContain('@custom-variant dark (&:where(.app-dark-mode, .app-dark-mode *));')
  })

  it('references PrimeVue-generated theme variables rather than brand reference tokens', () => {
    expect(themeCss).not.toMatch(/--brand-/)
    expect(themeCss).toContain('var(--p-surface-canvas)')
    expect(themeCss).toContain('var(--p-text-color)')
  })
})
