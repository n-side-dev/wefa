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
      <div v-if="isAssistantEnabled" class="inline-flex items-center rounded-md bg-zinc-100 p-1">
        <button
          type="button"
          class="rounded px-3 py-1 text-sm font-medium transition"
          :class="activeMode === 'navigate' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'"
          data-test="command-palette-mode-navigate"
          @click="setPaletteMode('navigate')"
        >
          {{ t('navigation.command_palette_mode_navigate') }}
        </button>
        <button
          type="button"
          class="rounded px-3 py-1 text-sm font-medium transition"
          :class="activeMode === 'ask' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'"
          data-test="command-palette-mode-ask"
          @click="setPaletteMode('ask')"
        >
          {{ t('navigation.command_palette_mode_ask') }}
        </button>
      </div>

      <template v-if="activeMode === 'navigate'">
        <InputText
          id="wefa-command-palette-input"
          v-model="query"
          autocomplete="off"
          class="w-full"
          :placeholder="t('navigation.command_palette_search_placeholder')"
          :aria-label="t('navigation.command_palette_search_aria_label')"
          data-test="command-palette-search"
          @keydown="onNavigateSearchKeydown"
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
      </template>

      <template v-else>
        <InputText
          id="wefa-command-palette-input"
          v-model="askInput"
          autocomplete="off"
          class="w-full"
          :placeholder="askPlaceholder"
          :aria-label="t('navigation.command_palette_ask_aria_label')"
          data-test="command-palette-ask-input"
          @keydown="onAskKeydown"
        />

        <p class="text-xs text-zinc-500" data-test="command-palette-ask-help">
          {{ t('navigation.command_palette_ask_help') }}
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
            :disabled="isGeneratingRecipe || askInput.trim().length === 0"
            data-test="command-palette-ask-submit"
            @click="submitAskInput"
          >
            {{ t('navigation.command_palette_ask_submit') }}
          </button>
          <button
            v-if="activeRecipe"
            type="button"
            class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            data-test="command-palette-clear-recipe"
            @click="clearRecipeSession"
          >
            {{ t('navigation.command_palette_recipe_clear') }}
          </button>
        </div>

        <div
          v-if="isGeneratingRecipe"
          class="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600"
          data-test="command-palette-ask-loading"
        >
          {{ t('navigation.command_palette_ask_loading') }}
        </div>

        <div
          v-if="askState === 'error'"
          class="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700"
          data-test="command-palette-ask-error"
        >
          {{ askErrorMessage }}
        </div>

        <div
          v-if="askState === 'unsupported'"
          class="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700"
          data-test="command-palette-ask-unsupported"
        >
          {{ unsupportedMessage || t('navigation.command_palette_recipe_unsupported') }}
        </div>

        <div
          v-if="clarificationQuestions.length > 0"
          class="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3"
          data-test="command-palette-clarification"
        >
          <p class="mb-2 text-sm font-medium text-zinc-900">
            {{ t('navigation.command_palette_clarification_title') }}
          </p>
          <ul class="list-disc space-y-1 pl-5 text-sm text-zinc-700">
            <li
              v-for="question in clarificationQuestions"
              :key="question.id ?? question.text"
              data-test="command-palette-clarification-question"
            >
              {{ question.text }}
            </li>
          </ul>
        </div>

        <div
          v-if="activeRecipe"
          class="rounded-md border border-zinc-200 bg-white px-3 py-3"
          data-test="command-palette-recipe"
        >
          <p class="text-sm font-semibold text-zinc-900">
            {{ t('navigation.command_palette_recipe_title') }}
          </p>
          <p class="mt-1 text-sm text-zinc-700" data-test="command-palette-recipe-summary">
            {{ activeRecipe.summary }}
          </p>

          <ol class="mt-3 space-y-3">
            <li
              v-for="step in visibleRecipeSteps"
              :key="step.id"
              class="rounded-md border border-zinc-200 px-3 py-2"
              data-test="command-palette-recipe-step"
            >
              <p class="text-sm font-medium text-zinc-900">{{ step.title }}</p>
              <p v-if="step.description" class="mt-1 text-sm text-zinc-700">
                {{ step.description }}
              </p>
              <button
                v-if="step.target"
                type="button"
                class="mt-2 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                data-test="command-palette-recipe-step-action"
                @click="executeRecipeStep(step)"
              >
                {{ step.actionLabel || t('navigation.command_palette_recipe_open_step') }}
              </button>
            </li>
          </ol>

          <div
            v-if="activeRecipe.warnings?.length"
            class="mt-3"
            data-test="command-palette-warnings"
          >
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
              {{ t('navigation.command_palette_recipe_warnings') }}
            </p>
            <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-700">
              <li v-for="warning in activeRecipe.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>
        </div>

        <div
          v-if="showAskEmptyState"
          class="rounded-md border border-dashed border-zinc-200 px-3 py-5 text-center text-sm text-zinc-500"
          data-test="command-palette-ask-empty"
        >
          {{ t('navigation.command_palette_recipe_empty') }}
        </div>
      </template>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type RouteRecordRaw, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import {
  routeAssistantManifestEntries,
  routeCommandPaletteEntries,
  type WeFaAssistantManifestEntry,
  type WeFaRouteEntry,
} from '@/router'
import { useI18nLib } from '@/locales'
import type {
  CommandPaletteComponentProps,
  WefaAssistantClarificationQuestion,
  WefaAssistantRecipeResponse,
  WefaAssistantRecipeStep,
  WefaAssistantRouteTarget,
  WefaAssistantSessionSnapshot,
} from './CommandPaletteComponent.types'

