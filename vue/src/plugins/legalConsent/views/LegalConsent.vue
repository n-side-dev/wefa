<template>
  <section
    class="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-5 py-10 text-(--p-text-color) sm:px-6 lg:px-8"
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
    <div
      class="absolute right-[20%] top-[-8rem] size-[18rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,72,160,0.1),rgba(255,72,160,0)_70%)] blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(255,72,160,0.18),rgba(255,72,160,0)_72%)]"
    ></div>

    <div class="relative z-10 flex w-full max-w-[36rem] flex-col items-center">
      <img
        src="/WEFA_Horizontal_dark_logo.svg"
        alt="WEFA"
        class="mb-8 h-auto w-[15rem] dark:hidden"
      />
      <img
        src="/WEFA_Horizontal_white_logo.svg"
        alt="WEFA"
        class="mb-8 hidden h-auto w-[15rem] dark:block"
      />

      <div
        class="w-full overflow-hidden rounded-[2rem] border border-[rgba(22,41,80,0.08)] bg-white/95 shadow-[0_30px_70px_-40px_rgba(22,41,80,0.28)] backdrop-blur-xl dark:border-[rgba(255,255,255,0.07)] dark:bg-[rgba(19,31,54,0.92)] dark:shadow-[0_28px_64px_-40px_rgba(4,10,26,0.82)]"
      >
        <div
          class="h-1 w-full bg-[linear-gradient(90deg,#19b8c9_0%,#78c019_100%)] dark:bg-[linear-gradient(90deg,#5bc0eb_0%,#e454a8_100%)]"
        ></div>

        <div class="px-8 py-8 sm:px-10 sm:py-9">
          <h1
            class="text-[2rem] font-semibold leading-[0.95] tracking-[-0.05em] text-(--p-surface-800) dark:text-white"
          >
            {{ t('legal_consent.title') }}
          </h1>

          <p
            class="mt-5 text-[1rem] leading-relaxed text-(--p-surface-600) dark:text-[rgba(233,239,255,0.78)]"
          >
            {{ t('legal_consent.intro') }}
          </p>

          <div class="mt-7 grid gap-3 sm:grid-cols-2">
            <router-link
              to="/terms-of-use"
              target="_blank"
              class="group flex items-start gap-3 rounded-[1rem] border border-(--p-border-soft) bg-(--p-surface-0) p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-(--p-link-color) hover:shadow-[0_14px_30px_-22px_rgba(22,41,80,0.32)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(13,21,37,0.78)] dark:hover:border-[rgba(91,192,235,0.55)]"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(25,184,201,0.12)] text-(--p-link-color) dark:bg-[rgba(91,192,235,0.18)]"
              >
                <i class="pi pi-file" aria-hidden="true"></i>
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span
                  class="text-[0.95rem] font-semibold leading-tight text-(--p-surface-800) dark:text-white"
                >
                  {{ t('legal_consent.terms_of_use') }}
                </span>
                <span
                  class="mt-0.5 inline-flex items-center gap-1 text-[0.8rem] text-(--p-surface-500) dark:text-[rgba(229,236,245,0.55)]"
                >
                  <i class="pi pi-external-link text-[0.7rem]" aria-hidden="true"></i>
                  {{ t('legal_consent.open_in_new_tab') }}
                </span>
              </span>
            </router-link>
            <router-link
              to="/privacy-notice"
              target="_blank"
              class="group flex items-start gap-3 rounded-[1rem] border border-(--p-border-soft) bg-(--p-surface-0) p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-(--p-link-color) hover:shadow-[0_14px_30px_-22px_rgba(22,41,80,0.32)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(13,21,37,0.78)] dark:hover:border-[rgba(91,192,235,0.55)]"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(255,72,160,0.12)] text-[#bc3f7d] dark:bg-[rgba(255,72,160,0.18)] dark:text-[#ff8fc1]"
              >
                <i class="pi pi-shield" aria-hidden="true"></i>
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span
                  class="text-[0.95rem] font-semibold leading-tight text-(--p-surface-800) dark:text-white"
                >
                  {{ t('legal_consent.privacy_notice') }}
                </span>
                <span
                  class="mt-0.5 inline-flex items-center gap-1 text-[0.8rem] text-(--p-surface-500) dark:text-[rgba(229,236,245,0.55)]"
                >
                  <i class="pi pi-external-link text-[0.7rem]" aria-hidden="true"></i>
                  {{ t('legal_consent.open_in_new_tab') }}
                </span>
              </span>
            </router-link>
          </div>

          <label
            for="consent-checkbox"
            class="mt-6 flex cursor-pointer items-center gap-3 rounded-[1rem] border border-(--p-border-soft) bg-(--p-surface-0) px-4 py-3.5 transition-colors duration-150 hover:border-(--p-border-color) dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(13,21,37,0.78)] dark:hover:border-[rgba(255,255,255,0.14)]"
          >
            <Checkbox v-model="acceptedTerms" input-id="consent-checkbox" :binary="true" />
            <span class="text-[0.95rem] text-(--p-surface-700) dark:text-[rgba(233,239,255,0.85)]">
              {{ t('legal_consent.checkbox_label') }}
            </span>
          </label>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              :label="t('legal_consent.accept')"
              icon="pi pi-check"
              :disabled="!acceptedTerms"
              class="wefa-legal-accept order-1 h-14 flex-1 rounded-full border-0 !bg-[linear-gradient(180deg,#2b3f73_0%,#233969_100%)] !text-white shadow-[0_18px_38px_-24px_rgba(22,41,80,0.42)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-24px_rgba(22,41,80,0.48)] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none dark:!bg-[linear-gradient(90deg,#17b6c8_0%,#74bf18_100%)] dark:!text-[#12213b] dark:shadow-[0_14px_30px_-22px_rgba(23,182,200,0.34)] dark:hover:shadow-[0_18px_34px_-22px_rgba(23,182,200,0.38)]"
              @click="handleAccept"
            />
            <Button
              :label="t('legal_consent.cancel')"
              icon="pi pi-times"
              severity="secondary"
              outlined
              class="order-2 h-14 flex-1 rounded-full"
              @click="handleCancel"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useLegalStore } from '@/plugins/legalConsent'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { backendStore } from '@/demo/backendStore.ts'
