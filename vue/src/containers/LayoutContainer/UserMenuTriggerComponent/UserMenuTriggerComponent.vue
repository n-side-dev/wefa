<template>
  <div>
    <button
      type="button"
      :class="triggerClass"
      :aria-label="t('navigation.open_user_menu_for', { username })"
      @click="toggleUserMenu"
    >
      <AvatarComponent class="shrink-0" :username="username" />

      <span v-if="mode === 'detailed'" class="grow truncate text-left">
        <span class="block truncate text-sm/5 font-medium text-(--p-text-on-dark)">
          {{ username }}
        </span>
        <span class="block truncate text-sm/5 font-normal text-(--p-text-on-dark-muted)">
          {{ email }}
        </span>
      </span>
      <i
        v-if="mode === 'detailed'"
        class="pi pi-chevron-up text-lg text-(--p-text-on-dark-subtle)"
      ></i>
    </button>

    <Menu ref="user-menu" :model="userMenuItems" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { computed, type ComputedRef, useTemplateRef } from 'vue'
import AvatarComponent from '@/components/AvatarComponent/AvatarComponent.vue'
import { useI18nLib } from '@/locales'

export interface UserMenuTriggerComponentProps {
  username: string
  email?: string
  mode?: 'compact' | 'detailed'
}

const { username, email = '', mode = 'detailed' } = defineProps<UserMenuTriggerComponentProps>()
const { t } = useI18nLib()

const userMenu = useTemplateRef('user-menu')

const triggerClass = computed(() => {
  if (mode === 'compact') {
    return [
      'inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors',
      'hover:bg-(--p-nav-hover-bg)',
    ]
  }

  return [
    'flex w-full cursor-pointer items-center gap-3 rounded-[1.25rem] border border-(--p-nav-card-border) bg-(--p-nav-card-bg) px-3 py-3 text-(--p-text-on-dark) transition',
    'hover:bg-(--p-nav-hover-bg)',
  ]
})

/**
 * Opens or closes the user dropdown menu.
 * @param event Click event from the trigger element
 */
function toggleUserMenu(event: Event) {
  userMenu.value?.toggle(event)
}

const userMenuItems: ComputedRef<MenuItem[]> = computed(() => {
  return [
    {
      label: t('navigation.profile'),
      items: [
        {
          label: t('navigation.logout'),
          icon: 'pi pi-sign-out',
          command: () => {},
        },
      ],
    },
  ]
})
</script>
