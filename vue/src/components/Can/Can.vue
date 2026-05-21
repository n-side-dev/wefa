<template>
  <slot v-if="allowed" :allowed="allowed" />
  <slot v-else-if="$slots.fallback" name="fallback" :allowed="allowed" />
</template>

<script setup lang="ts">
import { usePermission, type PermissionMatchMode } from '@/composables/usePermission'

export interface CanProps {
  /**
   * Permission string, or array of strings, required to render the default slot.
   * An empty array is treated as trivially allowed.
   */
  permission: string | readonly string[]
  /**
   * Match mode applied when `permission` is an array.
   * `'all'` (default) requires every listed permission; `'any'` requires one.
   */
  mode?: PermissionMatchMode
}

const { permission, mode = 'all' } = defineProps<CanProps>()

const allowed = usePermission(() => permission, { mode })
</script>
