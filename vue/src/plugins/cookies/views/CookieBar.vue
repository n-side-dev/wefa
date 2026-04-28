<template>
  <div
    v-if="cookiesStore.reviewNeeded"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[1000] px-3 pb-3 sm:px-5 sm:pb-5"
  >
    <div
      class="pointer-events-auto mx-auto flex max-w-[64rem] flex-col overflow-hidden rounded-[1.5rem] border border-(--p-border-contrast) bg-[linear-gradient(180deg,var(--p-surface-glass),var(--p-surface-glass-strong)),var(--p-surface-0)] shadow-[0_24px_60px_-24px_rgba(22,41,80,0.32)] backdrop-blur-[14px] dark:shadow-[0_28px_64px_-32px_rgba(4,10,26,0.85)]"
    >
      <div
        class="h-1 w-full bg-[linear-gradient(90deg,#19b8c9_0%,#78c019_100%)] dark:bg-[linear-gradient(90deg,#5bc0eb_0%,#e454a8_100%)]"
      ></div>

      <div
        class="flex flex-col gap-5 px-5 py-4 sm:px-7 sm:py-5 md:flex-row md:items-center md:gap-8"
      >
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <span
            class="hidden size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(25,184,201,0.12)] text-(--p-link-color) dark:bg-[rgba(91,192,235,0.18)] sm:flex"
          >
            <i class="pi pi-cog" aria-hidden="true"></i>
          </span>
          <div class="min-w-0">
            <h4
              class="text-[1.05rem] font-semibold tracking-[-0.01em] text-(--p-surface-800) dark:text-white"
            >
              {{ t('cookies.title') }}
            </h4>
            <p
              class="mt-1 text-[0.875rem] leading-relaxed text-(--p-surface-600) dark:text-[rgba(229,236,245,0.72)]"
            >
              {{ t('cookies.bar_message') }}
            </p>
          </div>
        </div>

        <div class="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
          <Button
            :label="t('cookies.manage_preferences')"
            severity="secondary"
            text
            class="order-3 h-11 rounded-full px-4 !text-(--p-surface-700) hover:!bg-(--p-surface-100) dark:!text-[rgba(233,239,255,0.92)] dark:hover:!bg-[rgba(255,255,255,0.06)] sm:order-1"
            @click="openPreferences"
          />
          <Button
            :label="t('cookies.reject_all')"
            severity="secondary"
            outlined
            class="wefa-cookies-reject order-2 h-11 rounded-full !border-(--p-border-color) px-5 !text-(--p-surface-700) hover:!bg-(--p-surface-100) hover:!border-(--p-surface-400) dark:!border-[rgba(229,236,245,0.28)] dark:!text-[rgba(233,239,255,0.92)] dark:hover:!bg-[rgba(255,255,255,0.06)] dark:hover:!border-[rgba(229,236,245,0.45)]"
            @click="cookiesStore.rejectAllCookies"
          />
          <Button
            :label="t('cookies.accept_all')"
            class="wefa-cookies-accept order-1 h-11 rounded-full border-0 px-6 !bg-[linear-gradient(180deg,#2b3f73_0%,#233969_100%)] !text-white shadow-[0_14px_30px_-22px_rgba(22,41,80,0.42)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-22px_rgba(22,41,80,0.48)] dark:!bg-[linear-gradient(90deg,#17b6c8_0%,#74bf18_100%)] dark:!text-[#12213b] dark:shadow-[0_12px_26px_-22px_rgba(23,182,200,0.34)] sm:order-3"
            @click="cookiesStore.acceptAllCookies"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { useCookiesStore } from '../index'
import { useI18nLib } from '@/locales'

const cookiesStore = useCookiesStore()
const { t } = useI18nLib()

// Open the detailed preferences dialog
const openPreferences = () => {
  cookiesStore.showDialog()
}
</script>

<style scoped>
:deep(.wefa-cookies-accept .p-button-icon),
:deep(.wefa-cookies-accept .p-button-label) {
  color: inherit;
}
</style>
