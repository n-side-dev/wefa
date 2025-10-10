<template>
  <section>
    <Card class="w-full max-w-md">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {{ t('legal_consent.title') }}
          </h1>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300 text-center">
            {{ t('legal_consent.intro') }}
          </p>

          <div class="text-center space-y-2">
            <div>
              <router-link
                to="/terms-of-use"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                target="_blank"
              >
                {{ t('legal_consent.terms_of_use') }}
              </router-link>
            </div>
            <div>
              <router-link
                to="/privacy-notice"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                target="_blank"
              >
                {{ t('legal_consent.privacy_notice') }}
              </router-link>
            </div>
          </div>

          <div
            class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Checkbox v-model="acceptedTerms" input-id="consent-checkbox" :binary="true" />
            <label
              for="consent-checkbox"
              class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {{ t('legal_consent.checkbox_label') }}
            </label>
          </div>

          <div class="flex gap-3 pt-4">
            <Button
              :label="t('legal_consent.accept')"
              icon="pi pi-check"
              :disabled="!acceptedTerms"
              class="flex-1"
              severity="success"
              @click="handleAccept"
            />
            <Button
              :label="t('legal_consent.cancel')"
              icon="pi pi-times"
              severity="secondary"
              outlined
              class="flex-1"
              @click="handleCancel"
            />
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useLegalStore } from '@/plugins/legalConsent'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Card from 'primevue/card'
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
