<template>
  <router-link v-slot="{ isActive, isExactActive }" :to="route" @click="emitNavigationClick">
    <div class="relative" @click="emitNavigationClick">
      <Transition
        enter-active-class="transition opacity-0 scale-y-75 duration-200 ease-out"
        enter-to-class="opacity-100 scale-y-100"
        leave-active-class="transition opacity-100 scale-y-100 duration-200 ease-in"
        leave-to-class="opacity-0 scale-y-75"
      >
        <span
          v-if="isActive || isExactActive"
          class="absolute inset-y-2 -left-4 rounded-full bg-zinc-950 w-1"
        ></span>
      </Transition>
      <div
        :class="[isExactActive ? 'bg-zinc-500/5' : '']"
        class="flex w-full items-center rounded-lg cursor-pointer text-base px-2 py-2 gap-3 hover:bg-zinc-950/5"
        @click="emitNavigationClick"
      >
        <i v-if="icon" class="pi" :class="icon" style="font-size: 1.5rem"></i>
        <span class="block truncate text-zinc-950">{{ label }}</span>
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

const { route, icon, label } = defineProps<NavigationLinkComponentProps>()
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
