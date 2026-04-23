<template>
  <router-link v-slot="{ isActive, isExactActive }" :to="route" @click="emitNavigationClick">
    <div class="relative" @click="emitNavigationClick">
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
        ]"
        class="flex w-full cursor-pointer items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium transition"
        @click="emitNavigationClick"
      >
        <i v-if="icon" class="pi text-base" :class="icon" />
        <span class="block truncate">{{ label }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
export interface NavigationLinkComponentProps {
  route: string
  icon?: string
  label: string
}

const { route, icon = undefined, label } = defineProps<NavigationLinkComponentProps>()
const emit = defineEmits<{
  (event: 'navigation-item-click'): void
}>()

/**
 * Emits a navigation click event so parents can react (e.g. close a mobile drawer).
 */
function emitNavigationClick() {
  emit('navigation-item-click')
}
</script>
