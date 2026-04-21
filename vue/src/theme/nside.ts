import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const TABLE_HEADER_BACKGROUND =
  'linear-gradient(180deg, var(--brand-panel-gradient-start) 0%, var(--brand-panel-gradient-end) 100%)'
const FOCUS_RING_COLOR = 'rgba(5, 181, 200, 0.28)'
const FOCUS_RING_SHADOW = '0 0 0 0.3rem rgba(5, 181, 200, 0.14)'
const SURFACE_BORDER = 'var(--brand-border-strong)'
const SOFT_BORDER = 'var(--brand-border-soft)'
const PANEL_RADIUS = 'calc(var(--brand-radius-md) - 6px)'
const TABLE_RADIUS = 'calc(var(--brand-radius-md) - 8px)'
const OVERLAY_SHADOW = 'var(--brand-shadow-lg)'
const INPUT_RADIUS = '1rem'

function createButtonVariant(
  background: string,
  borderColor: string,
  color: string,
  hoverBackground = background,
  activeBackground = hoverBackground
) {
  return {
    background,
    hoverBackground,
    activeBackground,
    borderColor,
    hoverBorderColor: borderColor,
    activeBorderColor: borderColor,
    color,
    hoverColor: color,
    activeColor: color,
    focusRing: {
      color: FOCUS_RING_COLOR,
      shadow: FOCUS_RING_SHADOW,
    },
  }
}

function createMessageTone(background: string, borderColor: string, color: string) {
  return {
    background,
    borderColor,
    color,
    shadow: 'none',
    outlined: {
      color,
      borderColor,
    },
    simple: {
      color,
    },
  }
}

function createToastTone(
  background: string,
  borderColor: string,
  color: string,
  detailColor = color
) {
  return {
    background,
    borderColor,
    color,
    detailColor,
    shadow: 'none',
    closeButton: {
      hoverBackground: 'transparent',
      focusRing: {
        color: FOCUS_RING_COLOR,
        shadow: FOCUS_RING_SHADOW,
      },
    },
  }
}