const router = useRouter()
const { t } = useI18nLib()
const props = defineProps<CommandPaletteComponentProps>()

const isPaletteVisible = ref(false)
const query = ref('')
const selectedPath = ref<string | null>(null)
const selectedIndex = ref(0)
const activeMode = ref<'navigate' | 'ask'>('navigate')
const askInput = ref('')
const askState = ref<'idle' | 'loading' | 'clarification' | 'recipe' | 'unsupported' | 'error'>(
  'idle'
)
const clarificationQuestions = ref<WefaAssistantClarificationQuestion[]>([])
const activeRecipe = ref<WefaAssistantRecipeResponse | null>(null)
const unsupportedMessage = ref('')
const askErrorMessage = ref('')
const conversationToken = ref<string | undefined>(undefined)
const lastPrompt = ref('')

const isAssistantEnabled = computed(() => {
  return props.assistant?.enabled === true && typeof props.assistant.generateRecipe === 'function'
})

const routeAssistantManifest = computed<WeFaAssistantManifestEntry[]>(() => {
  return routeAssistantManifestEntries(router.options.routes as RouteRecordRaw[])
})

const routeManifestByDocId = computed(() => {
  const lookup = new Map<string, WeFaAssistantManifestEntry>()
  for (const entry of routeAssistantManifest.value) {
    if (!lookup.has(entry.docId)) {
      lookup.set(entry.docId, entry)
    }
  }
  return lookup
})

const sessionStorageKey = computed(() => {
  return props.assistant?.storageKey ?? 'wefa-command-palette-assistant-session'
})

const askPlaceholder = computed(() => {
  const key = props.assistant?.askPlaceholderKey ?? 'navigation.command_palette_ask_placeholder'
  return t(key)
})

const isGeneratingRecipe = computed(() => askState.value === 'loading')

const showAskEmptyState = computed(() => {
  return (
    askState.value === 'idle' &&
    !activeRecipe.value &&
    clarificationQuestions.value.length === 0 &&
    askInput.value.trim().length === 0
  )
})

const shouldResumeOnOpen = computed(() => props.assistant?.resumeOnOpen !== false)

