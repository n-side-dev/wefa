export interface RGBColor {
  r: number
  g: number
  b: number
}

/**
 * Hash a string into a 32-bit integer.
 * @param value String to hash.
 * @returns Signed 32-bit hash value.
 */
export function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return hash
}

/**
 * Convert HSL values to RGB for contrast calculations.
 * @param hue Hue in degrees.
 * @param saturation Saturation percentage.
 * @param lightness Lightness percentage.
 * @returns RGB channel values (0-255).
 */
export function hslToRgb(hue: number, saturation: number, lightness: number): RGBColor {
  const normalizedHue = ((hue % 360) + 360) % 360
  const h = normalizedHue / 60
  const s = saturation / 100
  const l = lightness / 100
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const second = chroma * (1 - Math.abs((h % 2) - 1))

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (h >= 0 && h < 1) {
    r1 = chroma
    g1 = second
  } else if (h >= 1 && h < 2) {
    r1 = second
    g1 = chroma
  } else if (h >= 2 && h < 3) {
    g1 = chroma
    b1 = second
  } else if (h >= 3 && h < 4) {
    g1 = second
    b1 = chroma
  } else if (h >= 4 && h < 5) {
    r1 = second
    b1 = chroma
  } else if (h >= 5 && h < 6) {
    r1 = chroma
    b1 = second
  }

  const match = l - chroma / 2

  return {
    r: Math.round((r1 + match) * 255),
    g: Math.round((g1 + match) * 255),
    b: Math.round((b1 + match) * 255),
  }
}

/**
 * Compute relative luminance for RGB channels.
 * @param r Red channel (0-255).
 * @param g Green channel (0-255).
 * @param b Blue channel (0-255).
 * @returns Relative luminance (0-1).
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (value: number) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  }

  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/**
 * Pick an accessible text color for the given background.
 * @param color RGB values for the background color.
 * @returns Hex color suitable for text.
 */
export function getAccessibleTextColor(color: RGBColor): string {
  const luminance = getRelativeLuminance(color.r, color.g, color.b)
  const contrastWithWhite = 1.05 / (luminance + 0.05)
  const contrastWithDark = (luminance + 0.05) / 0.05

  return contrastWithWhite >= contrastWithDark ? '#FFFFFF' : '#0F172A'
}
