<template>
  <div class="border-b border-(--p-border-contrast-soft) p-4 lg:p-6">
    <div
      class="flex items-start gap-4 rounded-[1.5rem] border border-(--p-nav-card-border) bg-(--p-nav-card-bg) px-4 py-4 text-(--p-text-on-dark) shadow-(--p-nav-card-shadow) backdrop-blur-sm"
    >
      <template v-if="projectLogo">
        <span
          class="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-(--p-nav-logo-bg)"
        >
          <img
            :src="projectLogo"
            :alt="projectLogoAlt || projectTitle"
            class="h-8 w-auto max-w-full object-contain"
            data-test="project-logo"
          />
        </span>
      </template>
      <template v-else>
        <span
          class="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--p-nav-logo-bg) text-base font-semibold tracking-[0.22em] text-(--p-nav-logo-text)"
        >
          {{ projectAvatarLabel }}
        </span>
      </template>
      <span class="min-w-0 grow">
        <span
          class="block text-[0.7rem] font-medium uppercase tracking-[0.32em] text-(--p-text-on-dark-muted)"
        >
          Project
        </span>
        <span class="mt-1 block truncate text-base font-semibold tracking-[0.02em]">
          {{ projectTitle }}
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TopComponentProps {
  projectTitle: string
  projectLogo?: string
  projectLogoAlt?: string
}

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
} = defineProps<TopComponentProps>()

const projectAvatarLabel = computed(() => {
  const words = projectTitle.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    return (words[0] ?? '').slice(0, 1).toUpperCase() || '?'
  }

  const first = (words[0] ?? '').slice(0, 1)
  const last = (words[words.length - 1] ?? '').slice(0, 1)
  return `${first}${last}`.toUpperCase()
})
</script>
