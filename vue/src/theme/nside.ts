import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const FOCUS_RING_COLOR = 'rgba(5, 181, 200, 0.28)'
const FOCUS_RING_SHADOW = '0 0 0 0.3rem rgba(5, 181, 200, 0.14)'
const SURFACE_BORDER = 'var(--p-border-strong)'
const SOFT_BORDER = 'var(--p-border-soft)'
const PANEL_RADIUS = 'calc(var(--p-radius-md) - 6px)'
const TABLE_RADIUS = 'calc(var(--p-radius-md) - 8px)'
const OVERLAY_SHADOW = 'var(--p-shadow-lg)'
const TABLE_HEADER_BACKGROUND =
  'linear-gradient(180deg, var(--p-gradient-panel-start) 0%, var(--p-gradient-panel-end) 100%)'
const INPUT_RADIUS = '1rem'

/**
 *
 * @param background
 * @param borderColor
 * @param color
 * @param hoverBackground
 * @param activeBackground
 */
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

/**
 *
 * @param background
 * @param borderColor
 * @param color
 */
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

/**
 *
 * @param background
 * @param borderColor
 * @param color
 * @param detailColor
 */
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
    teal: '{nsideTeal.500}',
    gold: '#bc994e',
    magenta: '#ff48a0',
    radius: {
      md: '22px',
      lg: '28px',
    },
    spacing: {
      page: 'clamp(1.2rem, 1rem + 1.1vw, 2.2rem)',
    },
    nav: {
      text: 'rgba(255, 255, 255, 0.78)',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: FOCUS_RING_COLOR,
      offset: '2px',
      shadow: FOCUS_RING_SHADOW,
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
          canvas: '#f4f7fb',
          canvasStrong: '#edf2f8',
          strong: '#f8fbff',
          elevated: '#ffffff',
          glass: 'rgba(255, 255, 255, 0.98)',
          glassStrong: 'rgba(248, 251, 255, 0.96)',
          accent: 'rgba(5, 181, 200, 0.08)',
          accentStrong: 'rgba(5, 181, 200, 0.1)',
          hover: 'rgba(5, 181, 200, 0.05)',
        },
        text: {
          color: '#182950',
          mutedColor: '#66728c',
          onDark: 'rgba(255, 255, 255, 0.94)',
          onDarkMuted: 'rgba(255, 255, 255, 0.6)',
          onDarkSoft: 'rgba(255, 255, 255, 0.45)',
          onDarkSubtle: 'rgba(255, 255, 255, 0.7)',
        },
        link: {
          color: '#0c7a97',
        },
        border: {
          color: '#d6dfef',
          strong: 'rgba(214, 223, 239, 0.95)',
          soft: 'rgba(214, 223, 239, 0.75)',
          contrast: 'rgba(255, 255, 255, 0.7)',
          contrastSoft: 'rgba(255, 255, 255, 0.1)',
        },
        gradient: {
          bodyStart: '#fbfcff',
          bodyEnd: '#edf2f8',
          panelStart: '#fbfcff',
          panelEnd: '#f4f7fb',
        },
        nav: {
          cardBg: 'rgba(255, 255, 255, 0.08)',
          cardBorder: 'rgba(255, 255, 255, 0.12)',
          cardShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          hoverBg: 'rgba(255, 255, 255, 0.08)',
          activeBg: '#ffffff',
          activeText: '#182950',
          activeShadow: '0 22px 45px -28px rgba(9, 18, 41, 0.55)',
          logoBg: '#ffffff',
          logoText: '#182950',
          sideGradientStart: '#182950',
          sideGradientEnd: '#12203d',
          sideHighlight: 'rgba(255, 72, 160, 0.12)',
          sideTopGlow: 'rgba(255, 255, 255, 0.06)',
        },
        accentChip: {
          bg: 'rgba(5, 181, 200, 0.08)',
          text: '#0c7a97',
        },
        empty: {
          bg: 'rgba(248, 251, 255, 0.9)',
          border: 'rgba(214, 223, 239, 0.95)',
          iconBg: 'rgba(5, 181, 200, 0.1)',
        },
        error: {
          border: 'rgba(255, 72, 160, 0.14)',
          bg: 'rgba(255, 72, 160, 0.06)',
          text: '#b92d72',
        },
        orb: {
          teal: 'rgba(5, 181, 200, 0.18)',
          magenta: 'rgba(255, 72, 160, 0.14)',
          gold: 'rgba(188, 153, 78, 0.12)',
        },
        shadow: {
          sm: '0 18px 42px -34px rgba(24, 41, 80, 0.4)',
          lg: '0 34px 90px -50px rgba(24, 41, 80, 0.42)',
          inset: 'inset 0 0 0 1px rgba(214, 223, 239, 0.85)',
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
          canvas: '#07101f',
          canvasStrong: '#040b16',
          strong: '#15233d',
          elevated: '#1a2a48',
          glass: 'rgba(10, 18, 32, 0.92)',
          glassStrong: 'rgba(18, 30, 53, 0.86)',
          accent: 'rgba(5, 181, 200, 0.14)',
          accentStrong: 'rgba(5, 181, 200, 0.18)',
          hover: 'rgba(5, 181, 200, 0.12)',
        },
        text: {
          color: '#e7ebf5',
          mutedColor: '#a5bedb',
          onDark: 'rgba(255, 255, 255, 0.94)',
          onDarkMuted: 'rgba(255, 255, 255, 0.6)',
          onDarkSoft: 'rgba(255, 255, 255, 0.45)',
          onDarkSubtle: 'rgba(255, 255, 255, 0.7)',
        },
        link: {
          color: '#69dceb',
        },
        border: {
          color: '#2a3d5f',
          strong: 'rgba(122, 149, 193, 0.4)',
          soft: 'rgba(122, 149, 193, 0.28)',
          contrast: 'rgba(231, 235, 245, 0.14)',
          contrastSoft: 'rgba(231, 235, 245, 0.12)',
        },
        gradient: {
          bodyStart: '#0b1426',
          bodyEnd: '#040b16',
          panelStart: '#162543',
          panelEnd: '#0f1b31',
        },
        nav: {
          cardBg: 'rgba(255, 255, 255, 0.08)',
          cardBorder: 'rgba(255, 255, 255, 0.14)',
          cardShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.16)',
          hoverBg: 'rgba(255, 255, 255, 0.08)',
          activeBg: 'rgba(231, 235, 245, 0.14)',
          activeText: '#ffffff',
          activeShadow: '0 24px 46px -32px rgba(0, 0, 0, 0.65)',
          logoBg: 'rgba(255, 255, 255, 0.94)',
          logoText: '#182950',
          sideGradientStart: '#0b1630',
          sideGradientEnd: '#081120',
          sideHighlight: 'rgba(255, 72, 160, 0.16)',
          sideTopGlow: 'rgba(255, 255, 255, 0.08)',
        },
        accentChip: {
          bg: 'rgba(5, 181, 200, 0.14)',
          text: '#86effc',
        },
        empty: {
          bg: 'rgba(21, 35, 61, 0.78)',
          border: 'rgba(122, 149, 193, 0.28)',
          iconBg: 'rgba(5, 181, 200, 0.18)',
        },
        error: {
          border: 'rgba(255, 72, 160, 0.26)',
          bg: 'rgba(255, 72, 160, 0.12)',
          text: '#ff91c2',
        },
        orb: {
          teal: 'rgba(5, 181, 200, 0.22)',
          magenta: 'rgba(255, 72, 160, 0.18)',
          gold: 'rgba(188, 153, 78, 0.18)',
        },
        shadow: {
          sm: '0 24px 56px -42px rgba(0, 0, 0, 0.75)',
          lg: '0 38px 100px -54px rgba(0, 0, 0, 0.78)',
          inset: 'inset 0 0 0 1px rgba(122, 149, 193, 0.28)',
        },
      },
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
          'var(--p-teal)',
          'var(--p-teal)',
          '#ffffff',
          'var(--p-link-color)',
          'var(--p-link-color)'
        ),
        secondary: createButtonVariant(
          'var(--p-surface-elevated)',
          SURFACE_BORDER,
          'var(--p-text-color)',
          'var(--p-surface-strong)',
          'var(--p-surface-hover)'
        ),
      },
      text: {
        secondary: {
          color: 'var(--p-text-muted-color)',
          hoverBackground: 'var(--p-surface-hover)',
          activeBackground: 'var(--p-surface-accent)',
        },
      },
      link: {
        color: 'var(--p-link-color)',
        hoverColor: 'var(--p-text-color)',
        activeColor: 'var(--p-text-color)',
      },
    },
    dialog: {
      root: {
        background: 'var(--p-surface-0)',
        borderColor: SURFACE_BORDER,
        color: 'var(--p-text-color)',
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
        background: 'var(--p-surface-0)',
        disabledBackground: 'var(--p-surface-strong)',
        filledBackground: 'var(--p-surface-strong)',
        filledHoverBackground: 'var(--p-surface-strong)',
        filledFocusBackground: 'var(--p-surface-0)',
        borderColor: SURFACE_BORDER,
        hoverBorderColor: 'var(--p-border-color)',
        focusBorderColor: 'var(--p-link-color)',
        invalidBorderColor: 'var(--p-error-border)',
        color: 'var(--p-text-color)',
        disabledColor: 'var(--p-text-muted-color)',
        placeholderColor: 'var(--p-text-muted-color)',
        invalidPlaceholderColor: 'var(--p-error-text)',
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
        background: 'var(--p-surface-elevated)',
        borderColor: SURFACE_BORDER,
        color: 'var(--p-text-color)',
        borderRadius: PANEL_RADIUS,
        shadow: OVERLAY_SHADOW,
        padding: '0.75rem',
      },
      header: {
        background: 'transparent',
        borderColor: SOFT_BORDER,
        color: 'var(--p-text-color)',
        padding: '0 0 0.75rem',
      },
      title: {
        fontWeight: '600',
        gap: '0.5rem',
      },
      dropdown: {
        background: 'var(--p-surface-strong)',
        hoverBackground: 'var(--p-surface-hover)',
        activeBackground: 'var(--p-surface-accent)',
        borderColor: SURFACE_BORDER,
        hoverBorderColor: 'var(--p-border-color)',
        activeBorderColor: 'var(--p-link-color)',
        borderRadius: INPUT_RADIUS,
        color: 'var(--p-text-color)',
      },
      inputIcon: {
        color: 'var(--p-text-muted-color)',
      },
      selectMonth: {
        hoverBackground: 'var(--p-surface-hover)',
        color: 'var(--p-text-color)',
        hoverColor: 'var(--p-text-color)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.75rem',
      },
      selectYear: {
        hoverBackground: 'var(--p-surface-hover)',
        color: 'var(--p-text-color)',
        hoverColor: 'var(--p-text-color)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.75rem',
      },
      weekDay: {
        color: 'var(--p-text-muted-color)',
        fontWeight: '600',
      },
      date: {
        hoverBackground: 'var(--p-surface-hover)',
        selectedBackground: 'var(--p-surface-accent-strong)',
        rangeSelectedBackground: 'var(--p-surface-accent)',
        color: 'var(--p-text-color)',
        hoverColor: 'var(--p-text-color)',
        selectedColor: 'var(--p-link-color)',
        rangeSelectedColor: 'var(--p-link-color)',
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
        background: 'var(--p-surface-hover)',
        color: 'var(--p-text-color)',
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
        color: 'var(--p-text-color)',
        borderWidth: '0',
      },
      headerCell: {
        background: TABLE_HEADER_BACKGROUND,
        hoverBackground: TABLE_HEADER_BACKGROUND,
        selectedBackground: TABLE_HEADER_BACKGROUND,
        borderColor: SURFACE_BORDER,
        color: 'var(--p-text-muted-color)',
        hoverColor: 'var(--p-text-color)',
        selectedColor: 'var(--p-text-color)',
        padding: '1rem',
      },
      row: {
        background: 'var(--p-surface-0)',
        hoverBackground: 'var(--p-surface-hover)',
        selectedBackground: 'var(--p-surface-accent-strong)',
        color: 'var(--p-text-color)',
        hoverColor: 'var(--p-text-color)',
        selectedColor: 'var(--p-text-color)',
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
        color: 'var(--p-text-muted-color)',
      },
      footerCell: {
        background: 'var(--p-surface-0)',
        borderColor: SOFT_BORDER,
        color: 'var(--p-text-muted-color)',
      },
      sortIcon: {
        color: 'var(--p-text-muted-color)',
        hoverColor: 'var(--p-text-color)',
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
        color: 'var(--p-text-muted-color)',
        padding: '0.875rem 1rem',
        borderRadius: TABLE_RADIUS,
      },
      navButton: {
        background: 'transparent',
        hoverBackground: 'var(--p-surface-hover)',
        selectedBackground: 'var(--p-surface-accent-strong)',
        color: 'var(--p-text-muted-color)',
        hoverColor: 'var(--p-text-color)',
        selectedColor: 'var(--p-link-color)',
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
        color: 'var(--p-text-muted-color)',
      },
    },
    panel: {
      root: {
        background: 'var(--p-surface-0)',
        borderColor: SURFACE_BORDER,
        color: 'var(--p-text-color)',
        borderRadius: PANEL_RADIUS,
      },
      header: {
        background: TABLE_HEADER_BACKGROUND,
        color: 'var(--p-text-color)',
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
        'var(--p-text-color)'
      ),
      error: createMessageTone('var(--p-error-bg)', 'var(--p-error-border)', 'var(--p-error-text)'),
      success: createMessageTone(
        'rgba(5,181,200,0.1)',
        'rgba(5,181,200,0.22)',
        'var(--p-text-color)'
      ),
      info: createMessageTone(
        'rgba(5,181,200,0.08)',
        'rgba(5,181,200,0.18)',
        'var(--p-text-color)'
      ),
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
        'var(--p-text-color)',
        'var(--p-text-muted-color)'
      ),
      error: createToastTone('var(--p-error-bg)', 'var(--p-error-border)', 'var(--p-error-text)'),
      warn: createToastTone(
        'rgba(188,153,78,0.12)',
        'rgba(188,153,78,0.26)',
        'var(--p-text-color)',
        'var(--p-text-muted-color)'
      ),
      info: createToastTone(
        'rgba(5,181,200,0.1)',
        'rgba(5,181,200,0.22)',
        'var(--p-text-color)',
        'var(--p-text-muted-color)'
      ),
    },
    menu: {
      root: {
        background: 'var(--p-surface-elevated)',
        borderColor: SURFACE_BORDER,
        color: 'var(--p-text-color)',
        borderRadius: PANEL_RADIUS,
        shadow: OVERLAY_SHADOW,
      },
      list: {
        padding: '0.5rem',
        gap: '0.25rem',
      },
      item: {
        focusBackground: 'var(--p-surface-hover)',
        color: 'var(--p-text-muted-color)',
        focusColor: 'var(--p-text-color)',
        padding: '0.75rem 0.9rem',
        borderRadius: '0.9rem',
        gap: '0.65rem',
        icon: {
          color: 'var(--p-text-muted-color)',
          focusColor: 'var(--p-text-color)',
        },
      },
      submenuLabel: {
        padding: '0.6rem 0.9rem 0.4rem',
        fontWeight: '600',
        background: 'transparent',
        color: 'var(--p-text-muted-color)',
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
        background: 'var(--p-surface-elevated)',
        checkedBackground: 'var(--p-surface-accent-strong)',
        hoverBackground: 'var(--p-surface-hover)',
        borderColor: SURFACE_BORDER,
        color: 'var(--p-text-muted-color)',
        hoverColor: 'var(--p-text-color)',
        checkedColor: 'var(--p-link-color)',
        checkedBorderColor: SURFACE_BORDER,
        disabledBackground: 'var(--p-surface-strong)',
        disabledBorderColor: SOFT_BORDER,
        disabledColor: 'var(--p-text-muted-color)',
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
        color: 'var(--p-text-muted-color)',
        hoverColor: 'var(--p-text-color)',
        checkedColor: 'var(--p-link-color)',
        disabledColor: 'var(--p-text-muted-color)',
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
        background: 'var(--p-surface-strong)',
        animationBackground:
          'linear-gradient(90deg, var(--p-surface-strong), var(--p-surface-elevated), var(--p-surface-strong))',
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
        background: 'var(--p-surface-0)',
        disabledBackground: 'var(--p-surface-strong)',
        filledBackground: 'var(--p-surface-strong)',
        filledHoverBackground: 'var(--p-surface-strong)',
        filledFocusBackground: 'var(--p-surface-0)',
        borderColor: SURFACE_BORDER,
        hoverBorderColor: 'var(--p-border-color)',
        focusBorderColor: 'var(--p-link-color)',
        invalidBorderColor: 'var(--p-error-border)',
        color: 'var(--p-text-color)',
        disabledColor: 'var(--p-text-muted-color)',
        placeholderColor: 'var(--p-text-muted-color)',
        invalidPlaceholderColor: 'var(--p-error-text)',
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
        color: 'var(--p-text-muted-color)',
      },
      overlay: {
        background: 'var(--p-surface-elevated)',
        borderColor: SURFACE_BORDER,
        borderRadius: PANEL_RADIUS,
        color: 'var(--p-text-color)',
        shadow: OVERLAY_SHADOW,
      },
      list: {
        padding: '0.5rem',
        gap: '0.2rem',
      },
      option: {
        color: 'var(--p-text-color)',
        focusBackground: 'var(--p-surface-hover)',
        focusColor: 'var(--p-text-color)',
        selectedBackground: 'var(--p-surface-accent)',
        selectedFocusBackground: 'var(--p-surface-accent-strong)',
        selectedColor: 'var(--p-link-color)',
        selectedFocusColor: 'var(--p-link-color)',
        padding: '0.75rem 0.9rem',
        borderRadius: '0.9rem',
      },
      optionGroup: {
        background: 'transparent',
        color: 'var(--p-text-muted-color)',
        fontWeight: '600',
        padding: '0.6rem 0.9rem 0.4rem',
      },
      clearIcon: {
        color: 'var(--p-text-muted-color)',
      },
      checkmark: {
        color: 'var(--p-link-color)',
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
 * @param primary Deprecated preserved argument. The selected value is ignored.
 * @returns The canonical MMS-derived N-SIDE PrimeVue preset.
 * @deprecated The `primary` argument is kept only for backward compatibility and is ignored.
 */
export const createNsideTheme = (primary: NsidePrimaryColor = 'green') => {
  return { green: nsidePreset, orange: nsidePreset, blue: nsidePreset }[primary]
}
