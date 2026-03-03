<template>
  <div>
    <button
      type="button"
      :class="triggerClass"
      :aria-label="`Open user menu for ${username}`"
      @click="toggleUserMenu"
    >
      <AvatarComponent class="shrink-0" :username="username" />

      <span v-if="mode === 'detailed'" class="grow truncate text-left">
        <span class="block truncate text-sm/5 font-medium text-zinc-950">
          {{ username }}
        </span>
        <span class="block truncate text-sm/5 font-normal text-zinc-500">
          {{ email }}
        </span>
      </span>
      <i v-if="mode === 'detailed'" class="pi pi-chevron-up text-lg text-zinc-500"></i>
    </button>

    <Menu ref="user-menu" :model="userMenuItems" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { computed, ref, useTemplateRef } from 'vue'
import AvatarComponent from '@/components/AvatarComponent/AvatarComponent.vue'

export interface UserMenuTriggerComponentProps {
  username: string
  email?: string
  mode?: 'compact' | 'detailed'
}

const { username, email = '', mode = 'detailed' } = defineProps<UserMenuTriggerComponentProps>()

const userMenu = useTemplateRef('user-menu')

const userMenuItems = ref<MenuItem[]>([
  {
    label: 'Profile',
    items: [
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {},
      },
    ],
  },
])

const triggerClass = computed(() => {
  if (mode === 'compact') {
    return [
      'inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors',
      'hover:bg-zinc-950/5',
    ]
  }

  return [
    'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors',
    'hover:bg-zinc-950/5',
  ]
})

/**
 * Opens or closes the user dropdown menu.
 * @param event Click event from the trigger element
 */
function toggleUserMenu(event: Event) {
  userMenu.value?.toggle(event)
}
</script>