const visibleRecipeSteps = computed<WefaAssistantRecipeStep[]>(() => {
  if (!activeRecipe.value) {
    return []
  }

  const maxSteps = props.assistant?.maxRecipeStepsVisible
  if (!maxSteps || maxSteps <= 0) {
    return activeRecipe.value.steps
  }

  return activeRecipe.value.steps.slice(0, maxSteps)
})

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
  if (isAssistantEnabled.value && shouldResumeOnOpen.value && restoreAssistantSession()) {
    activeMode.value = 'ask'
    nextTick(() => focusSearchInput())
    return
  }

  activeMode.value = 'navigate'
  resetNavigationState()
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
 * Switches between route search and assistant modes.
 * @param mode Palette mode to activate
 */
function setPaletteMode(mode: 'navigate' | 'ask') {
  if (mode === 'ask' && !isAssistantEnabled.value) {
    return
  }

  activeMode.value = mode

  if (mode === 'navigate') {
    resetNavigationState()
  }

  nextTick(() => focusSearchInput())
}

/**
 * Resets the route-search state to its initial values.
 */
function resetNavigationState() {
  query.value = ''
  selectedIndex.value = 0
  selectedPath.value = filteredEntries.value[0]?.path ?? null
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
function onNavigateSearchKeydown(event: KeyboardEvent) {
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
 * Handles keyboard shortcuts while the assistant input is focused.
 * @param event KeyboardEvent emitted from the ask field
 */
function onAskKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    void submitAskInput()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
  }
}

/**
 * Submits the assistant prompt or the current clarification answer.
 * @returns Promise resolved when the backend response has been processed
 */
async function submitAskInput() {
  if (!isAssistantEnabled.value || !props.assistant) {
    return
  }

  const normalizedInput = askInput.value.trim()
  if (!normalizedInput) {
    return
  }

  const isClarificationTurn =
    askState.value === 'clarification' && !!conversationToken.value && !!lastPrompt.value
  const prompt = isClarificationTurn ? lastPrompt.value : normalizedInput
  const answers = isClarificationTurn ? [normalizedInput] : undefined

  if (!isClarificationTurn) {
    lastPrompt.value = prompt
    clarificationQuestions.value = []
    activeRecipe.value = null
    unsupportedMessage.value = ''
  }

  askState.value = 'loading'
  askErrorMessage.value = ''

  try {
    const response = await props.assistant.generateRecipe({
      prompt,
      answers,
      conversationToken: conversationToken.value,
      routeManifest: routeAssistantManifest.value,
      currentRoute: {
        name: router.currentRoute.value.name ? String(router.currentRoute.value.name) : undefined,
        path: router.currentRoute.value.path,
      },
    })

    askInput.value = ''

    if (response.status === 'needs_clarification') {
      askState.value = 'clarification'
      conversationToken.value = response.conversationToken
      clarificationQuestions.value = response.questions.map((question, index) => {
        if (typeof question === 'string') {
          return {
            id: String(index),
            text: question,
          }
        }

        return {
          id: question.id ?? String(index),
          text: question.text,
        }
      })
      return
    }

    if (response.status === 'recipe') {
      askState.value = 'recipe'
      clarificationQuestions.value = []
      conversationToken.value = response.conversationToken
      activeRecipe.value = response
      persistAssistantSession()
      return
    }

    askState.value = 'unsupported'
    clarificationQuestions.value = []
    activeRecipe.value = null
    unsupportedMessage.value = response.message
    removeAssistantSession()
  } catch {
    askState.value = 'error'
    askErrorMessage.value = t('navigation.command_palette_ask_error')
  }
}

/**
 * Persists the latest generated recipe so reopening the palette restores it.
 */
function persistAssistantSession() {
  if (!activeRecipe.value) {
    return
  }

  const snapshot: WefaAssistantSessionSnapshot = {
    mode: 'ask',
    prompt: lastPrompt.value,
    conversationToken: conversationToken.value,
    recipe: activeRecipe.value,
  }

  try {
    window.sessionStorage.setItem(sessionStorageKey.value, JSON.stringify(snapshot))
  } catch {
    // Ignore storage failures (private browsing, storage disabled, quota exceeded).
  }
}

