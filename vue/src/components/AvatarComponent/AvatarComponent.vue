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
import { useI18nLib } from '@/locales'
import { getAccessibleTextColor, hashString, hslToRgb } from '@/utils/color'

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
const { t } = useI18nLib()

const trimmedUsername = computed(() => props.username?.trim() ?? '')
const hasImage = computed(() => Boolean(props.imageUrl?.trim()))

const ariaLabel = computed(() => trimmedUsername.value || t('avatar.user_avatar'))

const resolvedImageUrl = computed(() => (hasImage.value ? props.imageUrl?.trim() : undefined))
const resolvedLabel = computed(() => {
  if (props.label) {
    return props.label
  }

  return hasImage.value ? undefined : getInitials(trimmedUsername.value)
})
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
</script>
