<template>
  <section
    class="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-5 py-8 text-(--p-text-color) sm:px-6 lg:px-8"
  >
    <div
      class="absolute inset-0 bg-[linear-gradient(180deg,#f7fbff_0%,#f4f7fc_48%,#eef3f0_100%)] dark:bg-[linear-gradient(180deg,#111b2f_0%,#152138_55%,#213938_100%)]"
    ></div>
    <div
      class="absolute left-[-14rem] top-[18%] size-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(32,183,204,0.16),rgba(32,183,204,0)_70%)] blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(32,183,204,0.2),rgba(32,183,204,0)_72%)]"
    ></div>
    <div
      class="absolute bottom-[-12rem] right-[-10rem] size-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(130,198,14,0.12),rgba(130,198,14,0)_72%)] blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(130,198,14,0.18),rgba(130,198,14,0)_74%)]"
    ></div>

    <div class="relative z-10 flex w-full max-w-[33rem] flex-col items-center">
      <img
        v-if="logoLight"
        :src="logoLight"
        :alt="logoAlt"
        class="mb-8 h-auto w-[15rem] dark:hidden"
      />
      <img
        v-if="logoDark"
        :src="logoDark"
        :alt="logoAlt"
        class="mb-8 hidden h-auto w-[15rem] dark:block"
      />

      <div
        class="w-full overflow-hidden rounded-[2rem] border border-[rgba(22,41,80,0.08)] bg-white/95 shadow-[0_30px_70px_-40px_rgba(22,41,80,0.28)] backdrop-blur-xl dark:border-[rgba(255,255,255,0.07)] dark:bg-[rgba(19,31,54,0.92)] dark:shadow-[0_28px_64px_-40px_rgba(4,10,26,0.82)]"
      >
        <div
          class="h-1 w-full bg-[linear-gradient(90deg,#19b8c9_0%,#78c019_100%)] dark:bg-[linear-gradient(90deg,#5bc0eb_0%,#e454a8_100%)]"
        ></div>

        <form class="px-8 py-8 sm:px-10 sm:py-9" @submit.prevent="handleSubmit">
          <h1
            class="max-w-[11ch] text-[2.5rem] font-semibold leading-[0.9] tracking-[-0.065em] text-(--p-surface-800) dark:text-white"
          >
            {{ t('login.title') }}
          </h1>

          <div class="mt-7 space-y-5">
            <div class="space-y-2.5">
              <label
                for="wefa-login-username"
                class="block text-[1rem] font-semibold tracking-[-0.02em] text-(--p-surface-600) dark:text-[rgba(233,239,255,0.8)]"
              >
                {{ t('form.username') }}
              </label>
              <InputText
                id="wefa-login-username"
                v-model="username"
                autocomplete="username"
                required
                autofocus
                :disabled="submitting"
                class="h-14 w-full rounded-[1rem] border border-(--p-border-soft) bg-white px-4 text-base text-(--p-surface-800) shadow-none transition-colors duration-150 placeholder:text-[rgba(83,95,107,0.7)] hover:border-(--p-border-color) focus:border-(--p-link-color) dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(13,21,37,0.88)] dark:text-white dark:placeholder:text-[rgba(229,236,245,0.32)] dark:hover:border-[rgba(255,255,255,0.14)]"
              />
            </div>

            <div class="space-y-2.5">
              <label
                for="wefa-login-password"
                class="block text-[1rem] font-semibold tracking-[-0.02em] text-(--p-surface-600) dark:text-[rgba(233,239,255,0.8)]"
              >
                {{ t('login.password') }}
              </label>
              <Password
                id="wefa-login-password"
                v-model="password"
                :feedback="false"
                toggle-mask
                autocomplete="current-password"
                required
                fluid
                :disabled="submitting"
                input-class="h-14 w-full rounded-[1rem] border border-(--p-border-soft) bg-white pl-4 pr-12 text-base text-(--p-surface-800) shadow-none transition-colors duration-150 placeholder:text-[rgba(83,95,107,0.7)] hover:border-(--p-border-color) focus:border-(--p-link-color) dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(13,21,37,0.88)] dark:text-white dark:placeholder:text-[rgba(229,236,245,0.32)] dark:hover:border-[rgba(255,255,255,0.14)]"
                class="wefa-login-password w-full"
              />
            </div>
          </div>

          <Button
            type="submit"
            :label="t('login.submit')"
            :loading="submitting"
            class="mt-8 h-14 w-full rounded-full border-0 !bg-[linear-gradient(180deg,#2b3f73_0%,#233969_100%)] !text-white shadow-[0_18px_38px_-24px_rgba(22,41,80,0.42)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-24px_rgba(22,41,80,0.48)] dark:!bg-[linear-gradient(90deg,#17b6c8_0%,#74bf18_100%)] dark:!text-[#12213b] dark:shadow-[0_14px_30px_-22px_rgba(23,182,200,0.34)] dark:hover:shadow-[0_18px_34px_-22px_rgba(23,182,200,0.38)]"
          />
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { useToast } from 'primevue/usetoast'
import type { BackendStore } from '@/stores'
import { useI18nLib } from '@/locales'

export interface LoginViewProps {
  /** Backend store instance used to authenticate. */
  backendStore: BackendStore
  /** Optional logo src for light theme. Hidden when the app is in dark mode. */
  logoLight?: string
  /** Optional logo src for dark theme. Hidden when the app is in light mode. */
  logoDark?: string
  /** Alt text applied to both logos. */
  logoAlt?: string
  /**
   * Fallback redirect path used after a successful login when no `redirect`
   * query parameter is present on the current route.
   */
  defaultRedirect?: string
  /**
   * Reserved for GDPR / consent wiring — accepted for forward-compatibility
   * with library consumers that already pass it.
   */
  gdpr?: boolean
}

const {
  backendStore,
  logoLight = '/WEFA_Horizontal_dark_logo.svg',
  logoDark = '/WEFA_Horizontal_white_logo.svg',
  logoAlt = 'WEFA',
  defaultRedirect = '/',
} = defineProps<LoginViewProps>()

const { t } = useI18nLib()
const router = useRouter()
const toast = useToast()

const username = ref('')
const password = ref('')
const submitting = ref(false)

/**
 * Submit the login form against the provided backend store, redirect to the
 * original target (via `?redirect=…`) or the configured default, and surface
 * failures via a toast.
 */
async function handleSubmit() {
  submitting.value = true
  try {
    await backendStore.login({ username: username.value, password: password.value })
    const redirect =
      (router.currentRoute.value.query.redirect as string | undefined) ?? defaultRedirect
    await router.push(redirect)
  } catch (error) {
    console.error('[wefa] login failed:', error)
    toast.add({
      severity: 'error',
      summary: t('login.error_summary'),
      detail: t('login.error_detail'),
      life: 5000,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
:deep(.wefa-login-password .p-inputtext) {
  width: 100%;
}

:deep(.wefa-login-password .p-password-toggle-mask-icon) {
  right: 1rem;
  color: color-mix(in srgb, var(--p-text-muted-color) 88%, transparent);
}
</style>