/**
 * Removes any persisted assistant session snapshot from session storage.
 */
function removeAssistantSession() {
  try {
    window.sessionStorage.removeItem(sessionStorageKey.value)
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Restores the previously persisted assistant recipe when available.
 * @returns `true` when a stored recipe was restored, otherwise `false`
 */
function restoreAssistantSession() {
  if (!isAssistantEnabled.value) {
    return false
  }

  try {
    const snapshotRaw = window.sessionStorage.getItem(sessionStorageKey.value)
    if (!snapshotRaw) {
      return false
    }

    const snapshot = JSON.parse(snapshotRaw) as WefaAssistantSessionSnapshot
    if (!snapshot.recipe || snapshot.recipe.status !== 'recipe') {
      return false
    }

    activeMode.value = snapshot.mode === 'ask' ? 'ask' : 'navigate'
    lastPrompt.value = snapshot.prompt
    askState.value = 'recipe'
    clarificationQuestions.value = []
    conversationToken.value = snapshot.conversationToken
    activeRecipe.value = snapshot.recipe
    askInput.value = ''
    return true
  } catch {
    return false
  }
}

/**
 * Clears the in-memory and persisted assistant state.
 */
function clearRecipeSession() {
  removeAssistantSession()
  askState.value = 'idle'
  activeRecipe.value = null
  clarificationQuestions.value = []
  unsupportedMessage.value = ''
  askErrorMessage.value = ''
  conversationToken.value = undefined
  lastPrompt.value = ''
  askInput.value = ''
}

/**
 * Navigates to the route described by a generated recipe step.
 * @param step Recipe step to execute
 */
function executeRecipeStep(step: WefaAssistantRecipeStep) {
  if (!step.target) {
    return
  }

  const routeTarget = resolveAssistantRouteTarget(step.target)
  if (!routeTarget) {
    return
  }

  closePalette()
  router.push(routeTarget).catch(() => {
    // Ignore failed navigations (e.g. duplicate navigation to current route).
  })
}

/**
 * Resolves a recipe target into a Vue Router location.
 * @param target Recipe target describing how to reach the linked UI step
 * @returns Router target or `null` when the target cannot be resolved
 */
function resolveAssistantRouteTarget(target: WefaAssistantRecipeStep['target']) {
  if (!target) {
    return null
  }

  if (target.path) {
    return {
      path: interpolateRoutePath(target.path, target.params),
      query: target.query,
    } satisfies WefaAssistantRouteTarget
  }

  if (target.name) {
    return {
      name: target.name,
      params: target.params,
      query: target.query,
    } satisfies WefaAssistantRouteTarget
  }

  const manifestEntry = routeManifestByDocId.value.get(target.docId)
  if (!manifestEntry) {
    return null
  }

  if (manifestEntry.routeName) {
    return {
      name: manifestEntry.routeName,
      params: target.params,
      query: target.query,
    } satisfies WefaAssistantRouteTarget
  }

  return {
    path: interpolateRoutePath(manifestEntry.pathTemplate, target.params),
    query: target.query,
  } satisfies WefaAssistantRouteTarget
}

/**
 * Applies route params to a path template when a named route is not available.
 * @param pathTemplate Route path template, for example `/products/:id`
 * @param params Route params to inject into the template
 * @returns Concrete path ready to pass to Vue Router
 */
function interpolateRoutePath(
  pathTemplate: string,
  params: Record<string, string | number> | undefined
): string {
  if (!params) {
    return pathTemplate
  }

  return pathTemplate.replace(/:(\w+)/g, (fullMatch, key: string) => {
    if (!(key in params)) {
      return fullMatch
    }

    return encodeURIComponent(String(params[key]))
  })
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