export const nsidePreset = definePreset(Aura, {
  primitive: {
    nside: {
      50: '#f5f8fc',
      100: '#edf2f8',
      200: '#d9e2f0',
      300: '#bcc5da',
      400: '#858fa7',
      500: '#66728c',
      600: '#485267',
      700: '#2d3b59',
      800: '#182950',
      900: '#101c37',
      950: '#0a1329',
    },
    nsideTeal: {
      50: '#effcff',
      100: '#d7fbff',
      200: '#adf3fb',
      300: '#73e6f2',
      400: '#36d0df',
      500: '#05b5c8',
      600: '#0c8ca0',
      700: '#0f6c7f',
      800: '#134c5c',
      900: '#123340',
      950: '#0a1f29',
    },
  },
  semantic: {
    primary: {
      50: '{nsideTeal.50}',
      100: '{nsideTeal.100}',
      200: '{nsideTeal.200}',
      300: '{nsideTeal.300}',
      400: '{nsideTeal.400}',
      500: '{nsideTeal.500}',
      600: '{nsideTeal.600}',
      700: '{nsideTeal.700}',
      800: '{nsideTeal.800}',
      900: '{nsideTeal.900}',
      950: '{nsideTeal.950}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{nside.50}',
          100: '{nside.100}',
          200: '{nside.200}',
          300: '{nside.300}',
          400: '{nside.400}',
          500: '{nside.500}',
          600: '{nside.600}',
          700: '{nside.700}',
          800: '{nside.800}',
          900: '{nside.900}',
          950: '{nside.950}',
        },
      },
      dark: {
        surface: {
          0: '#0f1b31',
          50: '#15233d',
          100: '#1a2a48',
          200: '#203156',
          300: '#2a3d67',
          400: '#3d557f',
          500: '#5f779d',
          600: '#89a4c7',
          700: '#a5bedb',
          800: '#c9d8eb',
          900: '#e7ebf5',
          950: '#f7f9fc',
        },
      },
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: FOCUS_RING_COLOR,
      offset: '2px',
      shadow: FOCUS_RING_SHADOW,
    },
  },
  components: {
    button: {
      root: {
        borderRadius: INPUT_RADIUS,
        gap: '0.5rem',
        paddingX: '1rem',
        paddingY: '0.75rem',
        transitionDuration: '160ms',
        label: {
          fontWeight: '600',
        },
        primary: createButtonVariant(
          'var(--brand-teal)',
          'var(--brand-teal)',
          '#ffffff',
          'var(--brand-link)',
          'var(--brand-link)'
        ),
        secondary: createButtonVariant(
          'var(--brand-surface-elevated)',
          SURFACE_BORDER,
          'var(--brand-text)',
          'var(--brand-surface-strong)',
          'var(--brand-surface-hover)'
        ),
      },
      text: {
        secondary: {
          color: 'var(--brand-text-muted)',
          hoverBackground: 'var(--brand-surface-hover)',
          activeBackground: 'var(--brand-surface-accent)',
        },
      },
      link: {
        color: 'var(--brand-link)',
        hoverColor: 'var(--brand-text)',
        activeColor: 'var(--brand-text)',
      },
    },
    dialog: {
      root: {
        background: 'var(--brand-surface)',
        borderColor: SURFACE_BORDER,
        color: 'var(--brand-text)',
        borderRadius: '1.5rem',
        shadow: OVERLAY_SHADOW,
      },
      header: {
        padding: '1.5rem 1.5rem 0',
        gap: '0.75rem',
      },
      title: {
        fontSize: '1rem',
        fontWeight: '600',
      },
      content: {
        padding: '1.5rem',
      },
    },
    inputtext: {
      root: {
        background: 'var(--brand-surface)',
        disabledBackground: 'var(--brand-surface-strong)',
        filledBackground: 'var(--brand-surface-strong)',
        filledHoverBackground: 'var(--brand-surface-strong)',
        filledFocusBackground: 'var(--brand-surface)',
        borderColor: SURFACE_BORDER,
        hoverBorderColor: 'var(--brand-border)',
        focusBorderColor: 'var(--brand-link)',
        invalidBorderColor: 'var(--brand-error-border)',
        color: 'var(--brand-text)',
        disabledColor: 'var(--brand-text-muted)',
        placeholderColor: 'var(--brand-text-muted)',
        invalidPlaceholderColor: 'var(--brand-error-text)',
        shadow: 'none',
        paddingX: '0.95rem',
        paddingY: '0.8rem',
        borderRadius: INPUT_RADIUS,
        focusRing: {
          width: '2px',
          style: 'solid',
          color: FOCUS_RING_COLOR,
          offset: '2px',
          shadow: FOCUS_RING_SHADOW,
        },
      },
    },
    datepicker: {
      panel: {
        background: 'var(--brand-surface-elevated)',
        borderColor: SURFACE_BORDER,
        color: 'var(--brand-text)',
        borderRadius: PANEL_RADIUS,
        shadow: OVERLAY_SHADOW,
        padding: '0.75rem',
      },
      header: {
        background: 'transparent',
        borderColor: SOFT_BORDER,
        color: 'var(--brand-text)',
        padding: '0 0 0.75rem',
      },
      title: {
        fontWeight: '600',
        gap: '0.5rem',
      },
      dropdown: {
        background: 'var(--brand-surface-strong)',
        hoverBackground: 'var(--brand-surface-hover)',
        activeBackground: 'var(--brand-surface-accent)',
        borderColor: SURFACE_BORDER,
        hoverBorderColor: 'var(--brand-border)',
        activeBorderColor: 'var(--brand-link)',
        borderRadius: INPUT_RADIUS,
        color: 'var(--brand-text)',
      },
      inputIcon: {
        color: 'var(--brand-text-muted)',
      },
      selectMonth: {
        hoverBackground: 'var(--brand-surface-hover)',
        color: 'var(--brand-text)',
        hoverColor: 'var(--brand-text)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.75rem',
      },
      selectYear: {
        hoverBackground: 'var(--brand-surface-hover)',
        color: 'var(--brand-text)',
        hoverColor: 'var(--brand-text)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.75rem',
      },
      weekDay: {
        color: 'var(--brand-text-muted)',
        fontWeight: '600',
      },
      date: {
        hoverBackground: 'var(--brand-surface-hover)',
        selectedBackground: 'var(--brand-surface-accent-strong)',
        rangeSelectedBackground: 'var(--brand-surface-accent)',
        color: 'var(--brand-text)',
        hoverColor: 'var(--brand-text)',
        selectedColor: 'var(--brand-link)',
        rangeSelectedColor: 'var(--brand-link)',
        borderRadius: '999px',
        focusRing: {
          width: '2px',
          style: 'solid',
          color: FOCUS_RING_COLOR,
          offset: '1px',
          shadow: FOCUS_RING_SHADOW,
        },
      },
      buttonbar: {
        padding: '0.75rem 0 0',
        borderColor: SOFT_BORDER,
      },
      timePicker: {
        padding: '0.75rem 0 0',
        borderColor: SOFT_BORDER,
      },
      today: {
        background: 'var(--brand-surface-hover)',
        color: 'var(--brand-text)',
      },
    },
    datatable: {
      root: {
        borderColor: SURFACE_BORDER,
        transitionDuration: '160ms',
      },
      header: {
        background: 'transparent',
        borderColor: SOFT_BORDER,
        color: 'var(--brand-text)',
        borderWidth: '0',
      },
      headerCell: {
        background: TABLE_HEADER_BACKGROUND,
        hoverBackground: TABLE_HEADER_BACKGROUND,
        selectedBackground: TABLE_HEADER_BACKGROUND,
        borderColor: SURFACE_BORDER,
        color: 'var(--brand-text-muted)',
        hoverColor: 'var(--brand-text)',
        selectedColor: 'var(--brand-text)',
        padding: '1rem',
      },
      row: {
        background: 'var(--brand-surface)',
        hoverBackground: 'var(--brand-surface-hover)',
        selectedBackground: 'var(--brand-surface-accent-strong)',
        color: 'var(--brand-text)',
        hoverColor: 'var(--brand-text)',
        selectedColor: 'var(--brand-text)',
      },
      colorScheme: {
        light: {
          row: {
            stripedBackground: '{surface.50}',
          },
        },
        dark: {
          row: {
            stripedBackground: '{surface.50}',
          },
        },
      },
      bodyCell: {
        borderColor: SOFT_BORDER,
        padding: '1rem',
        selectedBorderColor: SURFACE_BORDER,
      },
      footer: {
        background: 'transparent',
        borderColor: SOFT_BORDER,
        color: 'var(--brand-text-muted)',
      },
      footerCell: {
        background: 'var(--brand-surface)',
        borderColor: SOFT_BORDER,
        color: 'var(--brand-text-muted)',
      },
      sortIcon: {
        color: 'var(--brand-text-muted)',
        hoverColor: 'var(--brand-text)',
      },
      paginatorTop: {
        borderColor: SOFT_BORDER,
      },
      paginatorBottom: {
        borderColor: SOFT_BORDER,
      },
    },
    paginator: {
      root: {
        background: 'transparent',
        color: 'var(--brand-text-muted)',
        padding: '0.875rem 1rem',
        borderRadius: TABLE_RADIUS,
      },
      navButton: {
        background: 'transparent',
        hoverBackground: 'var(--brand-surface-hover)',
        selectedBackground: 'var(--brand-surface-accent-strong)',
        color: 'var(--brand-text-muted)',
        hoverColor: 'var(--brand-text)',
        selectedColor: 'var(--brand-link)',
        borderRadius: '999px',
        focusRing: {
          width: '2px',
          style: 'solid',
          color: FOCUS_RING_COLOR,
          offset: '2px',
          shadow: FOCUS_RING_SHADOW,
        },
      },
      currentPageReport: {
        color: 'var(--brand-text-muted)',
      },
    },
    panel: {
      root: {
        background: 'var(--brand-surface)',
        borderColor: SURFACE_BORDER,
        color: 'var(--brand-text)',
        borderRadius: PANEL_RADIUS,
      },
      header: {
        background: TABLE_HEADER_BACKGROUND,
        color: 'var(--brand-text)',
        padding: '1rem 1.15rem',
        borderColor: SURFACE_BORDER,
        borderWidth: '0',
        borderRadius: PANEL_RADIUS,
      },
      title: {
        fontWeight: '600',
      },
      content: {
        padding: '1.15rem',
      },
    },
    message: {
      root: {
        borderRadius: INPUT_RADIUS,
        borderWidth: '1px',
      },
      content: {
        padding: '0.85rem 1rem',
        gap: '0.5rem',
      },
      text: {
        fontSize: '0.95rem',
        fontWeight: '500',
      },
      warn: createMessageTone(
        'rgba(188,153,78,0.12)',
        'rgba(188,153,78,0.26)',
        'var(--brand-text)'
      ),
      error: createMessageTone(
        'var(--brand-error-bg)',
        'var(--brand-error-border)',
        'var(--brand-error-text)'
      ),
      success: createMessageTone(
        'rgba(5,181,200,0.1)',
        'rgba(5,181,200,0.22)',
        'var(--brand-text)'
      ),
      info: createMessageTone('rgba(5,181,200,0.08)', 'rgba(5,181,200,0.18)', 'var(--brand-text)'),
    },
    toast: {
      root: {
        borderRadius: INPUT_RADIUS,
        borderWidth: '1px',
        blur: '12px',
      },
      content: {
        padding: '1rem 1.1rem',
        gap: '0.65rem',
      },
      summary: {
        fontWeight: '600',
        fontSize: '0.95rem',
      },
      detail: {
        fontSize: '0.9rem',
        fontWeight: '500',
      },
      success: createToastTone(
        'rgba(5,181,200,0.12)',
        'rgba(5,181,200,0.24)',
        'var(--brand-text)',
        'var(--brand-text-muted)'
      ),
      error: createToastTone(
        'var(--brand-error-bg)',
        'var(--brand-error-border)',
        'var(--brand-error-text)'
      ),
      warn: createToastTone(
        'rgba(188,153,78,0.12)',
        'rgba(188,153,78,0.26)',
        'var(--brand-text)',
        'var(--brand-text-muted)'
      ),
      info: createToastTone(
        'rgba(5,181,200,0.1)',
        'rgba(5,181,200,0.22)',
        'var(--brand-text)',
        'var(--brand-text-muted)'
      ),
    },
    menu: {
      root: {
        background: 'var(--brand-surface-elevated)',
        borderColor: SURFACE_BORDER,
        color: 'var(--brand-text)',
        borderRadius: PANEL_RADIUS,
        shadow: OVERLAY_SHADOW,
      },
      list: {
        padding: '0.5rem',
        gap: '0.25rem',
      },
      item: {
        focusBackground: 'var(--brand-surface-hover)',
        color: 'var(--brand-text-muted)',
        focusColor: 'var(--brand-text)',
        padding: '0.75rem 0.9rem',
        borderRadius: '0.9rem',
        gap: '0.65rem',
        icon: {
          color: 'var(--brand-text-muted)',
          focusColor: 'var(--brand-text)',
        },
      },
      submenuLabel: {
        padding: '0.6rem 0.9rem 0.4rem',
        fontWeight: '600',
        background: 'transparent',
        color: 'var(--brand-text-muted)',
      },
      separator: {
        borderColor: SOFT_BORDER,
      },
    },
    togglebutton: {
      root: {
        padding: '0.25rem',
        borderRadius: INPUT_RADIUS,
        gap: '0.5rem',
        fontWeight: '600',
        background: 'var(--brand-surface-elevated)',
        checkedBackground: 'var(--brand-surface-accent-strong)',
        hoverBackground: 'var(--brand-surface-hover)',
        borderColor: SURFACE_BORDER,
        color: 'var(--brand-text-muted)',
        hoverColor: 'var(--brand-text)',
        checkedColor: 'var(--brand-link)',
        checkedBorderColor: SURFACE_BORDER,
        disabledBackground: 'var(--brand-surface-strong)',
        disabledBorderColor: SOFT_BORDER,
        disabledColor: 'var(--brand-text-muted)',
        focusRing: {
          width: '2px',
          style: 'solid',
          color: FOCUS_RING_COLOR,
          offset: '2px',
          shadow: FOCUS_RING_SHADOW,
        },
      },
      content: {
        padding: '0.55rem 0.9rem',
        borderRadius: '0.8rem',
        checkedShadow: 'none',
      },
      icon: {
        color: 'var(--brand-text-muted)',
        hoverColor: 'var(--brand-text)',
        checkedColor: 'var(--brand-link)',
        disabledColor: 'var(--brand-text-muted)',
      },
    },
    divider: {
      root: {
        borderColor: SOFT_BORDER,
      },
      horizontal: {
        margin: '0',
      },
    },
    skeleton: {
      root: {
        borderRadius: '0.75rem',
        background: 'var(--brand-surface-strong)',
        animationBackground:
          'linear-gradient(90deg, var(--brand-surface-strong), var(--brand-surface-elevated), var(--brand-surface-strong))',
      },
    },
    avatar: {
      root: {
        borderRadius: '1rem',
        fontSize: '0.875rem',
      },
    },
    select: {
      root: {
        background: 'var(--brand-surface)',
        disabledBackground: 'var(--brand-surface-strong)',
        filledBackground: 'var(--brand-surface-strong)',
        filledHoverBackground: 'var(--brand-surface-strong)',
        filledFocusBackground: 'var(--brand-surface)',
        borderColor: SURFACE_BORDER,
        hoverBorderColor: 'var(--brand-border)',
        focusBorderColor: 'var(--brand-link)',
        invalidBorderColor: 'var(--brand-error-border)',
        color: 'var(--brand-text)',
        disabledColor: 'var(--brand-text-muted)',
        placeholderColor: 'var(--brand-text-muted)',
        invalidPlaceholderColor: 'var(--brand-error-text)',
        shadow: 'none',
        paddingX: '0.95rem',
        paddingY: '0.8rem',
        borderRadius: INPUT_RADIUS,
        focusRing: {
          width: '2px',
          style: 'solid',
          color: FOCUS_RING_COLOR,
          offset: '2px',
          shadow: FOCUS_RING_SHADOW,
        },
      },
      dropdown: {
        color: 'var(--brand-text-muted)',
      },
      overlay: {
        background: 'var(--brand-surface-elevated)',
        borderColor: SURFACE_BORDER,
        borderRadius: PANEL_RADIUS,
        color: 'var(--brand-text)',
        shadow: OVERLAY_SHADOW,
      },
      list: {
        padding: '0.5rem',
        gap: '0.2rem',
      },
      option: {
        color: 'var(--brand-text)',
        focusBackground: 'var(--brand-surface-hover)',
        focusColor: 'var(--brand-text)',
        selectedBackground: 'var(--brand-surface-accent)',
        selectedFocusBackground: 'var(--brand-surface-accent-strong)',
        selectedColor: 'var(--brand-link)',
        selectedFocusColor: 'var(--brand-link)',
        padding: '0.75rem 0.9rem',
        borderRadius: '0.9rem',
      },
      optionGroup: {
        background: 'transparent',
        color: 'var(--brand-text-muted)',
        fontWeight: '600',
        padding: '0.6rem 0.9rem 0.4rem',
      },
      clearIcon: {
        color: 'var(--brand-text-muted)',
      },
      checkmark: {
        color: 'var(--brand-link)',
      },
      emptyMessage: {
        padding: '0.75rem 0.9rem',
      },
    },
  },
})

export const nsideThemeOptions = {
  darkModeSelector: '.app-dark-mode',
} as const

export const nsidePrimeVueTheme = {
  preset: nsidePreset,
  options: nsideThemeOptions,
} as const

/**
 * @deprecated The `primary` argument is ignored. The flagship MMS-derived N-SIDE theme
 * is now the single canonical preset output.
 */
export type NsidePrimaryColor = 'green' | 'orange' | 'blue'

/**
 * Returns the canonical MMS-derived N-SIDE PrimeVue preset.
 *
 * @param primary Deprecated preserved argument. The selected value is ignored.
 * @returns The canonical MMS-derived N-SIDE PrimeVue preset.
 * @deprecated The `primary` argument is kept only for backward compatibility and is ignored.
 */
export const createNsideTheme = (primary: NsidePrimaryColor = 'green') => {
  return { green: nsidePreset, orange: nsidePreset, blue: nsidePreset }[primary]
}
