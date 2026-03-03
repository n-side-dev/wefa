<template>
  <div class="flex flex-col border-b border-zinc-950/5 p-4">
    <div class="flex flex-row items-center justify-between gap-3 rounded-lg px-2 py-2.5">
      <span
        class="inline-flex size-8 shrink-0 items-center justify-center rounded-sm border border-zinc-300 bg-orange-100 align-middle text-sm/5 font-semibold text-zinc-700"
      >
        {{ projectAvatarLabel }}
      </span>
      <span class="grow truncate">
        <span class="block truncate text-md/5 font-medium text-zinc-950">{{ projectTitle }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TopComponentProps {
  projectTitle: string
}

const { projectTitle } = defineProps<TopComponentProps>()

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
