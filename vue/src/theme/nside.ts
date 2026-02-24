import Aura from '@primeuix/themes/aura'
import { definePreset, palette } from '@primeuix/themes'

const SCALE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
type ScaleKey = (typeof SCALE_KEYS)[number]

const mergeScale = (
  base: Record<ScaleKey, string>,
  overrides: Partial<Record<ScaleKey, string>>
) =>
  SCALE_KEYS.reduce<Record<ScaleKey, string>>(
    (acc, key) => {
      acc[key] = overrides[key] ?? base[key]
      return acc
    },
    {} as Record<ScaleKey, string>
  )

const greenPalette = mergeScale(palette('#8CBB13') as Record<ScaleKey, string>, {
  50: '#F1F6E2',
  100: '#D4E5A7',
  300: '#A9CC4E',
  500: '#8CBB13',
})

const tealPalette = mergeScale(palette('#00ACC2') as Record<ScaleKey, string>, {
  50: '#DFF5F7',
  100: '#9FE0E8',
  300: '#40C1D1',
  500: '#00ACC2',
})

const orangePalette = mergeScale(palette('#F4A74F') as Record<ScaleKey, string>, {
  50: '#FEF4E9',
  100: '#FBDEBD',
  300: '#F7BD7B',
  500: '#F4A74F',
})

const pinkPalette = mergeScale(palette('#EE4D9B') as Record<ScaleKey, string>, {
  500: '#EE4D9B',
})

const purplePalette = mergeScale(palette('#807FBD') as Record<ScaleKey, string>, {
  500: '#807FBD',
})

const surfaceLightBase = mergeScale(palette('#535F6B') as Record<ScaleKey, string>, {
  50: '#F7F7F7',
  100: '#F0F0F0',
  200: '#EAEBEC',
  300: '#BFC3C7',
})

const surfaceLight = {
  0: '#FFFFFF',
  ...surfaceLightBase,
}

const surfaceDark = {
  0: '#E7EBF5',
  ...mergeScale(palette('#162950') as Record<ScaleKey, string>, {}),
}

export const NsideTheme = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '3px',
      sm: '6px',
      md: '8px',
      lg: '10px',
      xl: '14px',
    },
    green: greenPalette,
    teal: tealPalette,
    cyan: tealPalette,
    blue: tealPalette,
    sky: tealPalette,
    yellow: orangePalette,
    orange: orangePalette,
    red: pinkPalette,
    pink: pinkPalette,
    purple: purplePalette,
  },
  css: `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

:root,
:host {
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  --nside-gradient-teal-purple: linear-gradient(135deg, #00ACC2 0%, #807FBD 100%);
  --nside-gradient-orange-pink: linear-gradient(135deg, #F4A74F 0%, #EE4D9B 100%);
  --nside-gradient-green-blue: linear-gradient(135deg, #8CBB13 0%, #71CFEC 100%);
}
`,
  semantic: {
    primary: palette('{green}'),
    colorScheme: {
      light: {
        surface: surfaceLight,
        text: {
          color: '#535F6B',
          hoverColor: '#162950',
          mutedColor: '#66728C',
          hoverMutedColor: '#535F6B',
        },
      },
      dark: {
        surface: surfaceDark,
        text: {
          color: '#E7EBF5',
          hoverColor: '#FFFFFF',
          mutedColor: '#A5BEDB',
          hoverMutedColor: '#E7EBF5',
        },
      },
    },
  },
})

export default NsideTheme
