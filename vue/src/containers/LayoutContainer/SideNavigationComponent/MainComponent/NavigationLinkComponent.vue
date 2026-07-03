<template>
  <router-link
    v-slot="{ isActive, isExactActive }"
    :to="route"
    :aria-label="collapsed ? label : undefined"
    @click="emitNavigationClick"
  >
    <div
      v-tooltip.right="collapsed ? label : undefined"
      class="relative"
      @click="emitNavigationClick"
    >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-x-1"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-1"
      >
        <span
          v-if="isActive || isExactActive"
          class="absolute inset-y-2 left-0 w-1 rounded-full bg-(--p-teal) shadow-[0_0_18px_rgba(5,181,200,0.55)]"
        />
      </Transition>
      <div
        :class="[
          isActive || isExactActive
            ? 'bg-(--p-nav-active-bg) text-(--p-nav-active-text) shadow-(--p-nav-active-shadow)'
            : 'text-(--p-nav-text) hover:bg-(--p-nav-hover-bg) hover:text-(--p-text-on-dark)',
          collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
        ]"
        class="flex w-full cursor-pointer items-center rounded-[1.1rem] text-sm font-medium transition"
        @click="emitNavigationClick"
      >
        <i v-if="icon" class="pi text-base" :class="icon" />
        <span
          v-else
          class="inline-flex size-5 shrink-0 items-center justify-center text-sm font-semibold tracking-tight uppercase leading-none"
          aria-hidden="true"
        >
          {{ labelInitial }}
        </span>
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-x-1"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <span v-if="!collapsed" class="block truncate">{{ label }}</span>
        </Transition>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tooltip from 'primevue/tooltip'

export interface NavigationLinkComponentProps {
  route: string
  icon?: string
  label: string
  collapsed?: boolean
}

const {
  route,
  icon = undefined,
  label,
  collapsed = false,
} = defineProps<NavigationLinkComponentProps>()
const emit = defineEmits<{
  (event: 'navigation-item-click'): void
}>()

const vTooltip = Tooltip

const labelInitial = computed(() => {
  const trimmed = label.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
})

/**
 * Emits a navigation click event so parents can react (e.g. close a mobile drawer).
 */
function emitNavigationClick() {
  emit('navigation-item-click')
}
</script>
