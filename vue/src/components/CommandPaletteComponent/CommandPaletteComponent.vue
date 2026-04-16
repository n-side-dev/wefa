<template>
  <Dialog
    v-model:visible="isPaletteVisible"
    modal
    :dismissable-mask="true"
    :draggable="false"
    :closable="false"
    :style="{ width: 'min(42rem, 92vw)' }"
    :pt="{
      content: { class: 'pt-0' },
      root: { 'data-test': 'command-palette-dialog' },
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 w-full">
        <span class="text-base font-semibold text-zinc-950">
          {{ t('navigation.command_palette_title') }}
        </span>
        <span class="text-xs text-zinc-500">{{ t('navigation.command_palette_shortcut') }}</span>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <InputText
        id="wefa-command-palette-input"
        v-model="query"
        autocomplete="off"
        class="w-full"
        :placeholder="t('navigation.command_palette_search_placeholder')"
        :aria-label="t('navigation.command_palette_search_aria_label')"
        data-test="command-palette-search"
        @keydown="onSearchKeydown"
      />

      <Listbox
        v-if="filteredEntries.length > 0"
        v-model="selectedPath"
        :options="filteredEntries"
        option-label="label"
        option-value="path"
        data-key="path"
        list-style="max-height: 20rem"
        :aria-label="t('navigation.command_palette_results_aria_label')"
        data-test="command-palette-results"
        @update:model-value="onListboxSelection"
      >
        <template #option="{ option }">
          <div class="flex items-center justify-between gap-3 py-1 w-full">
            <div class="flex min-w-0 items-center gap-2">
              <i v-if="option.icon" class="pi text-zinc-500" :class="option.icon"></i>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-sm text-zinc-900">{{ option.label }}</span>
                <span class="truncate text-xs text-zinc-500">{{ option.path }}</span>
              </div>
            </div>
            <span v-if="option.section" class="text-xs text-zinc-500">
              {{ option.section }}
            </span>
          </div>
        </template>
      </Listbox>

      <div
        v-else
        class="rounded-md border border-dashed border-zinc-200 px-3 py-5 text-center text-sm text-zinc-500"
        data-test="command-palette-empty"
      >
        {{ t('navigation.command_palette_no_results') }}
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type RouteRecordRaw, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import { routeCommandPaletteEntries, type WeFaRouteEntry } from '@/router'
import { useI18nLib } from '@/locales'

const router = useRouter()
const { t } = useI18nLib()

const isPaletteVisible = ref(false)
const query = ref('')
const selectedPath = ref<string | null>(null)
const selectedIndex = ref(0)

const routeActions = computed<WeFaRouteEntry[]>(() => {
  return routeCommandPaletteEntries(router.options.routes as RouteRecordRaw[])
})

const filteredEntries = computed<WeFaRouteEntry[]>(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return routeActions.value
  }

  return routeActions.value.filter((entry) => {
    return `${entry.label} ${entry.path} ${entry.section ?? ''}`
      .toLowerCase()
      .includes(normalizedQuery)
  })
})

watch(
  filteredEntries,
  (entries) => {
    if (entries.length === 0) {
      selectedIndex.value = -1
      selectedPath.value = null
      return
    }

    if (selectedIndex.value < 0 || selectedIndex.value >= entries.length) {
      selectedIndex.value = 0
    }

    selectedPath.value = entries[selectedIndex.value]?.path ?? null
  },
  { immediate: true }
)

/**
 * Focuses the search input when the palette is opened.
 */
function focusSearchInput() {
  const input = document.getElementById('wefa-command-palette-input') as HTMLInputElement | null
  input?.focus()
}

/**
 * Opens the command palette and resets query/selection state.
 */
function openPalette() {
  isPaletteVisible.value = true
  query.value = ''
  selectedIndex.value = 0
  selectedPath.value = filteredEntries.value[0]?.path ?? null
  nextTick(() => focusSearchInput())
}

/**
 * Closes the command palette.
 */
function closePalette() {
  isPaletteVisible.value = false
}

/**
 * Toggles visibility of the command palette.
 */
function togglePalette() {
  if (isPaletteVisible.value) {
    closePalette()
    return
  }

  openPalette()
}

/**
 * Moves the active selection in the command list.
 * @param delta +1 to move down, -1 to move up
 */
function moveSelection(delta: number) {
  const entries = filteredEntries.value
  if (entries.length === 0) {
    return
  }

  const nextIndex = (selectedIndex.value + delta + entries.length) % entries.length
  selectedIndex.value = nextIndex
  selectedPath.value = entries[nextIndex]?.path ?? null
}

/**
 * Navigates to the provided path and closes the command palette.
 * @param path Router path to navigate to
 */
function executePath(path: string | null) {
  if (!path) {
    return
  }

  closePalette()
  router.push(path).catch(() => {
    // Ignore failed navigations (e.g. duplicate navigation to current route).
  })
}

/**
 * Executes the currently selected command entry.
 */
function executeSelectedEntry() {
  const entry = filteredEntries.value[selectedIndex.value]
  executePath(entry?.path ?? null)
}

/**
 * Handles mouse/listbox selection updates.
 * @param path Selected route path
 */
function onListboxSelection(path: string | null) {
  if (!path) {
    return
  }

  const index = filteredEntries.value.findIndex((entry) => entry.path === path)
  if (index >= 0) {
    selectedIndex.value = index
  }
  selectedPath.value = path
  executePath(path)
}

/**
 * Handles keyboard navigation while search input is focused.
 * @param event KeyboardEvent emitted from the search field
 */
function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveSelection(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveSelection(-1)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    executeSelectedEntry()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
  }
}

/**
 * Handles global keyboard shortcuts to open/close the command palette.
 * @param event KeyboardEvent emitted on window
 */
function onWindowKeydown(event: KeyboardEvent) {
  const key = event.key.toLowerCase()
  if ((event.metaKey || event.ctrlKey) && key === 'k') {
    event.preventDefault()
    togglePalette()
    return
  }

  if (isPaletteVisible.value && event.key === 'Escape') {
    event.preventDefault()
    closePalette()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>
