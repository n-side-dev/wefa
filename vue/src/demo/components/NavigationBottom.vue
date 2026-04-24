<template>
  <div class="wefa-nav-bottom flex flex-col gap-3">
    <div class="flex flex-col gap-1">
      <span class="text-xs font-medium uppercase tracking-wider text-(--p-text-on-dark-muted)">
        {{ $t('locale_selector.label') }}
      </span>
      <LocaleSelector />
    </div>

    <div class="flex flex-col gap-1">
      <span class="text-xs font-medium uppercase tracking-wider text-(--p-text-on-dark-muted)">
        {{ $t('demo.theme.label') }}
      </span>
      <ThemeSelector class="w-full" />
    </div>

    <Divider class="!my-1" />

    <div class="flex flex-col gap-2 text-(--p-text-on-dark)">
      <span class="truncate text-sm">
        {{ $t('demo.navigation.signed_in_as', { username }) }}
      </span>
      <Button
        :label="$t('demo.navigation.logout')"
        icon="pi pi-sign-out"
        size="small"
        class="wefa-nav-logout w-full"
        @click="handleLogout"
      />
    </div>

    <nav
      class="flex flex-col gap-1 pt-2 text-xs text-(--p-text-on-dark-muted)"
      :aria-label="$t('demo.legal.terms_of_use') + ', ' + $t('demo.legal.privacy_notice')"
    >
      <RouterLink :to="{ name: 'terms-of-use' }" class="wefa-nav-legal-link">
        {{ $t('demo.legal.terms_of_use') }}
      </RouterLink>
      <RouterLink :to="{ name: 'privacy-notice' }" class="wefa-nav-legal-link">
        {{ $t('demo.legal.privacy_notice') }}
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { LocaleSelector } from '@/plugins'
import { backendStore } from '@/demo/backendStore'
import ThemeSelector from '@/demo/components/ThemeSelector.vue'

const router = useRouter()

// The demo backend store does not expose user identity; use a placeholder
// until a user-profile endpoint is wired into the library's auth store.
const username = computed(() => 'demo')

/**
 * Sign the user out and send them back to the login page.
 */
async function handleLogout() {
  backendStore.logout()
  await router.push('/login')
}
</script>

<style scoped>
/*
 * The side nav is always dark (`--p-nav-side-gradient-*`), regardless of the
 * app-wide light/dark mode. Force the selectors and logout button to use the
 * nav's card/text tokens so they stay legible on either side of the theme
 * toggle.
 */
.wefa-nav-bottom :deep(.p-select) {
  background-color: var(--p-nav-card-bg);
  border-color: var(--p-nav-card-border);
  color: var(--p-text-on-dark);
}

.wefa-nav-bottom :deep(.p-select .p-select-label) {
  color: var(--p-text-on-dark);
}

.wefa-nav-bottom :deep(.p-select .p-select-dropdown) {
  color: var(--p-text-on-dark-muted);
}

/*
 * SelectButton: stretch the track to fill its container and make each option
 * take an equal share. Only the *checked* button carries a background — the
 * track itself stays transparent so we don't get a double-highlight effect.
 */
.wefa-nav-bottom :deep(.p-selectbutton) {
  display: flex;
  width: 100%;
  background-color: var(--p-nav-card-bg);
  border: 1px solid var(--p-nav-card-border);
  border-radius: var(--p-radius-md);
  overflow: hidden;
  padding: 2px;
  gap: 2px;
}

.wefa-nav-bottom :deep(.p-selectbutton .p-togglebutton) {
  flex: 1 1 0;
  background-color: transparent;
  color: var(--p-text-on-dark-muted);
  border: none;
  border-radius: calc(var(--p-radius-md) - 2px);
}

.wefa-nav-bottom :deep(.p-selectbutton .p-togglebutton .p-togglebutton-content) {
  background-color: transparent;
  border-radius: inherit;
}

.wefa-nav-bottom :deep(.p-selectbutton .p-togglebutton-checked) {
  background-color: var(--p-nav-hover-bg);
  color: var(--p-text-on-dark);
}

.wefa-nav-bottom :deep(.p-selectbutton .p-togglebutton-checked .p-togglebutton-content) {
  background-color: transparent;
}

/*
 * Logout button — PrimeVue's default `severity="secondary"` picks dark text
 * that disappears on the dark nav. Pin it to the on-dark text tokens instead.
 */
.wefa-nav-bottom :deep(.wefa-nav-logout) {
  background-color: var(--p-nav-card-bg);
  border-color: var(--p-nav-card-border);
  color: var(--p-text-on-dark);
}

.wefa-nav-bottom :deep(.wefa-nav-logout .p-button-label),
.wefa-nav-bottom :deep(.wefa-nav-logout .p-button-icon) {
  color: var(--p-text-on-dark);
}

.wefa-nav-bottom :deep(.wefa-nav-logout:hover) {
  background-color: var(--p-nav-hover-bg);
  border-color: var(--p-nav-card-border);
}

/*
 * Small legal links at the bottom of the nav. Subtle by default, underline on
 * hover/focus and match the nav's "on-dark" text tokens for legibility in
 * either app theme.
 */
.wefa-nav-legal-link {
  color: var(--p-text-on-dark-muted);
  text-decoration: none;
  transition: color 150ms ease;
}

.wefa-nav-legal-link:hover,
.wefa-nav-legal-link:focus-visible {
  color: var(--p-text-on-dark);
  text-decoration: underline;
}
</style>
