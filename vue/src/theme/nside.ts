import Aura from '@primeuix/themes/aura'
import { definePreset, palette } from '@primeuix/themes'

const SCALE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
type ScaleKey = (typeof SCALE_KEYS)[number]

// Ensures a full Tailwind-like scale (50–950) by overlaying explicit brand steps
// on top of a generated palette while keeping every scale key present.
const mergeScale = (base: Record<ScaleKey, string>, overrides: Partial<Record<ScaleKey, string>>) =>
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
  300: '#B7D46C',
  500: '#8CBB13',
  700: '#70A100',
  900: '#0A3B00',
})

const tealPalette = mergeScale(palette('#00ACC2') as Record<ScaleKey, string>, {
  50: '#DFF5F7',
  100: '#9FE0E8',
  300: '#40C1D1',
  500: '#00ACC2',
  700: '#0090A7',
  900: '#002A41',
})

const orangePalette = mergeScale(palette('#F4A74F') as Record<ScaleKey, string>, {
  50: '#FEF4E9',
  100: '#FBDEBD',
  300: '#F7BD7B',
  500: '#F4A74F',
  700: '#D48C37',
  900: '#752800',
})

const pinkPalette = mergeScale(palette('#D63487') as Record<ScaleKey, string>, {
  50: '#FAE6F0',
  100: '#F0B3D2',
  300: '#E067A5',
  500: '#D63487',
  700: '#B80870',
  900: '#570008',
})

const purplePalette = mergeScale(palette('#A83A8D') as Record<ScaleKey, string>, {
  50: '#F4E6F1',
  100: '#DEB5D4',
  300: '#BE6BAA',
  500: '#A83A8D',
  700: '#8A1B73',
  900: '#8A1B73',
})

const redPalette = mergeScale(palette('#C6243D') as Record<ScaleKey, string>, {
  50: '#F8E4E7',
  100: '#EAADB6',
  300: '#D45B6E',
  500: '#C6243D',
  700: '#A50027',
  900: '#600000',
})

const grayPalette = mergeScale(palette('#535F6B') as Record<ScaleKey, string>, {
  50: '#FAFCFE',
  100: '#F8F9FA',
  200: '#E9ECEF',
  300: '#DEE2E6',
  400: '#CED4DA',
  500: '#ADB5BD',
  600: '#868E96',
  700: '#495057',
  800: '#343A40',
  900: '#212529',
})

const surfaceLightBase = grayPalette

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
    red: redPalette,
    pink: pinkPalette,
    purple: purplePalette,
    gray: grayPalette,
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
