<template>
  <Avatar
    :image="resolvedImageUrl"
    :label="resolvedLabel"
    :aria-label="ariaLabel"
    :shape="resolvedShape"
    :class="resolvedClass"
    :style="resolvedStyle"
  />
</template>

<script setup lang="ts">
import Avatar from 'primevue/avatar'
import { computed, type StyleValue } from 'vue'

const DEFAULT_COLORS = {
  background: '#E2E8F0',
  text: '#1E293B',
}

/**
 * Props for the avatar component.
 */
export interface AvatarComponentProps {
  /** Username used to derive initials and color. */
  username: string
  /** Optional label to use instead of computed initials. */
  label?: string
  /** Optional shape override for the avatar. */
  shape?: 'circle' | 'square'
  /** Optional image URL for the avatar. */
  imageUrl?: string
  /** Optional style override for the avatar container. */
  style?: StyleValue
  /** Optional class override for the avatar container. */
  class?: string | string[] | Record<string, boolean>
}

const props = defineProps<AvatarComponentProps>()

const trimmedUsername = computed(() => props.username?.trim() ?? '')
const hasImage = computed(() => Boolean(props.imageUrl?.trim()))

const resolvedImageUrl = computed(() => (hasImage.value ? props.imageUrl?.trim() : undefined))
const resolvedLabel = computed(() => {
  if (props.label) {
    return props.label
  }

  return hasImage.value ? undefined : getInitials(trimmedUsername.value)
})
const ariaLabel = computed(() => trimmedUsername.value || 'User avatar')
const resolvedShape = computed(() => props.shape ?? 'square')
const resolvedClass = computed(() => props.class ?? 'size-10 rounded-sm text-sm font-semibold')

const avatarStyle = computed(() => {
  if (hasImage.value) {
    return {}
  }

  const colors = getColorsForName(trimmedUsername.value)
  return {
    backgroundColor: colors.background,
    color: colors.text,
  }
})
const resolvedStyle = computed(() => props.style ?? avatarStyle.value)

/**
 * Derive uppercase initials from a username for the label avatar.
 * @param name Username to turn into initials.
 * @returns Initials (or '?' when unavailable).
 */
function getInitials(name: string): string {
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return (parts[0] ?? '').slice(0, 2).toUpperCase() || '?'
  }

  const first = (parts[0] ?? '')[0] ?? ''
  const last = (parts[parts.length - 1] ?? '')[0] ?? ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || '?'
}

/**
 * Generate a deterministic background/text color pair from a username.
 * @param name Username used as the input for hashing.
 * @returns Color pair for the avatar background and text.
 */
function getColorsForName(name: string): { background: string; text: string } {
  if (!name) {
    return DEFAULT_COLORS
  }

  const hash = hashString(name)
  const hue = Math.abs(hash) % 360
  const saturation = 62
  const lightness = 55

  const rgb = hslToRgb(hue, saturation, lightness)
  const text = getAccessibleTextColor(rgb)
  const background = `hsl(${hue} ${saturation}% ${lightness}%)`

  return { background, text }
}

/**
 * Hash a string into a 32-bit integer.
 * @param value String to hash.
 * @returns Signed 32-bit hash value.
 */
function hashString(value: string): number {
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
function hslToRgb(
  hue: number,
  saturation: number,
  lightness: number
): {
  r: number
  g: number
  b: number
} {
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
 * Pick an accessible text color for the given background.
 * @param root0 RGB values for the background color.
 * @param root0.r Red channel (0-255).
 * @param root0.g Green channel (0-255).
 * @param root0.b Blue channel (0-255).
 * @returns Hex color suitable for text.
 */
function getAccessibleTextColor({ r, g, b }: { r: number; g: number; b: number }): string {
  const luminance = getRelativeLuminance(r, g, b)
  const contrastWithWhite = 1.05 / (luminance + 0.05)
  const contrastWithDark = (luminance + 0.05) / 0.05

  return contrastWithWhite >= contrastWithDark ? '#FFFFFF' : '#0F172A'
}

/**
 * Compute relative luminance for RGB channels.
 * @param r Red channel (0-255).
 * @param g Green channel (0-255).
 * @param b Blue channel (0-255).
 * @returns Relative luminance (0-1).
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (value: number) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  }

  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}
</script>