import { useI18nLib } from '@/locales'

const router = useRouter()

const redirectedFrom = router.currentRoute.value.redirectedFrom
const legalStore = useLegalStore()
const toast = useToast()
const confirm = useConfirm()
const acceptedTerms = ref(false)
const { t } = useI18nLib()

const handleAccept = async () => {
  try {
    await legalStore.acceptLegalConsent()
    const redirectTarget = redirectedFrom ? { path: redirectedFrom.path } : '/'
    router.push(redirectTarget).then(() => {
      toast.add({
        severity: 'success',
        summary: t('legal_consent.toast_accept_summary'),
        detail: t('legal_consent.toast_accept_detail'),
        life: 5000,
      })
    })
  } catch (error) {
    console.error('Failed to accept legal consent:', error)
    toast.add({
      severity: 'error',
      summary: t('legal_consent.error_summary'),
      detail: t('legal_consent.error_detail'),
      life: 5000,
    })
  }
}

const handleCancel = () => {
  confirm.require({
    message: t('legal_consent.confirm_message'),
    header: t('legal_consent.confirm_header'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: t('legal_consent.reject_label'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('legal_consent.accept_label'),
      severity: 'danger',
    },
    accept: () => {
      toast.add({
        severity: 'warn',
        summary: t('legal_consent.disconnected_summary'),
        detail: t('legal_consent.disconnected_detail'),
        life: 5000,
      })
      backendStore.logout()
    },
  })
}
</script>

<style scoped>
:deep(.wefa-legal-accept .p-button-icon),
:deep(.wefa-legal-accept .p-button-label) {
  color: inherit;
}
</style>
