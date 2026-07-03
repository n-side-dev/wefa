<template>
  <aside
    id="wefa-side-navigation"
    :class="[
      'relative z-[2] hidden px-3 pt-3 lg:block lg:shrink-0 lg:px-0 lg:pt-0',
      'transition-[width] duration-300 ease-out',
      collapsed ? 'lg:w-[4.5rem]' : 'lg:w-[19rem]',
    ]"
  >
    <nav
      :class="[
        'flex overflow-visible rounded-[calc(var(--p-radius-lg)-6px)] border border-(--p-border-contrast-soft) bg-[linear-gradient(180deg,var(--p-nav-side-top-glow),transparent_24%),linear-gradient(160deg,var(--p-nav-side-highlight),transparent_24%),linear-gradient(180deg,var(--p-nav-side-gradient-start)_0%,var(--p-nav-side-gradient-end)_100%)] shadow-[0_30px_70px_-42px_rgba(8,16,38,0.7)] lg:fixed lg:top-4 lg:bottom-4 lg:flex-col',
        'transition-[width] duration-300 ease-out',
        collapsed ? 'lg:w-[4.5rem]' : 'lg:w-[19rem]',
      ]"
    >
      <TopComponent
        :project-title="projectTitle"
        :project-logo="projectLogo"
        :project-logo-alt="projectLogoAlt"
        :collapsed="collapsed"
      />
      <MainComponent :collapsed="collapsed" />
      <div
        :class="[
          'border-t border-(--p-border-contrast-soft)',
          collapsed ? 'p-3 lg:p-3' : 'p-4 lg:p-5',
        ]"
      >
        <slot name="bottom" :collapsed="collapsed">
          <BottomComponent :collapsed="collapsed" />
        </slot>
      </div>
      <div
        v-if="collapsible"
        :class="[
          'border-t border-(--p-border-contrast-soft)',
          collapsed ? 'p-2 lg:p-2' : 'p-3 lg:p-3',
        ]"
      >
        <button
          v-tooltip.right="collapsed ? 'Expand navigation' : undefined"
          type="button"
          data-test="side-nav-toggle"
          :aria-pressed="collapsed"
          :aria-label="collapsed ? 'Expand navigation' : 'Collapse navigation'"
          :class="[
            'flex w-full cursor-pointer items-center rounded-[1.1rem] text-sm font-medium text-(--p-nav-text) hover:bg-(--p-nav-hover-bg) hover:text-(--p-text-on-dark) transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--p-teal)',
            collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2.5',
          ]"
          @click="toggleSideNav"
        >
          <i
            class="pi text-base transition-transform duration-300 ease-out"
            :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-left'"
          />
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-x-1"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <span v-if="!collapsed" class="truncate">Collapse</span>
          </Transition>
        </button>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import Tooltip from 'primevue/tooltip'
import BottomComponent from '@/containers/LayoutContainer/SideNavigationComponent/BottomComponent/BottomComponent.vue'
import TopComponent from '@/containers/LayoutContainer/SideNavigationComponent/TopComponent/TopComponent.vue'
import MainComponent from '@/containers/LayoutContainer/SideNavigationComponent/MainComponent/MainComponent.vue'

const vTooltip = Tooltip

export interface SideNavigationComponentProps {
  projectTitle: string
  projectLogo?: string
  projectLogoAlt?: string
  /**
   * When true the rail shows a Collapse/Expand toggle button at the bottom,
   * persists the user's choice to localStorage, and listens for Cmd/Ctrl+B
   * globally. When false (the default) the rail is fixed at its expanded
   * width and no toggle UI or keyboard shortcut is exposed.
   */
  collapsible?: boolean
}

const {
  projectTitle,
  projectLogo = undefined,
  projectLogoAlt = undefined,
  collapsible = false,
} = defineProps<SideNavigationComponentProps>()

// Persisted state is only meaningful when the rail can actually collapse.
// Skip the localStorage subscription entirely otherwise.
const persistedCollapsed = collapsible
  ? useLocalStorage<boolean>('wefa-side-nav-collapsed', false)
  : null

const collapsed = computed(() => persistedCollapsed?.value ?? false)

/**
 * Toggle the persisted collapsed state when the rail is collapsible.
 */
function toggleSideNav() {
  if (!persistedCollapsed) {
    return
  }
  persistedCollapsed.value = !persistedCollapsed.value
}

/**
 * True when the element (or any ancestor) is a form field or contenteditable
 * region — meaning Cmd/Ctrl+B should be left for the user, not stolen by us.
 * @param target Event target from the keyboard interaction.
 * @returns Whether the target belongs to editable content.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }
  let current: Element | null = target
  while (current) {
    const tag = current.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return true
    }
    if (current instanceof HTMLElement && current.isContentEditable) {
      return true
    }
    const attr = current.getAttribute('contenteditable')
    if (attr !== null && attr !== 'false') {
      return true
    }
    current = current.parentElement
  }
  return false
}

/**
 * Toggles the rail with Cmd/Ctrl+B unless focus is in an editable element.
 * @param event Keyboard event from the global shortcut listener.
 */
function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'b' && event.key !== 'B') {
    return
  }

  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
    return
  }

  if (isEditableTarget(event.target)) {
    return
  }

  event.preventDefault()
  toggleSideNav()
}

// Only attach the global shortcut when the rail can actually collapse —
// otherwise we'd be silently swallowing Cmd/Ctrl+B for no observable effect.
onMounted(() => {
  if (collapsible) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (collapsible) {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
