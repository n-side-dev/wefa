<template>
  <section
    class="relative isolate min-h-svh overflow-hidden px-5 py-10 text-(--p-text-color) sm:px-6 lg:px-8"
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

    <div class="relative z-10 mx-auto flex w-full max-w-[52rem] flex-col">
      <router-link
        v-if="!legalStore.legalConsent?.valid"
        to="/legal-consent"
        class="mb-6 inline-flex w-fit items-center gap-2 text-[0.9rem] font-medium text-(--p-link-color) hover:underline dark:text-[rgba(91,192,235,0.95)]"
      >
        <i class="pi pi-arrow-left text-[0.8rem]" aria-hidden="true"></i>
        {{ t('legal_consent.back_to_consent') }}
      </router-link>

      <div
        class="overflow-hidden rounded-[2rem] border border-[rgba(22,41,80,0.08)] bg-white/95 shadow-[0_30px_70px_-40px_rgba(22,41,80,0.28)] backdrop-blur-xl dark:border-[rgba(255,255,255,0.07)] dark:bg-[rgba(19,31,54,0.92)] dark:shadow-[0_28px_64px_-40px_rgba(4,10,26,0.82)]"
      >
        <div
          class="h-1 w-full bg-[linear-gradient(90deg,#19b8c9_0%,#78c019_100%)] dark:bg-[linear-gradient(90deg,#5bc0eb_0%,#e454a8_100%)]"
        ></div>

        <div class="px-8 py-9 sm:px-12 sm:py-11">
          <Skeleton v-if="isLoading" width="100%" height="14rem" />
          <div
            id="legal-document"
            ref="legal-document"
            class="legal-document text-(--p-surface-700) dark:text-[rgba(229,236,245,0.85)]"
            :class="classes"
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { apiClient } from '@/network'
import { onMounted, type Ref, ref, useTemplateRef, watch } from 'vue'
import { useLegalStore } from '@/plugins/legalConsent'
import { marked } from 'marked'
import Skeleton from 'primevue/skeleton'
import { applyMarkdownClasses } from '@/utils/markdown.ts'
import { useI18nLib } from '@/locales'

export interface LegalDocumentProps {
  classes?: string
  documentEndpoint: string
}

const legalStore = useLegalStore()
const legalDocumentContainer = useTemplateRef('legal-document')
const { classes = '', documentEndpoint } = defineProps<LegalDocumentProps>()
const { t } = useI18nLib()

const { data, isLoading } = apiClient.query(
  ref(`${legalStore.legalEndpoint}/${documentEndpoint}`)
) as {
  data: Ref<string | undefined>
  isLoading: Ref<boolean>
}

watch(data, () => {
  insertMarkdown(data)
})

onMounted(() => {
  insertMarkdown(data)
})

/**
 * Function to insert markdown data into the legal document container
 * @param data A ref containing the markdown data
 */
function insertMarkdown(data: Ref<string | undefined>) {
  if (data.value) {
    legalDocumentContainer.value!.innerHTML = marked.parse(data.value) as string
    // Apply classes to the dynamically generated elements
    applyMarkdownClasses(legalDocumentContainer.value!)
  }
}
</script>
